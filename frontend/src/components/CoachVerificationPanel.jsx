import { useEffect, useMemo, useState } from 'react'

const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:8080/api').replace(/\/$/, '')
const TOKEN_KEY = 'sportsTalentAuth'

export default function CoachVerificationPanel({ athletes: fallbackAthletes = [], onApprove, onReject }) {
  const [athletes, setAthletes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [reviews, setReviews] = useState({})
  const [selected, setSelected] = useState(null)
  const [comment, setComment] = useState('')

  const loadAthletes = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      if (!token) throw new Error('Please log in again to load the coach review queue.')
      const response = await fetch(`${API_BASE}/coach/athletes`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error(response.status === 403 ? 'Coach or academy access is required.' : `Unable to load athletes (${response.status}).`)
      const data = await response.json()
      setAthletes(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Unable to load athletes.')
      setAthletes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAthletes() }, [])

  const counts = useMemo(() => {
    const approved = athletes.filter((x) => x.status === 'Coach verified' || reviews[x.name]?.status === 'approved').length
    const rejected = athletes.filter((x) => reviews[x.name]?.status === 'rejected').length
    return { approved, rejected, pending: Math.max(0, athletes.length - approved - rejected) }
  }, [athletes, reviews])

  const openReview = (athlete, action) => {
    setSelected({ athlete, action })
    setComment('')
  }

  const confirmReview = async () => {
    if (!selected || saving) return
    const { athlete, action } = selected
    setSaving(true)
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      const response = await fetch(`${API_BASE}/coach/assessments/${athlete.assessmentId}/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approved: action === 'approved', comment: comment.trim() }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || `Verification failed (${response.status}).`)

      setReviews((current) => ({
        ...current,
        [athlete.name]: { status: action, comment: comment.trim(), reviewedAt: new Date().toISOString() },
      }))
      setAthletes((current) => current.map((item) => item.assessmentId === athlete.assessmentId
        ? { ...item, status: action === 'approved' ? 'Coach verified' : 'Needs re-assessment' }
        : item))
      if (action === 'approved') onApprove?.(athlete)
      else onReject?.(athlete)
      setSelected(null)
      setComment('')
    } catch (err) {
      setError(err.message || 'Unable to save coach decision.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2>Coach verification</h2>
          <span className="muted">Live athlete review queue · loaded from database</span>
        </div>
        <div className="coach-review-summary">
          <span>{counts.pending} pending</span>
          <span className="coach-approved-count">{counts.approved} approved</span>
          <span className="coach-rejected-count">{counts.rejected} rejected</span>
          <button className="ghost-btn" type="button" onClick={loadAthletes} disabled={loading}>↻ Refresh</button>
        </div>
      </div>

      {loading && <div className="empty-state"><div className="empty-icon">◌</div>Loading athletes from the database…</div>}
      {!loading && error && <div className="empty-state"><div className="empty-icon">⚠️</div><p>{error}</p><button className="primary-btn" type="button" onClick={loadAthletes}>Try again</button></div>}
      {!loading && !error && athletes.length === 0 && <div className="empty-state"><div className="empty-icon">🏃</div><p>No athlete assessments are available for coach review yet.</p><span className="muted">Once an athlete submits an assessment, they will appear here automatically.</span></div>}

      {!loading && !error && athletes.length > 0 && (
        <div className="coach-verification-list">
          {athletes.map((athlete) => {
            const review = reviews[athlete.name]
            const serverVerified = athlete.status === 'Coach verified'
            const rejected = athlete.status === 'Needs re-assessment' || review?.status === 'rejected'
            const statusLabel = serverVerified || review?.status === 'approved' ? 'Coach verified' : rejected ? 'Needs re-assessment' : 'Pending review'
            return (
              <div className={`verification-card coach-review-${serverVerified || review?.status === 'approved' ? 'approved' : rejected ? 'rejected' : 'pending'}`} key={`${athlete.id}-${athlete.assessmentId}`}>
                <div className="coach-athlete-info">
                  <strong>{athlete.name}</strong>
                  <small>{athlete.sport}{athlete.category ? ` · ${athlete.category}` : ''}</small>
                  <span className="coach-review-status">{statusLabel}</span>
                  {review?.comment && <small className="coach-review-comment">“{review.comment}”</small>}
                </div>
                <div className="verification-score"><span>Latest score</span><strong>{Number(athlete.score ?? 0).toFixed(1)}</strong><small>{athlete.trend || '0.0%'} trend</small></div>
                {!serverVerified && !rejected ? (
                  <div className="verification-actions">
                    <button className="ghost-btn" type="button" onClick={() => openReview(athlete, 'rejected')}>Reject</button>
                    <button className="primary-btn" type="button" onClick={() => openReview(athlete, 'approved')}>Approve</button>
                  </div>
                ) : (
                  <button className="ghost-btn" type="button" onClick={() => openReview(athlete, serverVerified ? 'rejected' : 'approved')}>Change decision</button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {selected && (
        <div className="coach-review-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !saving && setSelected(null)}>
          <div className="coach-review-modal" role="dialog" aria-modal="true">
            <div className="panel-header"><div><span className="eyebrow">Coach review</span><h2>{selected.athlete.name}</h2><span className="muted">{selected.athlete.sport} · Latest score {Number(selected.athlete.score ?? 0).toFixed(1)}</span></div><button className="ghost-btn" type="button" disabled={saving} onClick={() => setSelected(null)}>Close</button></div>
            <div className={`coach-decision-banner ${selected.action}`}><strong>{selected.action === 'approved' ? '✓ Approve athlete' : '↻ Request re-assessment'}</strong><span>{selected.action === 'approved' ? 'Mark this assessment as coach verified.' : 'Send the assessment back for further review.'}</span></div>
            <label>Coach comment<textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder={selected.action === 'approved' ? 'Add verification notes, strengths or selection context…' : 'Explain what needs to be reviewed or improved…'} /></label>
            <div className="coach-modal-actions"><button className="ghost-btn" type="button" disabled={saving} onClick={() => setSelected(null)}>Cancel</button><button className={selected.action === 'approved' ? 'primary-btn' : 'danger-btn'} type="button" disabled={saving} onClick={confirmReview}>{saving ? 'Saving…' : selected.action === 'approved' ? 'Confirm approval' : 'Confirm rejection'}</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
