import React, { useEffect, useRef, useState } from 'react'

const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:8080/api').replace(/\/$/, '')
const TOKEN_KEY = 'sportsTalentAuth'
const MAX_VIDEO_BYTES = 100 * 1024 * 1024
const POLL_INTERVAL_MS = 1500
const MAX_POLL_ATTEMPTS = 400

const statusCopy = {
  idle: 'Ready for upload',
  uploading: 'Uploading video',
  analyzing: 'Analyzing video',
  complete: 'Analysis complete',
  error: 'Analysis failed',
}

function formatNumber(value, digits = 1) {
  const number = Number(value)
  return Number.isFinite(number) ? number.toFixed(digits) : '—'
}

export default function VideoAnalysisPanel({ athleteId, sport, onComplete }) {
  const inputRef = useRef(null)
  const pollTimerRef = useRef(null)
  const pollAttemptsRef = useRef(0)
  const mountedRef = useRef(true)
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (pollTimerRef.current) window.clearTimeout(pollTimerRef.current)
    }
  }, [])

  const authHeaders = () => {
    const token = localStorage.getItem(TOKEN_KEY)
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const chooseFile = (event) => {
    const selected = event.target.files?.[0]
    setError('')
    setResult(null)
    setProgress(0)
    setStatus('idle')
    if (!selected) return
    if (!selected.type.startsWith('video/')) {
      setFile(null)
      setError('Please select a video file.')
      return
    }
    if (selected.size > MAX_VIDEO_BYTES) {
      setFile(null)
      setError('Video must be 100 MB or smaller.')
      return
    }
    setFile(selected)
  }

  const pollResult = async (jobId) => {
    pollAttemptsRef.current += 1
    if (pollAttemptsRef.current > MAX_POLL_ATTEMPTS) {
      throw new Error('Analysis is taking longer than expected. You can retry by uploading the video again.')
    }

    const response = await fetch(`${API_BASE}/video-analysis/${encodeURIComponent(jobId)}`, {
      headers: authHeaders(),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.message || `Unable to retrieve analysis (${response.status}).`)

    if (!mountedRef.current) return
    setResult(data)

    if (data.status === 'ANALYZED') {
      setProgress(100)
      setStatus('complete')
      onComplete?.(data)
      return
    }
    if (data.status === 'FAILED') {
      throw new Error('The video could not be processed. Please check the file and try again.')
    }

    setStatus('analyzing')
    setProgress((current) => Math.max(current, 70))
    pollTimerRef.current = window.setTimeout(() => {
      pollResult(jobId).catch((err) => {
        if (!mountedRef.current) return
        setStatus('error')
        setError(err.message || 'Unable to analyze the video.')
      })
    }, POLL_INTERVAL_MS)
  }

  const analyze = async () => {
    if (!file || status === 'uploading' || status === 'analyzing') return
    setError('')
    setResult(null)
    setStatus('uploading')
    setProgress(15)
    pollAttemptsRef.current = 0
    try {
      const body = new FormData()
      body.append('video', file)
      if (athleteId) body.append('athleteId', athleteId)
      if (sport) body.append('sport', sport)

      const response = await fetch(`${API_BASE}/video-analysis`, {
        method: 'POST',
        headers: authHeaders(),
        body,
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || `Video upload failed (${response.status}).`)
      if (!data.jobId) throw new Error('The server accepted the upload but did not return an analysis job ID.')

      setResult(data)
      setProgress(55)
      setStatus('analyzing')
      await pollResult(data.jobId)
    } catch (err) {
      if (!mountedRef.current) return
      setStatus('error')
      setProgress(0)
      setError(err.message || 'Unable to analyze the video.')
    }
  }

  const reset = () => {
    if (pollTimerRef.current) window.clearTimeout(pollTimerRef.current)
    pollTimerRef.current = null
    pollAttemptsRef.current = 0
    setFile(null)
    setResult(null)
    setError('')
    setProgress(0)
    setStatus('idle')
    if (inputRef.current) inputRef.current.value = ''
  }

  const findings = Array.isArray(result?.findings) ? result.findings : []
  const hasPoseData = Number(result?.poseDetectionRate) > 0
  const busy = status === 'uploading' || status === 'analyzing'

  return (
    <section className="panel video-analysis-panel" aria-labelledby="video-analysis-title">
      <div className="video-analysis-heading">
        <div>
          <span className="eyebrow">Performance lab · Video intelligence</span>
          <h2 id="video-analysis-title">Athlete video analysis</h2>
          <p className="muted">Upload a practice or match clip and track the processing status through to the analysis report.</p>
        </div>
        <span className={`video-status-pill is-${status}`}><span className="video-status-dot" />{statusCopy[status]}</span>
      </div>

      <div className={`video-analysis-dropzone ${file ? 'has-file' : ''}`} onClick={() => !busy && inputRef.current?.click()} role="button" tabIndex={busy ? -1 : 0} aria-label="Choose a video file" onKeyDown={(event) => {
        if (!busy && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          inputRef.current?.click()
        }
      }}>
        <input ref={inputRef} type="file" accept="video/*" hidden onChange={chooseFile} disabled={busy} />
        <div className="video-upload-icon" aria-hidden="true">↥</div>
        <strong>{file ? file.name : 'Drop your video here or browse files'}</strong>
        <span className="muted">MP4, MOV or another browser-supported format · Maximum 100 MB</span>
        {file && <span className="video-file-meta">{(file.size / (1024 * 1024)).toFixed(1)} MB{sport ? ` · ${sport}` : ''}</span>}
      </div>

      {file && <div className="video-file-row">
        <div><strong>{file.name}</strong><div className="muted">Ready to submit{sport ? ` · ${sport}` : ''}</div></div>
        <button className="ghost-btn" type="button" onClick={reset} disabled={busy}>Remove</button>
      </div>}

      {busy && <div className="video-progress-wrap" role="status" aria-live="polite">
        <div className="video-progress-label"><strong>{status === 'uploading' ? 'Uploading clip…' : 'Processing video…'}</strong><span>{progress}%</span></div>
        <div className="video-progress-track"><div className="video-progress-fill" style={{ width: `${progress}%` }} /></div>
        <span className="muted">{status === 'uploading' ? 'Sending your video securely to the analysis service.' : 'The server is scanning the video. This may take a few moments.'}</span>
      </div>}

      {status === 'complete' && <div className="video-success" role="status">
        <span className="video-result-check">✓</span>
        <div><strong>Processing finished</strong><span className="muted">Review the video metrics and findings below.</span></div>
      </div>}
      {error && <div className="video-error" role="alert">⚠ {error}</div>}

      <div className="video-analysis-actions">
        <button className="primary-btn" type="button" disabled={!file || busy} onClick={analyze}>{busy ? 'Processing…' : status === 'error' ? 'Try again' : 'Start analysis'}</button>
        {(result || status === 'error') && <button className="ghost-btn" type="button" onClick={reset} disabled={busy}>New analysis</button>}
      </div>

      {result && <div className="video-report">
        <div className="video-report-header">
          <div><span className="eyebrow">Analysis report</span><h3>{result.sport || sport || 'Sports'} movement scan</h3></div>
          <span className={`video-status-pill is-${String(result.status || '').toLowerCase()}`}>{result.status || 'Queued'}</span>
        </div>
        <div className="video-result-grid">
          <div className="video-metric-card"><span>Frames scanned</span><strong>{Number(result.frames || 0).toLocaleString()}</strong><small>Video frames</small></div>
          <div className="video-metric-card"><span>Frame rate</span><strong>{formatNumber(result.fps, 1)}<small> FPS</small></strong><small>Source video</small></div>
          <div className="video-metric-card"><span>Pose detection</span><strong>{formatNumber(result.poseDetectionRate, 1)}<small>%</small></strong><small>Sampled frames</small></div>
          <div className="video-metric-card"><span>Landmark visibility</span><strong>{formatNumber(result.averageLandmarkVisibility, 1)}<small>%</small></strong><small>Detected pose points</small></div>
        </div>

        {result.status === 'ANALYZED' && !hasPoseData && <div className="video-model-notice">
          <strong>Pose model not returning detections</strong>
          <p>The video was processed, but no body landmarks were detected. Technique findings and performance scores are therefore unavailable. Do not treat this as a completed athlete assessment.</p>
        </div>}

        <div className="video-findings">
          <div className="video-findings-title"><h3>Technique findings</h3><span>{findings.length} {findings.length === 1 ? 'finding' : 'findings'}</span></div>
          {findings.length ? <div className="video-finding-list">{findings.map((finding, index) => <article className="video-finding" key={`${finding.title || 'finding'}-${index}`}>
            <div className="video-finding-marker">{String(index + 1).padStart(2, '0')}</div>
            <div><strong>{finding.title || 'Movement observation'}</strong><p>{finding.description || 'No additional description provided.'}</p>{finding.suggestion && <div className="video-suggestion"><span>Coaching cue</span>{finding.suggestion}</div>}</div>
            <span className="video-confidence">{formatNumber(Number(finding.confidence) * 100, 0)}%<small>confidence</small></span>
          </article>)}</div> : <p className="muted video-empty-findings">{result.status === 'ANALYZED' ? 'No technique findings were produced for this clip.' : 'Findings will appear here when processing is complete.'}</p>}
        </div>
        <p className="video-report-footnote">Video-derived observations are intended to support coaching review, not replace an in-person assessment.</p>
      </div>}
    </section>
  )
}
