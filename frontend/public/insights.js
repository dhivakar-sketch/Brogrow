(() => {
  const TOKEN_KEY = 'sportsTalentAuth'
  const API_BASE = (window.__SPORTS_API_BASE__ || 'http://localhost:8080/api').replace(/\/$/, '')
  const ROOT_ID = 'brogrow-insights-view'
  const STYLE_ID = 'brogrow-insights-styles'
  let lastLoaded = 0

  const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
  const scoreOf = (x) => Number(x?.weightedScore ?? x?.score ?? 0)
  const titleCase = (v) => String(v || '').replace(/[_-]/g, ' ').replace(/^./, c => c.toUpperCase())

  const injectStyles = () => {
    if (document.getElementById(STYLE_ID)) return
    const s = document.createElement('style')
    s.id = STYLE_ID
    s.textContent = `
      #${ROOT_ID}{margin-top:22px}
      .bi-hero{padding:26px;border:1px solid rgba(99,102,241,.28);border-radius:20px;background:linear-gradient(135deg,rgba(37,40,83,.42),rgba(6,182,212,.06));margin-bottom:16px}
      .bi-eyebrow{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#8790ff;font-weight:800;margin:0 0 7px}
      .bi-title{font-size:28px;font-weight:850;margin:0 0 7px;color:var(--text-primary,#eef0f7)}
      .bi-sub{font-size:13px;color:var(--text-secondary,#929bb0);margin:0}
      .bi-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
      .bi-card{border:1px solid rgba(255,255,255,.09);border-radius:17px;background:rgba(255,255,255,.025);padding:20px}
      .bi-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:15px}
      .bi-sport{font-size:17px;font-weight:800;color:var(--text-primary,#eef0f7)}
      .bi-date{font-size:11px;color:#778096;margin-top:4px}
      .bi-score{font-size:25px;font-weight:900;color:#8d94ff}
      .bi-section-title{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#788197;font-weight:800;margin:15px 0 8px}
      .bi-summary{font-size:13px;line-height:1.65;color:#b8bfd0;margin:0}
      .bi-list{display:flex;flex-wrap:wrap;gap:7px}
      .bi-chip{padding:7px 10px;border-radius:9px;background:rgba(99,102,241,.09);border:1px solid rgba(99,102,241,.2);font-size:12px;color:#b9beff}
      .bi-action{margin-top:15px;padding:10px 12px;border-radius:10px;background:rgba(6,182,212,.08);border:1px solid rgba(6,182,212,.18);font-size:12px;color:#9deaf5;line-height:1.5}
      .bi-empty{text-align:center;padding:55px 20px;color:#8f98ad;border:1px dashed rgba(255,255,255,.12);border-radius:16px}
      .bi-loading{text-align:center;padding:45px;color:#8f98ad}
      .bi-refresh{float:right;border:1px solid rgba(255,255,255,.12);background:#191c26;color:#bfc5d5;border-radius:9px;padding:7px 10px;cursor:pointer;font-weight:700}
      @media(max-width:760px){.bi-grid{grid-template-columns:1fr}.bi-title{font-size:23px}}
    `
    document.head.appendChild(s)
  }

  const render = (insights, assessments) => {
    const host = document.querySelector('.main-panel')
    const tabs = document.querySelector('.tabs')
    if (!host || !tabs) return
    let root = document.getElementById(ROOT_ID)
    if (!root) { root = document.createElement('div'); root.id = ROOT_ID; host.appendChild(root) }
    injectStyles()

    const records = Array.isArray(insights) ? insights : []
    const latest = records.slice().sort((a,b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0))
    const cards = latest.map((ins, i) => {
      const matching = (assessments || []).find(a => a.sport === ins.sport)
      const score = Number(ins.score ?? matching?.weightedScore ?? matching?.score ?? 0)
      const strengths = Array.isArray(ins.strengths) ? ins.strengths : (ins.strength ? [ins.strength] : [])
      const areas = Array.isArray(ins.growthAreas) ? ins.growthAreas : (Array.isArray(ins.areasToImprove) ? ins.areasToImprove : [])
      const recommendations = Array.isArray(ins.recommendations) ? ins.recommendations : (ins.recommendation ? [ins.recommendation] : [])
      return `<article class="bi-card">
        <div class="bi-card-head"><div><div class="bi-sport">${esc(ins.sport || matching?.sport || 'Performance insight')}</div><div class="bi-date">${esc(ins.category || matching?.category || 'Talent analysis')} · ${esc(ins.createdAt ? new Date(ins.createdAt).toLocaleDateString() : 'Latest')}</div></div><div class="bi-score">${score.toFixed(1)}<small style="font-size:11px;color:#707990">/100</small></div></div>
        <div class="bi-section-title">AI-assisted performance summary</div>
        <p class="bi-summary">${esc(ins.summary || ins.message || ins.insight || 'No summary available for this insight yet.')}</p>
        ${strengths.length ? `<div class="bi-section-title">Strengths</div><div class="bi-list">${strengths.map(x => `<span class="bi-chip">✓ ${esc(x)}</span>`).join('')}</div>` : ''}
        ${areas.length ? `<div class="bi-section-title">Growth areas</div><div class="bi-list">${areas.map(x => `<span class="bi-chip">→ ${esc(x)}</span>`).join('')}</div>` : ''}
        ${recommendations.length ? `<div class="bi-section-title">Recommended focus</div><div class="bi-action">${recommendations.map(x => `💡 ${esc(x)}`).join('<br>')}</div>` : ''}
      </article>`
    }).join('')

    root.innerHTML = `<div class="bi-hero"><button class="bi-refresh" type="button">↻ Refresh</button><p class="bi-eyebrow">Talent intelligence</p><h2 class="bi-title">Performance Insights</h2><p class="bi-sub">AI-assisted interpretation of your assessment history. Use these insights as decision support and review them with a qualified coach.</p></div>${cards ? `<div class="bi-grid">${cards}</div>` : '<div class="bi-empty">◈<br><br>No insights available yet.<br>Complete an assessment to generate your first performance insight.</div>'}`
    root.querySelector('.bi-refresh')?.addEventListener('click', () => load(true))
  }

  const load = async (force = false) => {
    const tab = [...document.querySelectorAll('.tab-btn')].find(b => /insight/i.test(b.textContent || ''))
    if (!tab?.classList.contains('active')) return
    if (!force && Date.now() - lastLoaded < 800) return
    lastLoaded = Date.now()
    const root = document.getElementById(ROOT_ID)
    if (root) root.innerHTML = '<div class="bi-loading">Loading performance insights…</div>'
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const [insRes, assRes] = await Promise.all([
        fetch(`${API_BASE}/talent-insights`, { headers }),
        fetch(`${API_BASE}/assessments`, { headers })
      ])
      const insights = insRes.ok ? await insRes.json() : []
      const assessments = assRes.ok ? await assRes.json() : []
      render(Array.isArray(insights) ? insights : [], Array.isArray(assessments) ? assessments : [])
    } catch {
      const host = document.getElementById(ROOT_ID)
      if (host) host.innerHTML = '<div class="bi-empty">Unable to load insights. Make sure the Spring Boot backend is running.</div>'
    }
  }

  const sync = () => {
    const active = [...document.querySelectorAll('.tab-btn')].find(b => /insight/i.test(b.textContent || '') && b.classList.contains('active'))
    const root = document.getElementById(ROOT_ID)
    if (active) load()
    else if (root) root.remove()
  }

  const start = () => {
    injectStyles()
    const root = document.getElementById('root')
    if (root) new MutationObserver(sync).observe(root, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] })
    document.addEventListener('click', (e) => { if (e.target.closest('.tab-btn') && /insight/i.test(e.target.closest('.tab-btn').textContent || '')) setTimeout(() => load(true), 60) })
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start()
})()
