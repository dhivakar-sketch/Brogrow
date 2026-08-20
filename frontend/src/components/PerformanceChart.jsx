import { useEffect, useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return <div style={{ background: 'rgba(13,17,23,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: '0.82rem', color: '#f1f5f9' }}><div style={{ color: '#94a3b8', marginBottom: 4 }}>{label}</div><div style={{ fontWeight: 700, color: '#818cf8' }}>Score: {payload[0]?.value?.toFixed(1)}</div>{payload[0]?.payload?.sport && <div style={{ color: '#475569', fontSize: '0.75rem' }}>{payload[0].payload.sport}</div>}</div>
}

const roleTabs = {
  ATHLETE: ['Dashboard', 'Profile', 'Assessment', 'History', 'Insights'],
  COACH: ['Dashboard', 'Coach Panel'],
  ACADEMY: ['Dashboard', 'Coach Panel'],
  ADMIN: ['Dashboard', 'Coach Panel'],
}

export default function PerformanceChart({ data = [] }) {
  const role = (localStorage.getItem('sportsTalentRole') || 'ATHLETE').toUpperCase()
  const hasData = data.length > 0
  const minVal = hasData ? Math.max(0, Math.min(...data.map((d) => Number(d.value) || 0)) - 10) : 0
  const maxVal = hasData ? Math.min(100, Math.max(...data.map((d) => Number(d.value) || 0)) + 10) : 100
  const average = useMemo(() => hasData ? data.reduce((sum, item) => sum + (Number(item.value) || 0), 0) / data.length : 0, [data, hasData])
  const trackedSports = useMemo(() => [...new Set(data.map((item) => item.sport).filter(Boolean))], [data])

  useEffect(() => {
    const allowed = roleTabs[role] || roleTabs.ATHLETE
    const tabButtons = Array.from(document.querySelectorAll('.tabs .tab-btn'))
    tabButtons.forEach((button) => {
      const text = button.textContent?.replace(/[⬡◎⊞◷◈✦]/g, '').trim()
      button.style.display = allowed.some((name) => text?.includes(name)) ? '' : 'none'
    })
    return () => tabButtons.forEach((button) => { button.style.display = '' })
  }, [role])

  if (role === 'ACADEMY' || role === 'ADMIN') {
    const isAcademy = role === 'ACADEMY'
    return <div className="panel chart-panel">
      <div className="panel-header"><div><h2>{isAcademy ? '▣ Academy analytics' : '⚙ System analytics'}</h2><span className="muted">{isAcademy ? 'Performance data available to the academy' : 'Platform activity overview'}</span></div></div>
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="metric-card accent"><span>Total records</span><strong>{data.length}</strong><small>Assessment records</small></div>
        <div className="metric-card teal"><span>Average score</span><strong>{hasData ? average.toFixed(1) : '—'}</strong><small>Across available records</small></div>
        <div className="metric-card green"><span>Sports tracked</span><strong>{trackedSports.length}</strong><small>Active sports</small></div>
        <div className="metric-card warm"><span>Latest score</span><strong>{hasData ? Number(data[data.length - 1].value || 0).toFixed(1) : '—'}</strong><small>Most recent record</small></div>
      </div>
      <div className="insight-box" style={{ marginTop: 14 }}><strong>{isAcademy ? 'Academy decision support' : 'System status'}</strong><p>{isAcademy ? 'Use the Coach Panel to review athlete performance, verification status and player reports. Athlete assessment entry is intentionally kept out of the academy workspace.' : 'Use the Coach Panel for operational review. Athlete assessment entry remains restricted to athlete accounts.'}</p></div>
    </div>
  }

  return <div className="panel chart-panel">
    <div className="panel-header"><h2>⬡ Performance trend</h2><span className="muted">Last {data.length} assessments</span></div>
    {!hasData ? <div className="empty-state" style={{ height: 200 }}><div className="empty-icon">📈</div><p>No data yet. Submit assessments to track your progress.</p></div> : <div style={{ width: '100%', height: 240 }}><ResponsiveContainer><AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}><defs><linearGradient id="scoreFill" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" /><XAxis dataKey="label" stroke="#475569" tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} /><YAxis domain={[minVal, maxVal]} stroke="#475569" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip content={<CustomTooltip />} /><Area type="monotone" dataKey="value" stroke="#818cf8" fill="url(#scoreFill)" strokeWidth={2.5} dot={{ r: 4, fill: '#818cf8', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#f1f5f9' }} /></AreaChart></ResponsiveContainer></div>}
  </div>
}
