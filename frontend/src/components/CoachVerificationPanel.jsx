import { useMemo, useState } from 'react'

export default function CoachVerificationPanel({ athletes = [], onApprove, onReject }) {
  const [reviews, setReviews] = useState({})
  const [selected, setSelected] = useState(null)
  const [comment, setComment] = useState('')

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
      [athlete.name]: { status: action, comment: comment.trim(), reviewedAt: new Date().toISOString() },
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
          <span className="muted">Manual review queue · coach decision required</span>
        </div>
        <div className="coach-review-summary">
          <span>{counts.pending} pending</span>
          <span className="coach-approved-count">{counts.approved} approved</span>
          <span className="coach-rejected-count">{counts.rejected} rejected</span>
        </div>
      </div>

      <div className="coach-verification-list">
        {athletes.map((athlete) => {
          const review = reviews[athlete.name]
          const statusLabel = review?.status === 'approved' ? 'Coach verified' : review?.status === 'rejected' ? 'Needs re-assessment' : 'Pending review'
          return (
            <div className={`verification-card coach-review-${review?.status || 'pending'}`} key={athlete.name}>
              <div className="coach-athlete-info">
                <strong>{athlete.name}</strong>
                <small>{athlete.sport}</small>
                <span className="coach-review-status">{statusLabel}</span>
                {review?.comment && <small className="coach-review-comment">“{review.comment}”</small>}
              </div>
              <div className="verification-score">
                <span>AI score</span>
                <strong>{athlete.score}</strong>
                <small>{athlete.trend || '—'} trend</small>
              </div>
              {!review ? (
                <div className="verification-actions">
                  <button className="ghost-btn" type="button" onClick={() => openReview(athlete, 'rejected')}>Reject</button>
                  <button className="primary-btn" type="button" onClick={() => openReview(athlete, 'approved')}>Approve</button>
                </div>
              ) : (
                <button className="ghost-btn" type="button" onClick={() => openReview(athlete, review.status === 'approved' ? 'rejected' : 'approved')}>Change decision</button>
              )}
            </div>
          )
        })}
      </div>

      {selected && (
        <div className="coach-review-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
          <div className="coach-review-modal" role="dialog" aria-modal="true">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Coach review</span>
                <h2>{selected.athlete.name}</h2>
                <span className="muted">{selected.athlete.sport} · AI score {selected.athlete.score}</span>
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
