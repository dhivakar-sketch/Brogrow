import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(13,17,23,0.95)',
      border: '1px solid rgba(99,102,241,0.3)',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: '0.82rem',
      color: '#f1f5f9',
    }}>
      <div style={{ color: '#94a3b8', marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 700, color: '#818cf8' }}>
        Score: {payload[0]?.value?.toFixed(1)}
      </div>
      {payload[0]?.payload?.sport && (
        <div style={{ color: '#475569', fontSize: '0.75rem' }}>{payload[0].payload.sport}</div>
      )}
    </div>
  )
}

export default function PerformanceChart({ data = [] }) {
  const hasData = data.length > 0
  const minVal = hasData ? Math.max(0, Math.min(...data.map((d) => d.value)) - 10) : 0
  const maxVal = hasData ? Math.min(100, Math.max(...data.map((d) => d.value)) + 10) : 100

  return (
    <div className="panel chart-panel">
      <div className="panel-header">
        <h2>⬡ Performance trend</h2>
        <span className="muted">Last {data.length} assessments</span>
      </div>

      {!hasData ? (
        <div className="empty-state" style={{ height: 200 }}>
          <div className="empty-icon">📈</div>
          <p>No data yet. Submit assessments to track your progress.</p>
        </div>
      ) : (
        <div style={{ width: '100%', height: 240 }}>
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="label"
                stroke="#475569"
                tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                tickLine={false}
              />
              <YAxis
                domain={[minVal, maxVal]}
                stroke="#475569"
                tick={{ fill: '#475569', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#818cf8"
                fill="url(#scoreFill)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#818cf8', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#f1f5f9' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
