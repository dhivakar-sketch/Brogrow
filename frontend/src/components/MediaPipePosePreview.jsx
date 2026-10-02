import { useEffect, useRef, useState } from 'react'
import { DrawingUtils, FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-1/wasm'
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

/**
 * Browser-side MediaPipe pose preview.
 * This displays only landmarks returned by the actual model; it does not score technique.
 */
export default function MediaPipePosePreview({ file }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const landmarkerRef = useRef(null)
  const frameRef = useRef(0)
  const lastVideoTimeRef = useRef(-1)
  const [modelState, setModelState] = useState('loading')
  const [error, setError] = useState('')
  const [poseCount, setPoseCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    let landmarker
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const drawing = ctx ? new DrawingUtils(ctx) : null
    const objectUrl = URL.createObjectURL(file)
    if (video) video.src = objectUrl

    const stopLoop = () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      frameRef.current = 0
    }

    const detectFrame = () => {
      if (cancelled || !video || !canvas || !drawing || !landmarkerRef.current) return
      if (video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        try {
          const result = landmarkerRef.current.detectForVideo(video, performance.now())
          const poses = result.landmarks || []
          setPoseCount(poses.length)
          for (const landmarks of poses) {
            drawing.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, { color: '#22c55e', lineWidth: 3 })
            drawing.drawLandmarks(landmarks, { color: '#38bdf8', lineWidth: 1, radius: 3 })
          }
        } catch (err) {
          setError(err?.message || 'Pose detection failed for this frame.')
          stopLoop()
          return
        }
      }
      frameRef.current = requestAnimationFrame(detectFrame)
    }

    const startLoop = () => {
      stopLoop()
      frameRef.current = requestAnimationFrame(detectFrame)
    }

    async function initialize() {
      try {
        setModelState('loading')
        setError('')
        const fileset = await FilesetResolver.forVisionTasks(WASM_URL)
        landmarker = await PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        })
        if (cancelled) {
          landmarker.close()
          return
        }
        landmarkerRef.current = landmarker
        setModelState('ready')
        if (video && !video.paused) startLoop()
      } catch (err) {
        if (cancelled) return
        // Retry on CPU for browsers without a usable WebGL delegate.
        try {
          const fileset = await FilesetResolver.forVisionTasks(WASM_URL)
          landmarker = await PoseLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' },
            runningMode: 'VIDEO',
            numPoses: 1,
          })
          if (cancelled) {
            landmarker.close()
            return
          }
          landmarkerRef.current = landmarker
          setModelState('ready')
          if (video && !video.paused) startLoop()
        } catch (fallbackError) {
          if (!cancelled) {
            setModelState('error')
            setError(fallbackError?.message || err?.message || 'Unable to load the MediaPipe pose model.')
          }
        }
      }
    }

    video?.addEventListener('play', startLoop)
    video?.addEventListener('pause', stopLoop)
    video?.addEventListener('ended', stopLoop)
    initialize()

    return () => {
      cancelled = true
      stopLoop()
      video?.removeEventListener('play', startLoop)
      video?.removeEventListener('pause', stopLoop)
      video?.removeEventListener('ended', stopLoop)
      landmarkerRef.current?.close()
      landmarkerRef.current = null
      if (landmarker && landmarker !== landmarkerRef.current) {
        try { landmarker.close() } catch { /* already closed */ }
      }
      URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  return (
    <div className="mediapipe-preview" style={{ marginTop: 18, padding: 16, border: '1px solid var(--border-color, #334155)', borderRadius: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <strong>MediaPipe pose preview</strong>
        <span className="muted" role="status">{modelState === 'loading' ? 'Loading model…' : modelState === 'ready' ? 'Model ready' : 'Model unavailable'}</span>
      </div>
      <p className="muted" style={{ margin: '0 0 12px', fontSize: 13 }}>Play the video to detect and overlay body landmarks in your browser.</p>
      <div style={{ position: 'relative', width: '100%', background: '#020617', borderRadius: 10, overflow: 'hidden' }}>
        <video ref={videoRef} controls playsInline preload="metadata" style={{ display: 'block', width: '100%', maxHeight: 480 }} />
        <canvas ref={canvasRef} aria-label="Detected pose landmarks" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
      </div>
      <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>People detected in current frame: {poseCount}</div>
      {error && <p role="alert" style={{ color: '#ef4444', marginBottom: 0 }}>MediaPipe: {error}</p>}
    </div>
  )
}
