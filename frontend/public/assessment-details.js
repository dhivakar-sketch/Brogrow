(() => {
  const TOKEN_KEY = 'sportsTalentAuth'
  const API_BASE = (window.__SPORTS_API_BASE__ || 'http://localhost:8080/api').replace(/\/$/, '')
  const STYLE_ID = 'assessment-details-styles'
  const MODAL_ID = 'assessment-details-modal'

  const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

  const formatKey = (key) => String(key || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/^./, (c) => c.toUpperCase())

  const formatDate = (value) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return String(value)
    return date.toLocaleString(undefined, {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const tier = (score) => {
    const n = Number(score) || 0
    if (n >= 85) return { label: 'Elite', color: '#22c55e' }
    if (n >= 70) return { label: 'High Potential', color: '#06b6d4' }
    if (n >= 55) return { label: 'Developing', color: '#6366f1' }
    if (n >= 40) return { label: 'Foundation', color: '#f59e0b' }
    return { label: 'Needs Development', color: '#ef4444' }
  }

  const injectStyles = () => {
    if (document.getElementById(STYLE_ID)) return
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = `
      .assessment-details-trigger{margin-top:10px;border:1px solid rgba(99,102,241,.45);background:rgba(99,102,241,.12);color:#9aa3ff;border-radius:9px;padding:7px 12px;font:700 12px/1 inherit;cursor:pointer;transition:.2s}
      .assessment-details-trigger:hover{background:rgba(99,102,241,.22);transform:translateY(-1px)}
      #${MODAL_ID}{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(3,5,12,.78);backdrop-filter:blur(10px)}
      .assessment-details-card{width:min(920px,96vw);max-height:90vh;overflow:auto;background:#11131c;border:1px solid rgba(255,255,255,.12);border-radius:24px;box-shadow:0 30px 100px rgba(0,0,0,.55);color:#e8eaf2}
      .assessment-details-head{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;padding:26px 28px;border-bottom:1px solid rgba(255,255,255,.08);position:sticky;top:0;background:rgba(17,19,28,.94);backdrop-filter:blur(12px);z-index:2}
      .assessment-details-kicker{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#7f8cff;font-weight:800;margin-bottom:7px}
      .assessment-details-title{font-size:26px;font-weight:800;margin:0 0 7px}
      .assessment-details-sub{font-size:13px;color:#8f98ad}
      .assessment-details-close{border:1px solid rgba(255,255,255,.12);background:#1b1e28;color:#d8dce8;width:38px;height:38px;border-radius:11px;cursor:pointer;font-size:20px}
      .assessment-details-body{padding:24px 28px 30px}
      .assessment-details-score{display:grid;grid-template-columns:1.2fr .8fr;gap:16px;margin-bottom:22px}
      .assessment-details-scorebox,.assessment-details-info,.assessment-details-section{border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.025);border-radius:17px;padding:20px}
      .assessment-details-scorebox{display:flex;align-items:center;justify-content:space-between;gap:18px}
      .assessment-details-score-value{font-size:42px;font-weight:900;line-height:1;color:#8d94ff}
      .assessment-details-score-label{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#778096;font-weight:800}
      .assessment-details-tier{padding:8px 13px;border-radius:999px;font-size:12px;font-weight:800;border:1px solid currentColor;white-space:nowrap}
      .assessment-details-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .assessment-details-field{padding:13px 14px;border-radius:12px;background:rgba(255,255,255,.035)}
      .assessment-details-field span{display:block;color:#747e95;font-size:10px;text-transform:uppercase;letter-spacing:.08em;font-weight:800;margin-bottom:5px}
      .assessment-details-field strong{font-size:14px;color:#e5e8f1;word-break:break-word}
      .assessment-details-section{margin-top:16px}
      .assessment-details-section h3{font-size:15px;margin:0 0 14px}
      .assessment-details-table{width:100%;border-collapse:collapse}
      .assessment-details-table th,.assessment-details-table td{text-align:left;padding:11px 10px;border-bottom:1px solid rgba(255,255,255,.07);font-size:13px}
      .assessment-details-table th{color:#778096;font-size:10px;text-transform:uppercase;letter-spacing:.08em}
      .assessment-details-table td:last-child{font-weight:700;color:#dce0eb;text-align:right}
      .assessment-details-note{white-space:pre-wrap;color:#b8bfd0;line-height:1.65;font-size:13px}
      .assessment-details-status{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:800}
      .assessment-details-status-dot{width:8px;height:8px;border-radius:50%;display:inline-block}
      .assessment-details-loading{padding:50px;text-align:center;color:#929bb0}
      @media(max-width:700px){.assessment-details-score{grid-template-columns:1fr}.assessment-details-grid{grid-template-columns:1fr}.assessment-details-head{padding:20px}.assessment-details-body{padding:18px}.assessment-details-title{font-size:21px}}
    `
    document.head.appendChild(style)
  }

  const closeModal = () => document.getElementById(MODAL_ID)?.remove()

  const showModal = (assessment) => {
    closeModal()
    injectStyles()
    const score = Number(assessment.weightedScore ?? assessment.score ?? 0)
    const tierInfo = tier(score)
    let metrics = {}
    try {
      metrics = typeof assessment.metricsJson === 'string'
        ? JSON.parse(assessment.metricsJson || '{}')
        : (assessment.metricsJson || assessment.metrics || {})
    } catch { metrics = {} }

    const metricEntries = Object.entries(metrics || {})
    const benchmark = Number(assessment.benchmarkScore)
    const benchmarkText = Number.isFinite(benchmark) ? `${benchmark.toFixed(1)} / 100` : 'Not specified'
    const comparison = Number.isFinite(benchmark) ? `${(score - benchmark >= 0 ? '+' : '')}${(score - benchmark).toFixed(1)} pts` : '—'

    const modal = document.createElement('div')
    modal.id = MODAL_ID
    modal.innerHTML = `
      <div class="assessment-details-card" role="dialog" aria-modal="true" aria-label="Assessment details">
        <div class="assessment-details-head">
          <div>
            <div class="assessment-details-kicker">Assessment report</div>
            <h2 class="assessment-details-title">${escapeHtml(assessment.sport || 'Assessment')}</h2>
            <div class="assessment-details-sub">${escapeHtml(assessment.category || '—')} · ${escapeHtml(formatDate(assessment.assessedAt))}</div>
          </div>
          <button class="assessment-details-close" type="button" aria-label="Close">×</button>
        </div>
        <div class="assessment-details-body">
          <div class="assessment-details-score">
            <div class="assessment-details-scorebox">
              <div><div class="assessment-details-score-label">Weighted performance score</div><div class="assessment-details-score-value">${score.toFixed(1)}</div></div>
              <span class="assessment-details-tier" style="color:${tierInfo.color};background:${tierInfo.color}18">${tierInfo.label}</span>
            </div>
            <div class="assessment-details-info">
              <div class="assessment-details-grid">
                <div class="assessment-details-field"><span>Benchmark</span><strong>${escapeHtml(assessment.benchmarkLabel || 'Not specified')}</strong></div>
                <div class="assessment-details-field"><span>Benchmark score</span><strong>${benchmarkText}</strong></div>
                <div class="assessment-details-field"><span>Comparison</span><strong>${comparison}</strong></div>
                <div class="assessment-details-field"><span>Coach verification</span><strong class="assessment-details-status"><i class="assessment-details-status-dot" style="background:${assessment.coachVerified ? '#22c55e' : '#f59e0b'}"></i>${assessment.coachVerified ? 'Verified' : 'Pending verification'}</strong></div>
              </div>
            </div>
          </div>

          <section class="assessment-details-section">
            <h3>Metric breakdown</h3>
            ${metricEntries.length ? `
              <table class="assessment-details-table">
                <thead><tr><th>Metric</th><th>Measured value</th></tr></thead>
                <tbody>${metricEntries.map(([key, value]) => `<tr><td>${escapeHtml(formatKey(key))}</td><td>${escapeHtml(value)}</td></tr>`).join('')}</tbody>
              </table>
            ` : '<div class="assessment-details-sub">No raw metric values were stored for this assessment.</div>'}
          </section>

          <section class="assessment-details-section">
            <h3>Coach / assessment notes</h3>
            <div class="assessment-details-note">${escapeHtml(assessment.notes || 'No notes were added for this assessment.')}</div>
          </section>
        </div>
      </div>`

    document.body.appendChild(modal)
    modal.querySelector('.assessment-details-close').addEventListener('click', closeModal)
    modal.addEventListener('click', (event) => { if (event.target === modal) closeModal() })
    document.addEventListener('keydown', function onKey(event) {
      if (event.key === 'Escape') { closeModal(); document.removeEventListener('keydown', onKey) }
    })
  }

  const fetchAssessment = async (index) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) throw new Error('Session expired. Please log in again.')
    const response = await fetch(`${API_BASE}/assessments`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!response.ok) throw new Error(`Unable to load assessment (${response.status})`)
    const records = await response.json()
    const record = records[index]
    if (!record) throw new Error('Assessment record not found.')
    return record
  }

  const bindHistory = () => {
    const items = document.querySelectorAll('.history-item')
    items.forEach((item, index) => {
      if (item.dataset.detailsBound === 'true') return
      item.dataset.detailsBound = 'true'
      item.dataset.assessmentIndex = String(index)
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'assessment-details-trigger'
      button.textContent = 'View full assessment →'
      item.appendChild(button)
    })
  }

  document.addEventListener('click', async (event) => {
    const button = event.target.closest('.assessment-details-trigger')
    if (!button) return
    event.preventDefault()
    event.stopPropagation()
    const item = button.closest('.history-item')
    if (!item) return
    button.disabled = true
    button.textContent = 'Loading…'
    try {
      const record = await fetchAssessment(Number(item.dataset.assessmentIndex))
      showModal(record)
    } catch (error) {
      window.alert(error.message || 'Unable to open assessment details.')
    } finally {
      button.disabled = false
      button.textContent = 'View full assessment →'
    }
  })

  const observer = new MutationObserver(() => bindHistory())
  const start = () => {
    injectStyles()
    bindHistory()
    const root = document.getElementById('root')
    if (root) observer.observe(root, { childList: true, subtree: true })
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start)
  else start()
})()
