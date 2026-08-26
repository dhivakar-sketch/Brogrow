import React, { useRef, useState } from 'react'

const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:8080/api').replace(/\/$/, '')
const TOKEN_KEY = 'sportsTalentAuth'

export default function VideoAnalysisPanel({ athleteId, sport, onComplete }) {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const chooseFile = (event) => {
    const selected = event.target.files?.[0]
    setError('')
    setResult(null)
    setProgress(0)
    if (!selected) return
    if (!selected.type.startsWith('video/')) {
      setFile(null)
      setError('Please select a video file.')
      return
    }
    if (selected.size > 100 * 1024 * 1024) {
      setFile(null)
      setError('Video must be 100 MB or smaller.')
      return
    }
    setFile(selected)
  }

  const analyze = async () => {
    if (!file || status === 'uploading' || status === 'analyzing') return
    setError('')
    setResult(null)
    setStatus('uploading')
    setProgress(10)
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      const body = new FormData()
      body.append('video', file)
      if (athleteId) body.append('athleteId', athleteId)
      if (sport) body.append('sport', sport)

      const response = await fetch(`${API_BASE}/video-analysis`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body,
      })
      setProgress(70)
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || `Video analysis failed (${response.status}).`)
      setProgress(100)
      setResult(data)
      setStatus('complete')
      onComplete?.(data)
    } catch (err) {
      setStatus('error')
      setProgress(0)
      setError(err.message || 'Unable to analyze the video.')
    }
  }

  const reset = () => {
    setFile(null)
    setResult(null)
    setError('')
    setProgress(0)
    setStatus('idle')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <section className="panel video-analysis-panel">
      <div className="panel-header">
        <div><span className="eyebrow">AI performance analysis</span><h2>Video Analysis</h2><span className="muted">Upload a practice or match clip for movement and technique analysis.</span></div>
      </div>

      <div className="video-analysis-dropzone" onClick={() => inputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}>
        <input ref={inputRef} type="file" accept="video/*" hidden onChange={chooseFile} />
        <div className="empty-icon">🎥</div>
        <strong>{file ? file.name : 'Choose a video'}</strong>
        <span className="muted">MP4, MOV or other browser-supported video · max 100 MB</span>
      </div>

      {file && <div className="video-file-row"><div><strong>{file.name}</strong><div className="muted">{(file.size / (1024 * 1024)).toFixed(1)} MB{sport ? ` · ${sport}` : ''}</div></div><button className="ghost-btn" type="button" onClick={reset}>Remove</button></div>}

      {status === 'uploading' && <div className="video-progress"><div style={{width:`${progress}%`}} /><span>Uploading video…</span></div>}
      {status === 'complete' && <div className="video-success"><strong>✓ Analysis completed</strong><span className="muted">The returned findings are ready for the athlete/coach report.</span></div>}
      {error && <div className="video-error">⚠️ {error}</div>}

      <div className="video-analysis-actions"><button className="primary-btn" type="button" disabled={!file || status === 'uploading'} onClick={analyze}>{status === 'uploading' ? 'Analyzing…' : 'Analyze Video'}</button>{result && <button className="ghost-btn" type="button" onClick={reset}>Analyze another</button>}</div>

      {result && <div className="video-result-grid">
        <div className="insight-box"><span className="muted">Overall score</span><strong>{Number(result.score ?? result.overallScore ?? 0).toFixed(1)}</strong></div>
        <div className="insight-box"><span className="muted">Detected issues</span><strong>{(result.errors || result.issues || []).length}</strong></div>
        <div className="insight-box"><span className="muted">Confidence</span><strong>{result.confidence != null ? `${Number(result.confidence).toFixed(0)}%` : '—'}</strong></div>
        <div className="panel" style={{margin:0,gridColumn:'1 / -1'}}><h3>AI Findings</h3>{(result.errors || result.issues || []).length ? <ul>{(result.errors || result.issues).map((item, i) => <li key={i}><strong>{item.title || item.name || 'Technique issue'}</strong>{item.message || item.description ? ` — ${item.message || item.description}` : ''}{item.suggestion ? ` Suggestion: ${item.suggestion}` : ''}</li>)}</ul> : <p className="muted">No detailed findings were returned by the analysis service.</p>}</div>
      </div>}
    </section>
  )
}
