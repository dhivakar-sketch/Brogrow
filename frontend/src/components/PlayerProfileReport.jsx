import React, { useMemo } from 'react'

const scoreOf = (a) => Number(a?.weightedScore ?? a?.score ?? 0)
const pretty = (key) => String(key || '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ').replace(/^./, c => c.toUpperCase())
const parseMetrics = (a) => {
  try { return typeof a?.metricsJson === 'string' ? JSON.parse(a.metricsJson || '{}') : (a?.metricsJson || a?.metrics || {}) } catch { return {} }
}
const tier = (score) => score >= 85 ? 'Elite' : score >= 70 ? 'High Potential' : score >= 55 ? 'Developing' : score >= 40 ? 'Foundation' : 'Needs Development'

export default function PlayerProfileReport({ profile = {}, assessments = [], insights = [], athleteName = 'Athlete' }) {
  const ordered = useMemo(() => [...assessments].sort((a,b) => new Date(b.assessedAt || b.createdAt || 0) - new Date(a.assessedAt || a.createdAt || 0)), [assessments])
  const latest = ordered[0]
  const score = scoreOf(latest)
  const previous = ordered[1]
  const change = previous ? score - scoreOf(previous) : null
  const metrics = latest ? Object.entries(parseMetrics(latest)).map(([key,value]) => ({ key, value: Number(value) })).filter(x => Number.isFinite(x.value)) : []
  const strengths = [...metrics].sort((a,b) => b.value - a.value).slice(0,3)
  const focus = [...metrics].sort((a,b) => a.value - b.value).slice(0,3)
  const insight = insights.find(i => i.sport === latest?.sport) || insights[0]
  const verified = Boolean(latest?.coachVerified)

  return <div className="panel player-profile-report">
    <div className="panel-header split-row">
      <div><span className="eyebrow">Athlete Report</span><h2 style={{marginTop:4}}>{profile.athleteName || athleteName}</h2><span className="muted">{latest?.sport || profile.primarySport || 'Sport'} · Complete performance profile</span></div>
      <span className={`coach-review-status ${verified ? 'approved' : ''}`}>{verified ? '✓ Coach Verified' : '⏳ Pending Verification'}</span>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1.25fr .75fr',gap:14,marginBottom:16}}>
      <div className="insight-box">
        <span className="muted">Athlete overview</span>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginTop:14}}>
          <div><small className="muted">Primary sport</small><strong style={{display:'block',marginTop:5}}>{profile.primarySport || latest?.sport || '—'}</strong></div>
          <div><small className="muted">Skill level</small><strong style={{display:'block',marginTop:5}}>{profile.skillLevel || '—'}</strong></div>
          <div><small className="muted">Training</small><strong style={{display:'block',marginTop:5}}>{profile.yearsOfTraining ? `${profile.yearsOfTraining} years` : '—'}</strong></div>
          <div><small className="muted">Position</small><strong style={{display:'block',marginTop:5}}>{profile.playingPosition || '—'}</strong></div>
          <div><small className="muted">Academy</small><strong style={{display:'block',marginTop:5}}>{profile.academyName || '—'}</strong></div>
          <div><small className="muted">Coach</small><strong style={{display:'block',marginTop:5}}>{profile.coachName || '—'}</strong></div>
        </div>
      </div>
      <div className="insight-box"><span className="muted">Current performance</span><strong style={{display:'block',fontSize:42,marginTop:7}}>{latest ? score.toFixed(1) : '—'}</strong><span className="muted">/100 · {latest ? tier(score) : 'No assessment'}</span>{change !== null && <div style={{marginTop:10,color:change >= 0 ? '#22c55e' : '#f59e0b',fontWeight:700}}>{change >= 0 ? '↗' : '↘'} {Math.abs(change).toFixed(1)} points vs previous</div>}</div>
    </div>

    {latest ? <>
      <div className="two-column" style={{marginBottom:16}}>
        <div className="panel" style={{margin:0}}><div className="panel-header"><h2>💪 Strengths</h2></div>{strengths.map(x => <div key={x.key} style={{display:'flex',justifyContent:'space-between',padding:'11px 0',borderBottom:'1px solid rgba(255,255,255,.07)'}}><span>{pretty(x.key)}</span><strong>{x.value}</strong></div>)}</div>
        <div className="panel" style={{margin:0}}><div className="panel-header"><h2>🎯 Development focus</h2></div>{focus.map(x => <div key={x.key} style={{display:'flex',justifyContent:'space-between',padding:'11px 0',borderBottom:'1px solid rgba(255,255,255,.07)'}}><span>{pretty(x.key)}</span><strong>{x.value}</strong></div>)}</div>
      </div>
      <div className="insight-box" style={{marginBottom:16}}><h3 style={{marginTop:0}}>🤖 Talent recommendation</h3><p>{insight?.recommendations || insight?.summary || 'Use the development focus areas as the next training priorities and repeat the assessment after a consistent training cycle.'}</p></div>
      <div className="panel" style={{margin:0}}><div className="panel-header"><h2>Latest assessment</h2><span className="muted">{latest.assessedAt ? new Date(latest.assessedAt).toLocaleDateString() : 'Date unavailable'}</span></div><div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}><div className="insight-box"><span className="muted">Category</span><strong style={{display:'block',marginTop:6}}>{latest.category || 'Assessment'}</strong></div><div className="insight-box"><span className="muted">Score</span><strong style={{display:'block',marginTop:6}}>{score.toFixed(1)}</strong></div><div className="insight-box"><span className="muted">Benchmark</span><strong style={{display:'block',marginTop:6}}>{Number.isFinite(Number(latest.benchmarkScore)) ? Number(latest.benchmarkScore).toFixed(1) : '—'}</strong></div><div className="insight-box"><span className="muted">Verification</span><strong style={{display:'block',marginTop:6}}>{verified ? 'Verified' : 'Pending'}</strong></div></div></div>
    </> : <div className="empty-state"><div className="empty-icon">📋</div><p>No assessment available for this athlete.</p><span className="muted">Complete an assessment to generate the full player report.</span></div>}
  </div>
}
