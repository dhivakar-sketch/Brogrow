import React, { useMemo, useState } from 'react'

const tier = (score) => {
  const n = Number(score) || 0
  if (n >= 85) return { label: 'Elite', icon: '🏆' }
  if (n >= 70) return { label: 'High Potential', icon: '🚀' }
  if (n >= 55) return { label: 'Developing', icon: '📈' }
  if (n >= 40) return { label: 'Foundation', icon: '🎯' }
  return { label: 'Needs Development', icon: '🛠️' }
}

const parseMetrics = (assessment) => {
  try {
    if (typeof assessment?.metricsJson === 'string') return JSON.parse(assessment.metricsJson || '{}')
    return assessment?.metricsJson || assessment?.metrics || {}
  } catch { return {} }
}

const pretty = (key) => String(key || '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ').replace(/^./, c => c.toUpperCase())

export default function PerformanceIntelligence({ assessments = [], insights = [], athleteName = 'Athlete' }) {
  const [selected, setSelected] = useState(0)
  const ordered = useMemo(() => [...assessments].sort((a,b) => new Date(a.assessedAt || 0) - new Date(b.assessedAt || 0)), [assessments])
  const latest = ordered[selected] || ordered[ordered.length - 1] || assessments[0]
  const score = Number(latest?.weightedScore ?? latest?.score ?? 0)
  const values = Object.entries(parseMetrics(latest)).map(([key, value]) => ({ key, value: Number(value) })).filter(x => Number.isFinite(x.value))
  const best = values.length ? [...values].sort((a,b) => b.value-a.value).slice(0,2) : []
  const weak = values.length ? [...values].sort((a,b) => a.value-b.value).slice(0,2) : []
  const previous = ordered.length > 1 && latest ? ordered[Math.max(0, ordered.indexOf(latest)-1)] : null
  const previousScore = Number(previous?.weightedScore ?? previous?.score)
  const change = Number.isFinite(previousScore) ? score - previousScore : null
  const t = tier(score)
  const insight = insights.find(i => i.sport === latest?.sport) || insights[0]
  const benchmark = Number(latest?.benchmarkScore)
  const gap = Number.isFinite(benchmark) ? score - benchmark : null

  if (!latest) return <div className="panel"><div className="panel-header"><h2>◈ Performance Intelligence</h2></div><div className="empty-state"><div className="empty-icon">📊</div><p>Complete an assessment to unlock athlete-specific performance intelligence.</p></div></div>

  return <div className="panel performance-intelligence">
    <div className="panel-header split-row">
      <div><h2>◈ Performance Intelligence</h2><span className="muted">{athleteName} · {latest.sport || 'Sport'} · {latest.category || 'Assessment'}</span></div>
      {ordered.length > 1 && <select value={selected} onChange={e => setSelected(Number(e.target.value))} style={{maxWidth:220}}>{ordered.map((a,i)=><option key={a.id || i} value={i}>Assessment {i+1} · {Number(a.weightedScore ?? a.score ?? 0).toFixed(1)}</option>)}</select>}
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1.1fr .9fr',gap:14,marginBottom:16}}>
      <div className="insight-box"><div className="muted" style={{fontSize:11,textTransform:'uppercase',letterSpacing:'.08em'}}>Overall performance</div><div style={{display:'flex',alignItems:'end',gap:12,marginTop:8}}><strong style={{fontSize:42}}>{score.toFixed(1)}</strong><span className="muted" style={{paddingBottom:7}}>/100</span><span style={{marginLeft:'auto',fontWeight:800}}>{t.icon} {t.label}</span></div>{change !== null && <div style={{marginTop:8,color:change >= 0 ? '#22c55e' : '#f59e0b',fontWeight:700}}>{change >= 0 ? '↗' : '↘'} {Math.abs(change).toFixed(1)} points vs previous assessment</div>}</div>
      <div className="insight-box"><div className="muted" style={{fontSize:11,textTransform:'uppercase',letterSpacing:'.08em'}}>Benchmark analysis</div><div style={{fontSize:24,fontWeight:800,marginTop:9}}>{Number.isFinite(benchmark) ? `${benchmark.toFixed(1)} / 100` : 'Not set'}</div><div style={{marginTop:8,fontWeight:700,color:gap === null ? 'var(--text-muted)' : gap >= 0 ? '#22c55e' : '#f59e0b'}}>{gap === null ? 'Add a benchmark to compare' : `${gap >= 0 ? '+' : ''}${gap.toFixed(1)} points ${gap >= 0 ? 'above' : 'below'} benchmark`}</div></div>
    </div>
    <div className="two-column">
      <div className="panel" style={{margin:0}}><div className="panel-header"><h2>💪 Strength signals</h2></div>{best.length ? best.map(x=><div key={x.key} style={{padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.07)',display:'flex',justifyContent:'space-between'}}><span>{pretty(x.key)}</span><strong>{x.value}</strong></div>) : <span className="muted">Metric-level data unavailable.</span>}</div>
      <div className="panel" style={{margin:0}}><div className="panel-header"><h2>⚠️ Improvement focus</h2></div>{weak.length ? weak.map(x=><div key={x.key} style={{padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.07)',display:'flex',justifyContent:'space-between'}}><span>{pretty(x.key)}</span><strong>{x.value}</strong></div>) : <span className="muted">Metric-level data unavailable.</span>}</div>
    </div>
    <div className="insight-box" style={{marginTop:16}}><h3 style={{marginTop:0}}>💡 Recommended next steps</h3><p>{insight?.recommendations || insight?.summary || 'Use the lowest-performing measured areas as the next training focus and repeat the assessment after a training cycle.'}</p>{insight?.caution && <p className="muted">{insight.caution}</p>}</div>
    <div style={{marginTop:14,display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 14px',borderRadius:10,background:latest.coachVerified ? 'rgba(34,197,94,.08)' : 'rgba(245,158,11,.08)',border:`1px solid ${latest.coachVerified ? 'rgba(34,197,94,.2)' : 'rgba(245,158,11,.2)'}`}}><strong>{latest.coachVerified ? '✓ Coach Verified' : '⏳ Pending Coach Verification'}</strong><span className="muted">{latest.assessedAt ? new Date(latest.assessedAt).toLocaleDateString() : 'Assessment date unavailable'}</span></div>
  </div>
}
