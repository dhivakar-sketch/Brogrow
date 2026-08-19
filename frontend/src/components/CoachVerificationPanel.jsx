import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:8080/api').replace(/\/$/, '')
const TOKEN_KEY = 'sportsTalentAuth'

function SquadOverview({ athletes }) {
  return (
    <>
      {athletes.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🏃</div><p>No athletes available yet.</p><span className="muted">Submitted athlete assessments will appear here.</span></div>
      ) : athletes.map((athlete) => {
        const score = Number(athlete.score ?? athlete.weightedScore ?? 0)
        const trend = athlete.trend || '0.0%'
        return (
          <div key={`${athlete.id || athlete.assessmentId || athlete.name}-${athlete.sport || ''}`} className="coach-item">
            <div><strong>{athlete.name || 'Athlete'}</strong><small>{athlete.sport || 'Sport'}</small></div>
            <div><strong style={{ color: score >= 85 ? '#22c55e' : score >= 70 ? '#06b6d4' : '#6366f1' }}>{score.toFixed(1)}</strong><small>{athlete.status || 'Pending review'}</small></div>
            <span className={String(trend).startsWith('+') ? 'trend-up' : 'trend-down'}>{trend}</span>
          </div>
        )
      })}
    </>
  )
}

export default function CoachVerificationPanel({ onApprove, onReject }) {
  const [athletes, setAthletes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [reviews, setReviews] = useState({})
  const [selected, setSelected] = useState(null)
  const [squadTarget, setSquadTarget] = useState(null)

  const loadAthletes = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      if (!token) throw new Error('Please log in again to load the coach review queue.')
      const response = await fetch(`${API_BASE}/coach/athletes`, { headers: { Authorization: `Bearer ${token}` } })
      if (!response.ok) throw new Error(response.status === 403 ? 'Coach or academy access is required.' : `Unable to load athletes (${response.status}).`)
      const data = await response.json()
      setAthletes(Array.isArray(data) ? data : [])
    } catch (err) {
      setAthletes([])
      setError(err.message || 'Unable to load athletes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAthletes() }, [])

  // Reuse the existing right-hand Squad Overview panel from App.jsx, but hide
  // its old demo rows and render the same live database data into that panel.
  useEffect(() => {
    const target = document.querySelector('.coach-list')
    if (!target) return
    Array.from(target.children).forEach((child) => {
      child.dataset.staticSquadRow = 'true'
      child.style.display = 'none'
    })
    setSquadTarget(target)
    return () => {
      Array.from(target.children).forEach((child) => {
        if (child.dataset.staticSquadRow === 'true') child.style.display = ''
      })
    }
  }, [])

  const counts = useMemo(() => {
    const approved = athletes.filter((x) => x.status === 'Coach verified' || reviews[x.id || x.assessmentId || x.name]?.status === 'approved').length
    const rejected = athletes.filter((x) => x.status === 'Needs re-assessment' || reviews[x.id || x.assessmentId || x.name]?.status === 'rejected').length
    return { approved, rejected, pending: Math.max(0, athletes.length - approved - rejected) }
  }, [athletes, reviews])

  const openReview = (athlete, action) => setSelected({ athlete, action, comment: '' })

  const confirmReview = async () => {
    if (!selected || saving) return
    const { athlete, action } = selected
    const assessmentId = athlete.assessmentId || athlete.id
    if (!assessmentId) { setError('This athlete record has no assessment ID.'); return }
    setSaving(true)
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      const response = await fetch(`${API_BASE}/coach/assessments/${assessmentId}/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: action === 'approved', comment: selected.comment?.trim?.() || '' }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || `Verification failed (${response.status}).`)
      const nextStatus = action === 'approved' ? 'Coach verified' : 'Needs re-assessment'
      setAthletes((current) => current.map((item) => (item.assessmentId || item.id) === assessmentId ? { ...item, status: nextStatus } : item))
      setReviews((current) => ({ ...current, [assessmentId]: { status: action } }))
      if (action === 'approved') onApprove?.(athlete)
      else onReject?.(athlete)
      setSelected(null)
    } catch (err) {
      setError(err.message || 'Unable to save coach decision.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <div><h2>Coach verification</h2><span className="muted">Live athlete review queue · real assessment data</span></div>
        <div className="coach-review-summary">
          <span>{counts.pending} pending</span><span className="coach-approved-count">{counts.approved} approved</span><span className="coach-rejected-count">{counts.rejected} rejected</span>
          <button className="ghost-btn" type="button" onClick={loadAthletes} disabled={loading}>↻ Refresh</button>
        </div>
      </div>

      {loading && <div className="empty-state"><div className="empty-icon">◌</div>Loading athlete assessments…</div>}
      {!loading && error && <div className="empty-state"><div className="empty-icon">⚠️</div><p>{error}</p><button className="primary-btn" type="button" onClick={loadAthletes}>Try again</button></div>}
      {!loading && !error && athletes.length === 0 && <div className="empty-state"><div className="empty-icon">🏃</div><p>No athlete assessments are available for coach review yet.</p><span className="muted">Once an athlete submits an assessment, they will appear here automatically.</span></div>}

      {!loading && !error && athletes.length > 0 && (
        <div className="coach-verification-list">
          {athletes.map((athlete) => {
            const id = athlete.id || athlete.assessmentId || athlete.name
            const review = reviews[id]
            const serverVerified = athlete.status === 'Coach verified'
            const rejected = athlete.status === 'Needs re-assessment' || review?.status === 'rejected'
            const statusLabel = serverVerified || review?.status === 'approved' ? 'Coach verified' : rejected ? 'Needs re-assessment' : 'Pending review'
            return (
              <div className={`verification-card coach-review-${serverVerified || review?.status === 'approved' ? 'approved' : rejected ? 'rejected' : 'pending'}`} key={id}>
                <div className="coach-athlete-info"><strong>{athlete.name || 'Athlete'}</strong><small>{athlete.sport || 'Sport'}{athlete.category ? ` · ${athlete.category}` : ''}</small><span className="coach-review-status">{statusLabel}</span></div>
                <div className="verification-score"><span>Latest score</span><strong>{Number(athlete.score ?? athlete.weightedScore ?? 0).toFixed(1)}</strong><small>{athlete.trend || '0.0%'} trend</small></div>
                {!serverVerified && !rejected ? <div className="verification-actions"><button className="ghost-btn" type="button" onClick={() => openReview(athlete, 'rejected')}>Reject</button><button className="primary-btn" type="button" onClick={() => openReview(athlete, 'approved')}>Approve</button></div> : <button className="ghost-btn" type="button" onClick={() => openReview(athlete, serverVerified ? 'rejected' : 'approved')}>Change decision</button>}
              </div>
            )
          })}
        </div>
      )}

      {selected && (
        <div className="coach-review-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !saving && setSelected(null)}>
          <div className="coach-review-modal" role="dialog" aria-modal="true">
            <div className="panel-header"><div><span className="eyebrow">Coach review</span><h2>{selected.athlete.name || 'Athlete'}</h2><span className="muted">{selected.athlete.sport || 'Sport'} · Latest score {Number(selected.athlete.score ?? selected.athlete.weightedScore ?? 0).toFixed(1)}</span></div><button className="ghost-btn" type="button" disabled={saving} onClick={() => setSelected(null)}>Close</button></div>
            <div className={`coach-decision-banner ${selected.action}`}><strong>{selected.action === 'approved' ? '✓ Approve athlete' : '↻ Request re-assessment'}</strong><span>{selected.action === 'approved' ? 'Mark this assessment as coach verified.' : 'Send the assessment back for further review.'}</span></div>
            <label>Coach comment<textarea value={selected.comment || ''} onChange={(event) => setSelected({ ...selected, comment: event.target.value })} placeholder={selected.action === 'approved' ? 'Add verification notes, strengths or selection context…' : 'Explain what needs to be reviewed or improved…'} /></label>
            <div className="coach-modal-actions"><button className="ghost-btn" type="button" disabled={saving} onClick={() => setSelected(null)}>Cancel</button><button className={selected.action === 'approved' ? 'primary-btn' : 'danger-btn'} type="button" disabled={saving} onClick={confirmReview}>{saving ? 'Saving…' : selected.action === 'approved' ? 'Confirm approval' : 'Confirm rejection'}</button></div>
          </div>
        </div>
      )}

      {squadTarget && createPortal(<SquadOverview athletes={athletes} />, squadTarget)}
    </div>
  )
}
