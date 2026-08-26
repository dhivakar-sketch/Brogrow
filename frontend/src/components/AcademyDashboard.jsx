import React, { useMemo } from 'react'

const score = (a) => Number(a?.weightedScore ?? a?.score ?? 0)

export default function AcademyDashboard({ dashboard = {}, assessments = [], athletes = [] }) {
  const records = Array.isArray(assessments) ? assessments : []
  const roster = Array.isArray(athletes) ? athletes : []
  const totalAssessments = dashboard?.totalAssessments ?? records.length
  const totalAthletes = dashboard?.totalAthletes ?? new Set(records.map(a => a.athleteId || a.userId || a.athleteName || a.name).filter(Boolean)).size
  const verified = records.filter(a => a.coachVerified || a.status === 'Coach verified').length
  const avg = records.length ? records.reduce((sum, a) => sum + score(a), 0) / records.length : Number(dashboard?.averageScore || 0)
  const sportRows = useMemo(() => {
    const map = new Map()
    records.forEach(a => {
      const sport = a.sport || 'Unknown'
      const row = map.get(sport) || { sport, count: 0, total: 0 }
      row.count += 1
      row.total += score(a)
      map.set(sport, row)
    })
    return [...map.values()].map(x => ({ ...x, average: x.count ? x.total / x.count : 0 })).sort((a,b) => b.average - a.average)
  }, [records])
  const topAthletes = useMemo(() => [...records].sort((a,b) => score(b)-score(a)).slice(0,5), [records])

  return <div className="academy-dashboard">
    <div className="panel-header" style={{ marginBottom: 18 }}>
      <div><span className="eyebrow">Academy workspace</span><h2>Academy Overview</h2><span className="muted">Monitor athletes, coaches and academy-level performance</span></div>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:14,marginBottom:18}}>
      {[['👥','Athletes',totalAthletes],['📋','Assessments',totalAssessments],['✓','Verified',verified],['◈','Average score',avg.toFixed(1)]].map(([icon,label,value]) => <div className="insight-box" key={label}><span style={{fontSize:22}}>{icon}</span><div className="muted" style={{marginTop:7}}>{label}</div><strong style={{fontSize:28,display:'block',marginTop:3}}>{value}</strong></div>)}
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1.2fr .8fr',gap:18}}>
      <div className="panel" style={{margin:0}}><div className="panel-header"><div><h2>Athlete Performance</h2><span className="muted">Highest current assessment scores</span></div></div>
        {topAthletes.length ? <div style={{display:'grid',gap:10}}>{topAthletes.map((a,i) => <div key={a.id || a.assessmentId || i} style={{display:'grid',gridTemplateColumns:'1fr auto auto',gap:16,alignItems:'center',padding:'12px 0',borderBottom:'1px solid rgba(255,255,255,.07)'}}><div><strong>{a.name || a.athleteName || 'Athlete'}</strong><div className="muted" style={{fontSize:12}}>{a.sport || 'Sport'}{a.category ? ` · ${a.category}` : ''}</div></div><strong>{score(a).toFixed(1)}</strong><span className="muted">{a.status || (a.coachVerified ? 'Coach verified' : 'Pending')}</span></div>)}</div> : <div className="empty-state"><div className="empty-icon">📊</div><p>No assessment data yet.</p><span className="muted">Athlete assessments will appear here automatically.</span></div>}
      </div>

      <div className="panel" style={{margin:0}}><div className="panel-header"><div><h2>Sports Summary</h2><span className="muted">Academy performance by sport</span></div></div>
        {sportRows.length ? <div style={{display:'grid',gap:12}}>{sportRows.map(x => <div key={x.sport}><div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}><strong>{x.sport}</strong><span>{x.average.toFixed(1)}</span></div><div style={{height:7,borderRadius:99,background:'rgba(255,255,255,.08)',overflow:'hidden'}}><div style={{height:'100%',width:`${Math.min(100,Math.max(0,x.average))}%`,background:'var(--accent,#6366f1)',borderRadius:99}} /></div><div className="muted" style={{fontSize:11,marginTop:4}}>{x.count} assessment{x.count === 1 ? '' : 's'}</div></div>)}</div> : <div className="empty-state"><p>No sport data yet.</p></div>}
      </div>
    </div>

    <div className="panel" style={{marginTop:18}}><div className="panel-header"><div><h2>Academy Actions</h2><span className="muted">Management areas for academy users</span></div></div><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>{[['👥','Athlete Management','View registered athletes and assessment status'],['🧑‍🏫','Coach Management','Monitor coaches and verification activity'],['📈','Talent Analytics','Compare sports, scores and development trends']].map(([icon,title,text]) => <div className="insight-box" key={title}><div style={{fontSize:24}}>{icon}</div><strong style={{display:'block',marginTop:8}}>{title}</strong><span className="muted" style={{fontSize:12}}>{text}</span></div>)}</div></div>
  </div>
}
