import React, { useEffect, useMemo, useState } from 'react'

const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:8080/api').replace(/\/$/, '')
const TOKEN_KEY = 'sportsTalentAuth'
const score = (a) => Number(a?.weightedScore ?? a?.score ?? 0)

export default function AcademyDashboard({ dashboard: initialDashboard = {}, assessments: initialAssessments = [], athletes: initialAthletes = [] }) {
  const [dashboard, setDashboard] = useState(initialDashboard || {})
  const [assessments, setAssessments] = useState(Array.isArray(initialAssessments) ? initialAssessments : [])
  const [athletes, setAthletes] = useState(Array.isArray(initialAthletes) ? initialAthletes : [])
  const [loading, setLoading] = useState(!(initialAssessments?.length || initialAthletes?.length || Object.keys(initialDashboard || {}).length))
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const token = localStorage.getItem(TOKEN_KEY)
      if (!token) return
      setLoading(true)
      setError('')
      const headers = { Authorization: `Bearer ${token}` }
      try {
        const [dashboardResponse, assessmentsResponse, athletesResponse] = await Promise.all([
          fetch(`${API_BASE}/dashboard`, { headers }),
          fetch(`${API_BASE}/assessments`, { headers }),
          fetch(`${API_BASE}/coach/athletes`, { headers }),
        ])
        if (!dashboardResponse.ok && !assessmentsResponse.ok) {
          throw new Error('Unable to load academy data. Please log in again.')
        }
        const [dashboardData, assessmentData, athleteData] = await Promise.all([
          dashboardResponse.ok ? dashboardResponse.json() : {},
          assessmentsResponse.ok ? assessmentsResponse.json() : [],
          athletesResponse.ok ? athletesResponse.json() : [],
        ])
        if (cancelled) return
        setDashboard(dashboardData || {})
        setAssessments(Array.isArray(assessmentData) ? assessmentData : [])
        setAthletes(Array.isArray(athleteData) ? athleteData : [])
      } catch (err) {
        if (!cancelled) setError(err.message || 'Unable to load academy data.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const records = Array.isArray(assessments) ? assessments : []
  const roster = Array.isArray(athletes) ? athletes : []
  const totalAssessments = dashboard?.totalAssessments ?? records.length
  const totalAthletes = dashboard?.totalAthletes ?? (roster.length || new Set(records.map(a => a.athleteId || a.userId || a.athleteName || a.name).filter(Boolean)).size)
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
  const visibleAthletes = roster.length ? roster.slice(0, 8) : topAthletes.slice(0, 8)

  if (loading) return <div className="panel"><div className="empty-state"><div className="empty-icon">◌</div><p>Loading academy workspace…</p><span className="muted">Fetching live academy performance data.</span></div></div>

  return <div className="academy-dashboard">
    <div className="panel-header" style={{ marginBottom: 18 }}>
      <div><span className="eyebrow">Academy workspace</span><h2>Academy Overview</h2><span className="muted">Monitor athletes, coaches and academy-level performance</span></div>
    </div>
    {error && <div className="empty-state" style={{ marginBottom: 18 }}><div className="empty-icon">⚠️</div><p>{error}</p></div>}

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

    <div className="panel" style={{marginTop:18}}><div className="panel-header"><div><h2>Athlete Management</h2><span className="muted">Registered athletes and current assessment status</span></div></div>
      {visibleAthletes.length ? <div style={{display:'grid',gap:10}}>{visibleAthletes.map((a,i) => <div key={a.id || a.assessmentId || a.athleteId || i} style={{display:'grid',gridTemplateColumns:'1fr auto auto',gap:16,alignItems:'center',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.07)'}}><div><strong>{a.name || a.athleteName || 'Athlete'}</strong><div className="muted" style={{fontSize:12}}>{a.sport || a.primarySport || 'Sport'}</div></div><strong>{Number(a.score ?? a.weightedScore ?? 0).toFixed(1)}</strong><span className="muted">{a.status || (a.coachVerified ? 'Coach verified' : 'Pending')}</span></div>)}</div> : <div className="empty-state"><p>No registered athletes yet.</p><span className="muted">Athletes will appear here when their records are available.</span></div>}
    </div>

    <div className="panel" style={{marginTop:18}}><div className="panel-header"><div><h2>Academy Management</h2><span className="muted">Management areas for academy users</span></div></div><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>{[['🧑‍🏫','Coach Management','Monitor coaches and verification activity'],['📈','Talent Analytics','Compare sports, scores and development trends'],['📋','Reports','Review academy-level assessment summaries']].map(([icon,title,text]) => <div className="insight-box" key={title}><div style={{fontSize:24}}>{icon}</div><strong style={{display:'block',marginTop:8}}>{title}</strong><span className="muted" style={{fontSize:12}}>{text}</span></div>)}</div></div>
  </div>
}
