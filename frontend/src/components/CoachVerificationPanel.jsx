import { useEffect, useMemo, useState } from 'react'

const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:8080/api').replace(/\/$/, '')
const TOKEN_KEY = 'sportsTalentAuth'

export default function CoachVerificationPanel({ athletes: fallbackAthletes = [], onApprove, onReject }) {
  const [athletes, setAthletes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
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
      if (!response.ok) {
        const message = response.status === 403
          ? 'Coach or academy access is required to view the athlete review queue.'
          : `Unable to load athletes (${response.status}).`
        throw new Error(message)
      }
      const data = await response.json()
      setAthletes(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Unable to load athletes.')
      setAthletes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAthletes()
  }, [])

  const counts = useMemo(() => {
    const values = Object.values(reviews)
    return {
      approved: values.filter((x) => x.status === 'approved').length,
      rejected: values.filter((x) => x.status === 'rejected').length,
      pending: Math.max(0, athletes.length - values.length),
    }
  }, [reviews, athletes.length])

  const openReview = (athlete, action) => {
    setSelected({ athlete, action })
    setComment('')
  }

  const confirmReview = () => {
    if (!selected) return
    const { athlete, action } = selected
    setReviews((current) => ({
      ...current,
      [athlete.name]: {
        status: action,
        comment: comment.trim(),
        reviewedAt: new Date().toISOString(),
      },
    }))
    if (action === 'approved') onApprove?.(athlete)
    else onReject?.(athlete)
    setSelected(null)
    setComment('')
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
          <button className="ghost-btn" type="button" onClick={loadAthletes} disabled={loading}>
            {loading ? 'Loading…' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {loading && <div className="empty-state"><div className="empty-icon">◌</div>Loading athletes from the database…</div>}

      {!loading && error && (
        <div className="empty-state">
          <div className="empty-icon">⚠️</div>
          <p>{error}</p>
          <button className="primary-btn" type="button" onClick={loadAthletes}>Try again</button>
        </div>
      )}

      {!loading && !error && athletes.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🏃</div>
          <p>No athlete assessments are available for coach review yet.</p>
          <span className="muted">Once an athlete creates a profile and submits an assessment, they will appear here automatically.</span>
        </div>
      )}

      {!loading && !error && athletes.length > 0 && (
        <div className="coach-verification-list">
          {athletes.map((athlete) => {
            const review = reviews[athlete.name]
            const serverVerified = athlete.status === 'Coach verified'
            const statusLabel = review?.status === 'approved' || serverVerified
              ? 'Coach verified'
              : review?.status === 'rejected'
                ? 'Needs re-assessment'
                : 'Pending review'

            return (
              <div className={`verification-card coach-review-${review?.status || (serverVerified ? 'approved' : 'pending')}`} key={`${athlete.id}-${athlete.assessmentId}`}>
                <div className="coach-athlete-info">
                  <strong>{athlete.name}</strong>
                  <small>{athlete.sport}{athlete.category ? ` · ${athlete.category}` : ''}</small>
                  <span className="coach-review-status">{statusLabel}</span>
                  {review?.comment && <small className="coach-review-comment">“{review.comment}”</small>}
                </div>

                <div className="verification-score">
                  <span>Latest score</span>
                  <strong>{Number(athlete.score ?? 0).toFixed(1)}</strong>
                  <small>{athlete.trend || '0.0%'} trend</small>
                </div>

                {!review && !serverVerified ? (
                  <div className="verification-actions">
                    <button className="ghost-btn" type="button" onClick={() => openReview(athlete, 'rejected')}>Reject</button>
                    <button className="primary-btn" type="button" onClick={() => openReview(athlete, 'approved')}>Approve</button>
                  </div>
                ) : (
                  <button className="ghost-btn" type="button" onClick={() => openReview(athlete, review?.status === 'approved' || serverVerified ? 'rejected' : 'approved')}>
                    Change decision
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {selected && (
        <div className="coach-review-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
          <div className="coach-review-modal" role="dialog" aria-modal="true">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Coach review</span>
                <h2>{selected.athlete.name}</h2>
                <span className="muted">{selected.athlete.sport} · Latest score {Number(selected.athlete.score ?? 0).toFixed(1)}</span>
              </div>
              <button className="ghost-btn" type="button" onClick={() => setSelected(null)}>Close</button>
            </div>
            <div className={`coach-decision-banner ${selected.action}`}>
              <strong>{selected.action === 'approved' ? '✓ Approve athlete' : '↻ Request re-assessment'}</strong>
              <span>{selected.action === 'approved' ? 'Mark this assessment as coach verified.' : 'Send the assessment back for further review.'}</span>
            </div>
            <label>
              Coach comment
              <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder={selected.action === 'approved' ? 'Add verification notes, strengths or selection context…' : 'Explain what needs to be reviewed or improved…'} />
            </label>
            <div className="coach-modal-actions">
              <button className="ghost-btn" type="button" onClick={() => setSelected(null)}>Cancel</button>
              <button className={selected.action === 'approved' ? 'primary-btn' : 'danger-btn'} type="button" onClick={confirmReview}>{selected.action === 'approved' ? 'Confirm approval' : 'Confirm rejection'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
