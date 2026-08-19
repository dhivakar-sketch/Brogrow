import React, { useMemo, useState } from 'react'

const parseMetrics = (a) => {
  try { return typeof a?.metricsJson === 'string' ? JSON.parse(a.metricsJson || '{}') : (a?.metricsJson || a?.metrics || {}) } catch { return {} }
}
const scoreOf = (a) => Number(a?.weightedScore ?? a?.score ?? 0)
const pretty = (key) => String(key || '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ').replace(/^./, c => c.toUpperCase())

export default function AssessmentHistory({ assessments = [], athleteName = 'Athlete' }) {
  const [sport, setSport] = useState('ALL')
  const history = useMemo(() => [...assessments].sort((a,b) => new Date(b.assessedAt || b.createdAt || 0) - new Date(a.assessedAt || a.createdAt || 0)), [assessments])
  const sports = useMemo(() => ['ALL', ...new Set(history.map(a => a.sport).filter(Boolean))], [history])
  const filtered = sport === 'ALL' ? history : history.filter(a => a.sport === sport)
  const latest = filtered[0]
  const previous = filtered[1]
  const currentScore = latest ? scoreOf(latest) : 0
  const previousScore = previous ? scoreOf(previous) : null
  const delta = previousScore === null ? null : currentScore - previousScore
  const improvement = previousScore ? ((currentScore - previousScore) / previousScore) * 100 : null
  const best = filtered.length ? Math.max(...filtered.map(scoreOf)) : 0
  const metrics = latest ? Object.entries(parseMetrics(latest)).map(([key,value]) => ({ key, value: Number(value) })).filter(x => Number.isFinite(x.value)) : []
  const weakest = metrics.length ? [...metrics].sort((a,b) => a.value-b.value)[0] : null

  if (!history.length) return <div className="panel"><div className="panel-header"><h2>◷ Assessment History</h2></div><div className="empty-state"><div className="empty-icon">📋</div><p>No completed assessments yet.</p><span className="muted">Complete your first assessment to start tracking progress.</span></div></div>

  return <div className="panel assessment-history">
    <div className="panel-header split-row"><div><h2>◷ Assessment History</h2><span className="muted">Progress tracking for {athleteName}</span></div><select value={sport} onChange={e => setSport(e.target.value)} style={{maxWidth:180}}>{sports.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All sports' : s}</option>)}</select></div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
      <div className="insight-box"><span className="muted">Latest score</span><strong style={{display:'block',fontSize:26,marginTop:6}}>{currentScore.toFixed(1)}</strong></div>
      <div className="insight-box"><span className="muted">Best score</span><strong style={{display:'block',fontSize:26,marginTop:6}}>{best.toFixed(1)}</strong></div>
      <div className="insight-box"><span className="muted">Progress</span><strong style={{display:'block',fontSize:26,marginTop:6,color:delta === null ? 'inherit' : delta >= 0 ? '#22c55e' : '#f59e0b'}}>{improvement === null ? '—' : `${improvement >= 0 ? '+' : ''}${improvement.toFixed(1)}%`}</strong></div>
      <div className="insight-box"><span className="muted">Focus metric</span><strong style={{display:'block',fontSize:17,marginTop:8}}>{weakest ? pretty(weakest.key) : '—'}</strong></div>
    </div>
    <div className="insight-box" style={{marginBottom:16}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><span className="muted">Latest vs previous</span><div style={{fontSize:22,fontWeight:800,marginTop:5}}>{previousScore === null ? 'First assessment' : `${previousScore.toFixed(1)} → ${currentScore.toFixed(1)}`}</div></div>{delta !== null && <strong style={{color:delta >= 0 ? '#22c55e' : '#f59e0b',fontSize:18}}>{delta >= 0 ? '↗' : '↘'} {Math.abs(delta).toFixed(1)} points</strong>}</div></div>
    <div className="panel" style={{margin:0}}><div className="panel-header"><h2>Assessment timeline</h2><span className="muted">{filtered.length} record{filtered.length === 1 ? '' : 's'}</span></div><div style={{display:'grid',gap:10}}>{filtered.map((a,i) => { const score = scoreOf(a); const prev = filtered[i+1]; const d = prev ? score - scoreOf(prev) : null; return <div key={a.id || `${a.assessedAt}-${i}`} style={{display:'grid',gridTemplateColumns:'1fr auto auto',gap:18,alignItems:'center',padding:'13px 0',borderBottom:'1px solid rgba(255,255,255,.07)'}}><div><strong>{a.sport || 'Sport'} · {a.category || 'Assessment'}</strong><div className="muted" style={{fontSize:12,marginTop:4}}>{a.assessedAt ? new Date(a.assessedAt).toLocaleDateString() : 'Date unavailable'} {a.coachVerified ? ' · ✓ Coach verified' : ' · Pending verification'}</div></div><strong style={{fontSize:19}}>{score.toFixed(1)}</strong><span style={{minWidth:80,textAlign:'right',color:d === null ? 'var(--text-muted)' : d >= 0 ? '#22c55e' : '#f59e0b',fontWeight:700}}>{d === null ? 'Baseline' : `${d >= 0 ? '+' : ''}${d.toFixed(1)}`}</span></div> })}</div></div>
  </div>
}
