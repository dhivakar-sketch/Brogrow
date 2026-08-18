import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { authApi, athleteApi, assessmentApi, dashboardApi } from './services/api'
import CoachVerificationPanel from './components/CoachVerificationPanel'
import PerformanceChart from './components/PerformanceChart'

// ─── Constants ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'sportsTalentAuth'
const STORAGE_ROLE = 'sportsTalentRole'
const STORAGE_NAME = 'sportsTalentName'

const DEFAULT_SPORTS = ['Cricket', 'Football', 'Basketball', 'Athletics', 'Volleyball', 'Tennis', 'Hockey', 'Swimming', 'Rugby']

const DEFAULT_SPORT_METRICS = {
  Cricket: [
    { key: 'battingAverage', label: 'Batting Average', hint: '10–80 runs', min: 10, max: 80, unit: 'runs', lowerIsBetter: false },
    { key: 'strikeRate', label: 'Strike Rate', hint: '40–160', min: 40, max: 160, unit: '', lowerIsBetter: false },
    { key: 'bowlingEconomy', label: 'Bowling Economy', hint: '3.0–12.0 rpo', min: 3, max: 12, unit: 'rpo', lowerIsBetter: true },
    { key: 'fieldingReflexScore', label: 'Fielding Reflex Score', hint: '40–100', min: 40, max: 100, unit: '/100', lowerIsBetter: false },
    { key: 'sprintTime30m', label: '30m Sprint Time', hint: '3.5–6.0 seconds', min: 3.5, max: 6.0, unit: 's', lowerIsBetter: true },
    { key: 'coordinationScore', label: 'Coordination Score', hint: '40–100', min: 40, max: 100, unit: '/100', lowerIsBetter: false },
  ],
  Football: [
    { key: 'sprintTime40m', label: '40m Sprint Time', hint: '4.5–7.5 seconds', min: 4.5, max: 7.5, unit: 's', lowerIsBetter: true },
    { key: 'yo2VO2Max', label: 'VO₂ Max (Yo-Yo)', hint: '35–65 mL/kg/min', min: 35, max: 65, unit: 'mL/kg', lowerIsBetter: false },
    { key: 'passingAccuracy', label: 'Passing Accuracy', hint: '40–95 %', min: 40, max: 95, unit: '%', lowerIsBetter: false },
    { key: 'shotPowerScore', label: 'Shot Power Score', hint: '40–100', min: 40, max: 100, unit: '/100', lowerIsBetter: false },
    { key: 'agilityTTest', label: 'Agility T-Test', hint: '8.5–14.0 seconds', min: 8.5, max: 14, unit: 's', lowerIsBetter: true },
    { key: 'ballControlScore', label: 'Ball Control Score', hint: '40–100', min: 40, max: 100, unit: '/100', lowerIsBetter: false },
  ],
  Basketball: [
    { key: 'verticalJumpCm', label: 'Vertical Jump', hint: '30–80 cm', min: 30, max: 80, unit: 'cm', lowerIsBetter: false },
    { key: 'sprintTime20m', label: '20m Sprint Time', hint: '2.8–4.5 seconds', min: 2.8, max: 4.5, unit: 's', lowerIsBetter: true },
    { key: 'freeThrowPct', label: 'Free Throw %', hint: '30–90 %', min: 30, max: 90, unit: '%', lowerIsBetter: false },
    { key: 'threePtShootingPct', label: '3-Point Shooting %', hint: '15–55 %', min: 15, max: 55, unit: '%', lowerIsBetter: false },
    { key: 'agilityScore', label: 'Agility Score', hint: '40–100', min: 40, max: 100, unit: '/100', lowerIsBetter: false },
    { key: 'courtVision', label: 'Court Vision Score', hint: '40–100', min: 40, max: 100, unit: '/100', lowerIsBetter: false },
  ],
  Athletics: [
    { key: 'sprint100m', label: '100m Sprint Time', hint: '10.0–16.0 seconds', min: 10, max: 16, unit: 's', lowerIsBetter: true },
    { key: 'longJumpM', label: 'Long Jump', hint: '3.0–7.5 m', min: 3, max: 7.5, unit: 'm', lowerIsBetter: false },
    { key: 'shotPutM', label: 'Shot Put Distance', hint: '4.0–16.0 m', min: 4, max: 16, unit: 'm', lowerIsBetter: false },
    { key: 'endurance1500m', label: '1500m Time', hint: '240–540 seconds', min: 240, max: 540, unit: 's', lowerIsBetter: true },
    { key: 'reactionTimeMs', label: 'Reaction Time', hint: '100–280 ms', min: 100, max: 280, unit: 'ms', lowerIsBetter: true },
  ],
  Volleyball: [
    { key: 'verticalJumpCm', label: 'Vertical Jump', hint: '30–75 cm', min: 30, max: 75, unit: 'cm', lowerIsBetter: false },
    { key: 'spikeSpeedKmh', label: 'Spike Speed', hint: '40–120 km/h', min: 40, max: 120, unit: 'km/h', lowerIsBetter: false },
    { key: 'servingAccuracy', label: 'Serving Accuracy', hint: '30–95 %', min: 30, max: 95, unit: '%', lowerIsBetter: false },
    { key: 'reactionTimeMs', label: 'Reaction Time', hint: '100–300 ms', min: 100, max: 300, unit: 'ms', lowerIsBetter: true },
    { key: 'blockingScore', label: 'Blocking Score', hint: '40–100', min: 40, max: 100, unit: '/100', lowerIsBetter: false },
  ],
  Tennis: [
    { key: 'serveSpeedKmh', label: 'Serve Speed', hint: '60–180 km/h', min: 60, max: 180, unit: 'km/h', lowerIsBetter: false },
    { key: 'firstServePct', label: 'First Serve %', hint: '40–90 %', min: 40, max: 90, unit: '%', lowerIsBetter: false },
    { key: 'courtMovementScore', label: 'Court Movement Score', hint: '40–100', min: 40, max: 100, unit: '/100', lowerIsBetter: false },
    { key: 'reactionTimeMs', label: 'Reaction Time', hint: '150–500 ms', min: 150, max: 500, unit: 'ms', lowerIsBetter: true },
    { key: 'rallyConsistency', label: 'Rally Consistency', hint: '40–100', min: 40, max: 100, unit: '/100', lowerIsBetter: false },
    { key: 'agilityScore', label: 'Agility Score', hint: '40–100', min: 40, max: 100, unit: '/100', lowerIsBetter: false },
  ],
  Hockey: [
    { key: 'sprint30m', label: '30m Sprint Time', hint: '3.8–6.5 seconds', min: 3.8, max: 6.5, unit: 's', lowerIsBetter: true },
    { key: 'stickControlScore', label: 'Stick Control Score', hint: '40–100', min: 40, max: 100, unit: '/100', lowerIsBetter: false },
    { key: 'passingAccuracy', label: 'Passing Accuracy', hint: '40–95 %', min: 40, max: 95, unit: '%', lowerIsBetter: false },
    { key: 'agilityScore', label: 'Agility Score', hint: '40–100', min: 40, max: 100, unit: '/100', lowerIsBetter: false },
    { key: 'enduranceScore', label: 'Endurance Score', hint: '40–100', min: 40, max: 100, unit: '/100', lowerIsBetter: false },
    { key: 'reactionTimeMs', label: 'Reaction Time', hint: '120–420 ms', min: 120, max: 420, unit: 'ms', lowerIsBetter: true },
  ],
  Swimming: [
    { key: 'sprint50m', label: '50m Time', hint: '22.0–42.0 seconds', min: 22, max: 42, unit: 's', lowerIsBetter: true },
    { key: 'strokeEfficiency', label: 'Stroke Efficiency', hint: '40–100', min: 40, max: 100, unit: '/100', lowerIsBetter: false },
    { key: 'turnTimeSec', label: 'Turn Time', hint: '1.5–5.0 seconds', min: 1.5, max: 5, unit: 's', lowerIsBetter: true },
    { key: 'endurance400m', label: '400m Time', hint: '240–540 seconds', min: 240, max: 540, unit: 's', lowerIsBetter: true },
    { key: 'startReactionMs', label: 'Start Reaction Time', hint: '60–180 ms', min: 60, max: 180, unit: 'ms', lowerIsBetter: true },
    { key: 'kickPowerScore', label: 'Kick Power Score', hint: '40–100', min: 40, max: 100, unit: '/100', lowerIsBetter: false },
  ],
  Rugby: [
    { key: 'sprint40m', label: '40m Sprint Time', hint: '4.8–7.5 seconds', min: 4.8, max: 7.5, unit: 's', lowerIsBetter: true },
    { key: 'contactPowerScore', label: 'Contact Power Score', hint: '40–100', min: 40, max: 100, unit: '/100', lowerIsBetter: false },
    { key: 'passingAccuracy', label: 'Passing Accuracy', hint: '40–95 %', min: 40, max: 95, unit: '%', lowerIsBetter: false },
    { key: 'agilityScore', label: 'Agility Score', hint: '40–100', min: 40, max: 100, unit: '/100', lowerIsBetter: false },
    { key: 'enduranceScore', label: 'Endurance Score', hint: '40–100', min: 40, max: 100, unit: '/100', lowerIsBetter: false },
    { key: 'tackleEfficiency', label: 'Tackle Efficiency', hint: '40–100', min: 40, max: 100, unit: '/100', lowerIsBetter: false },
  ],
}

// ─── Client-side score normalizer (mirrors backend logic) ───────────────────

function computeClientScore(sport, metrics, metricCatalog = DEFAULT_SPORT_METRICS) {
  const defs = metricCatalog[sport] || DEFAULT_SPORT_METRICS[sport] || []
  let weightedSum = 0, totalWeight = 0, unweightedSum = 0, count = 0
  const perMetric = defs.length

  defs.forEach((def) => {
    const raw = parseFloat(metrics[def.key])
    if (isNaN(raw)) return
    const clamped = Math.min(def.max, Math.max(def.min, raw))
    let norm = ((clamped - def.min) / (def.max - def.min)) * 100
    if (def.lowerIsBetter) norm = 100 - norm
    const w = 1 / perMetric // equal weight on client-side preview
    weightedSum += norm * w
    totalWeight += w
    unweightedSum += norm
    count++
  })

  if (count === 0) return { score: 0, weightedScore: 0 }
  return {
    score: Math.round((unweightedSum / count) * 10) / 10,
    weightedScore: Math.round((weightedSum / totalWeight) * 10) / 10,
  }
}

function classifyTier(score) {
  if (score >= 85) return { label: 'Elite', color: '#22c55e' }
  if (score >= 70) return { label: 'High Potential', color: '#06b6d4' }
  if (score >= 55) return { label: 'Developing', color: '#6366f1' }
  if (score >= 40) return { label: 'Foundation', color: '#f59e0b' }
  return { label: 'Needs Development', color: '#ef4444' }
}

// ─── Toast notification hook ─────────────────────────────────────────────────

function useToast() {
  const [toasts, setToasts] = useState([])
  const add = useCallback((msg, type = 'info') => {
    const id = Date.now()
    setToasts((t) => [...t, { id, msg, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
  }, [])
  return { toasts, toast: add }
}

const TOAST_ICONS = { success: '✓', error: '✕', info: '◈' }

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  // Auth state
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY) || '')
  const [role, setRole]   = useState(() => localStorage.getItem(STORAGE_ROLE) || 'ATHLETE')
  const [userName, setUserName] = useState(() => localStorage.getItem(STORAGE_NAME) || '')
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'ATHLETE' })
  const [authLoading, setAuthLoading] = useState(false)

  // Navigation
  const [activeTab, setActiveTab] = useState('dashboard')

  // Profile
  const [profileForm, setProfileForm] = useState({
    athleteName: '', dateOfBirth: '', gender: 'Female', location: '',
    heightCm: '', weightKg: '', primarySport: 'Cricket', secondarySport: 'Athletics',
    playingPosition: '', skillLevel: 'Intermediate', yearsOfTraining: '',
    coachName: '', academyName: '', phoneNumber: '', emergencyContact: '',
    privacyEnabled: true,
  })
  const [profileSaving, setProfileSaving] = useState(false)

  // Assessment
  const [assessmentForm, setAssessmentForm] = useState({
    sport: 'Cricket', category: 'FITNESS', notes: '', benchmarkLabel: '', benchmarkScore: '',
    score: '', weightedScore: '',
  })
  const [sportCatalog, setSportCatalog] = useState([])
  const [sportMetrics, setSportMetrics] = useState(DEFAULT_SPORT_METRICS)
  const [metricValues, setMetricValues] = useState({})
  const [assessmentSaving, setAssessmentSaving] = useState(false)

  // Data
  const [dashboard, setDashboard]   = useState(null)
  const [assessments, setAssessments] = useState([])
  const [insights, setInsights]     = useState([])
  const [dashLoading, setDashLoading] = useState(false)
  const [histLoading, setHistLoading] = useState(false)

  // Coach panel
  const coachAthletes = [
    { name: 'Aarav S.', sport: 'Cricket',    score: 86, status: 'Coach verified', trend: '+6.1%' },
    { name: 'Meera K.', sport: 'Basketball', score: 81, status: 'Recommended',   trend: '+4.4%' },
    { name: 'Rohit P.', sport: 'Athletics',  score: 74, status: 'In review',      trend: '+2.9%' },
  ]

  const { toasts, toast } = useToast()
  const isLoggedIn = Boolean(token)

  // ── Persist auth ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (token) {
      localStorage.setItem(STORAGE_KEY, token)
      localStorage.setItem(STORAGE_ROLE, role)
      localStorage.setItem(STORAGE_NAME, userName)
    } else {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(STORAGE_ROLE)
      localStorage.removeItem(STORAGE_NAME)
    }
  }, [token, role, userName])

  useEffect(() => {
    const loadSportCatalog = async () => {
      try {
        const data = await apiRequest('/sports')
        if (Array.isArray(data) && data.length) {
          setSportCatalog(data)
          const nextMetrics = { ...DEFAULT_SPORT_METRICS }
          data.forEach((sport) => {
            if (sport.name && sport.metrics) {
              const metricList = Object.entries(sport.metrics).map(([key, config]) => ({
                key,
                label: config.label || key,
                hint: `${config.min ?? 0}–${config.max ?? 100}`,
                min: config.min ?? 0,
                max: config.max ?? 100,
                unit: config.unit || '',
                lowerIsBetter: Boolean(config.lowerIsBetter),
              }))
              nextMetrics[sport.name] = metricList
            }
          })
          setSportMetrics(nextMetrics)
          const names = data.map((sport) => sport.name)
          if (names.length && !names.includes(assessmentForm.sport)) {
            setAssessmentForm((form) => ({ ...form, sport: names[0] }))
          }
        }
      } catch {
        setSportCatalog([])
      }
    }

    loadSportCatalog()
  }, [])

  // ── Fetch data on login ─────────────────────────────────────────────────────
  useEffect(() => {
    if (token) {
      fetchDashboard()
      fetchHistory()
      fetchInsights()
    }
  }, [token])

  // ── Reset metrics when sport changes ────────────────────────────────────────
  useEffect(() => {
    setMetricValues({})
    const currentSport = assessmentForm.sport
    const availableMetrics = sportMetrics[currentSport] || DEFAULT_SPORT_METRICS[currentSport] || []
    if (!availableMetrics.length) {
      fetch(`http://localhost:8080/api/sports/${encodeURIComponent(currentSport.toLowerCase())}/metrics`)
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (!data || !Object.keys(data).length) return
          const metricList = Object.entries(data).map(([key, config]) => ({
            key,
            label: config.label || key,
            hint: `${config.min ?? 0}–${config.max ?? 100}`,
            min: config.min ?? 0,
            max: config.max ?? 100,
            unit: config.unit || '',
            lowerIsBetter: Boolean(config.lowerIsBetter),
          }))
          setSportMetrics((prev) => ({ ...prev, [currentSport]: metricList }))
        })
        .catch(() => {})
    }
  }, [assessmentForm.sport, sportMetrics])

  // ── Computed client-side score preview ──────────────────────────────────────
  const scorePreview = useMemo(() => {
    return computeClientScore(assessmentForm.sport, metricValues, sportMetrics)
  }, [assessmentForm.sport, metricValues, sportMetrics])

  const tierPreview = useMemo(() => classifyTier(scorePreview.weightedScore), [scorePreview])

  // ─── Data fetchers ──────────────────────────────────────────────────────────

  const fetchDashboard = async () => {
    setDashLoading(true)
    try {
      const data = await dashboardApi.overview(token)
      setDashboard(data)
    } catch {
      // dashboard stays null; UI shows skeleton
    } finally {
      setDashLoading(false)
    }
  }

  const fetchHistory = async () => {
    setHistLoading(true)
    try {
      const data = await assessmentApi.history(token)
      if (Array.isArray(data)) setAssessments(data)
    } catch {
      setAssessments([])
    } finally {
      setHistLoading(false)
    }
  }

  const fetchInsights = async () => {
    try {
      const data = await assessmentApi.insights(token)
      if (Array.isArray(data)) setInsights(data)
    } catch {
      setInsights([])
    }
  }

  // ─── Auth handlers ──────────────────────────────────────────────────────────

  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    setAuthLoading(true)
    try {
      let result
      if (authMode === 'register') {
        result = await authApi.register({
          firstName: authForm.firstName,
          lastName:  authForm.lastName,
          email:     authForm.email,
          password:  authForm.password,
          role:      authForm.role,
        })
        toast('Account created successfully!', 'success')
      } else {
        result = await authApi.login({ email: authForm.email, password: authForm.password })
        toast('Login successful. Welcome back!', 'success')
      }
      setToken(result?.token || '')
      setRole(result?.role || authForm.role || 'ATHLETE')
      const name = result?.firstName
        ? `${result.firstName} ${result.lastName || ''}`.trim()
        : authForm.email
      setUserName(name)
      setActiveTab('dashboard')
    } catch (err) {
      const msg = err?.message || 'Authentication failed'
      toast(msg.includes('{') ? 'Invalid credentials. Please try again.' : msg, 'error')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    setToken('')
    setRole('ATHLETE')
    setUserName('')
    setDashboard(null)
    setAssessments([])
    setInsights([])
    toast('Logged out successfully.', 'info')
  }

  // ─── Profile handler ────────────────────────────────────────────────────────

  const saveProfile = async () => {
    if (!token) { toast('Please log in first.', 'error'); return }
    setProfileSaving(true)
    try {
      await athleteApi.profile(token, profileForm)
      toast('Profile saved successfully.', 'success')
    } catch (err) {
      toast(`Profile save failed: ${err.message}`, 'error')
    } finally {
      setProfileSaving(false)
    }
  }

  // ─── Assessment handler ─────────────────────────────────────────────────────

  const submitAssessment = async () => {
    if (!token) { toast('Please log in before submitting an assessment.', 'error'); return }
    setAssessmentSaving(true)
    try {
      const hasMetrics = Object.keys(metricValues).length > 0
      const payload = {
        sport:           assessmentForm.sport,
        category:        assessmentForm.category,
        score:           hasMetrics ? scorePreview.score : (parseFloat(assessmentForm.score) || 0),
        weightedScore:   hasMetrics ? scorePreview.weightedScore : (parseFloat(assessmentForm.weightedScore) || 0),
        notes:           assessmentForm.notes,
        benchmarkLabel:  assessmentForm.benchmarkLabel,
        benchmarkScore:  assessmentForm.benchmarkScore ? parseFloat(assessmentForm.benchmarkScore) : null,
        metrics:         hasMetrics ? metricValues : null,
      }
      const saved = await assessmentApi.save(token, payload)
      setAssessments((cur) => [saved, ...cur])
      toast('Assessment submitted and saved successfully.', 'success')
      setMetricValues({})
      setAssessmentForm((f) => ({ ...f, notes: '', benchmarkLabel: '', benchmarkScore: '', score: '', weightedScore: '' }))
      fetchDashboard()

      // Auto-generate insight after assessment
      try {
        await assessmentApi.generateInsight(token, assessmentForm.sport)
        fetchInsights()
      } catch { /* insight generation is best-effort */ }
    } catch (err) {
      toast(`Failed to save: ${err.message}`, 'error')
    } finally {
      setAssessmentSaving(false)
    }
  }

  const generateInsight = async (sport) => {
    try {
      await assessmentApi.generateInsight(token, sport)
      await fetchInsights()
      toast(`Talent insight generated for ${sport}.`, 'success')
    } catch (err) {
      toast(`Could not generate insight: ${err.message}`, 'error')
    }
  }

  // ─── Performance trend data (from dashboard or assessments) ─────────────────

  const trendData = useMemo(() => {
    if (dashboard?.performanceTrend?.length) return dashboard.performanceTrend
    if (assessments.length) {
      return [...assessments]
        .reverse()
        .slice(-6)
        .map((a) => ({ label: a.sport?.slice(0, 3) || '?', value: a.weightedScore ?? a.score ?? 0 }))
    }
    return []
  }, [dashboard, assessments])

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const userInitials = userName
    ? userName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const sportOptions = useMemo(
    () => (sportCatalog.length ? sportCatalog.map((s) => s.name) : DEFAULT_SPORTS),
    [sportCatalog]
  )

  const TABS = [
    { id: 'dashboard', label: '⬡ Dashboard' },
    { id: 'profile',   label: '◎ Profile' },
    { id: 'assess',    label: '⊞ Assessment' },
    { id: 'history',   label: '◷ History' },
    { id: 'insights',  label: '◈ Insights' },
    ...(role === 'COACH' || role === 'ACADEMY' || role === 'ADMIN'
      ? [{ id: 'coach', label: '✦ Coach Panel' }]
      : []),
  ]

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="app-shell">

      {/* ── Topbar ─────────────────────────────────────────────────────── */}
      <header className="topbar">
        <div className="brand-mark">
          <div className="brand-icon">🏆</div>
          <div>
            <p className="eyebrow">Sports talent intelligence</p>
            <h1>Talent Assessment Platform</h1>
          </div>
        </div>
        <div className="topbar-actions">
          {isLoggedIn ? (
            <>
              <div className="user-chip">
                <div className="user-avatar">{userInitials}</div>
                <span>{userName || role}</span>
              </div>
              <button className="ghost-btn" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <button className="primary-btn" onClick={() => setAuthMode('login')}>Sign In</button>
          )}
        </div>
      </header>

      <main className="layout">

        {/* ── Left Sidebar: Auth / Account ───────────────────────────── */}
        <aside className="panel auth-panel">
          <div className="panel-header">
            <h2>{isLoggedIn ? 'Session active' : 'Secure access'}</h2>
          </div>

          {!isLoggedIn ? (
            <form className="stack" onSubmit={handleAuthSubmit}>
              <div className="segmented-control">
                <button type="button" className={authMode === 'login' ? 'segment active' : 'segment'}
                  onClick={() => setAuthMode('login')}>Login</button>
                <button type="button" className={authMode === 'register' ? 'segment active' : 'segment'}
                  onClick={() => setAuthMode('register')}>Register</button>
              </div>

              {authMode === 'register' && (
                <>
                  <label>
                    First name
                    <input required value={authForm.firstName}
                      onChange={(e) => setAuthForm({ ...authForm, firstName: e.target.value })} />
                  </label>
                  <label>
                    Last name
                    <input value={authForm.lastName}
                      onChange={(e) => setAuthForm({ ...authForm, lastName: e.target.value })} />
                  </label>
                </>
              )}

              <label>
                Email address
                <input type="email" required value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} />
              </label>

              <label>
                Password
                <input type="password" required value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} />
              </label>

              {authMode === 'register' && (
                <label>
                  Role
                  <select value={authForm.role}
                    onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}>
                    <option value="ATHLETE">Athlete</option>
                    <option value="COACH">Coach</option>
                    <option value="ACADEMY">Academy</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </label>
              )}

              <button className="primary-btn full" type="submit" disabled={authLoading}>
                {authLoading
                  ? <><span className="loading-spinner" />Processing…</>
                  : authMode === 'register' ? 'Create account' : 'Login'}
              </button>
            </form>
          ) : (
            <div className="stack">
              <div className="status-card status-success">
                <div className="status-tag">
                  <span className="status-dot" />
                  {role}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  Authenticated as <strong style={{ color: 'var(--text-primary)' }}>{userName || 'user'}</strong>
                </p>
              </div>
              <div className="mini-stat">
                <strong>Decision-support system</strong>
                <span>All assessments require qualified coach validation before use in selection decisions.</span>
              </div>
              <div className="mini-stat">
                <strong>Data recorded</strong>
                <span>{assessments.length} assessment{assessments.length !== 1 ? 's' : ''} · {insights.length} insight{insights.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )}
        </aside>

        {/* ── Main Content ───────────────────────────────────────────── */}
        <section className="main-panel">

          {/* Tab navigation */}
          {isLoggedIn && (
            <nav className="tabs" role="tablist">
              {TABS.map((t) => (
                <button key={t.id} role="tab" aria-selected={activeTab === t.id}
                  className={activeTab === t.id ? 'tab-btn active' : 'tab-btn'}
                  onClick={() => setActiveTab(t.id)}>
                  {t.label}
                </button>
              ))}
            </nav>
          )}

          {/* ── Dashboard Tab ──────────────────────────────────────── */}
          {(!isLoggedIn || activeTab === 'dashboard') && (
            <>
              {/* Overview score */}
              <div className="panel overview-panel">
                <div className="panel-header split-row">
                  <div>
                    <p className="eyebrow">Performance snapshot</p>
                    <h2>{role === 'COACH' || role === 'ACADEMY' ? 'Coach performance overview' : 'Athlete performance dashboard'}</h2>
                  </div>
                  <div className="score-badge">
                    <span className="score-value">
                      {dashLoading ? '…' : (dashboard?.overallScore?.toFixed(1) ?? (assessments.length ? '—' : '—'))}
                    </span>
                    <span className="score-label">/ 100</span>
                  </div>
                </div>

                <div className="stat-grid">
                  <div className="metric-card accent">
                    <span>Overall score</span>
                    <strong>{dashLoading ? '…' : (dashboard?.overallScore?.toFixed(1) ?? '—')}</strong>
                    <small>{dashboard?.trend || (isLoggedIn ? 'Submit your first assessment' : 'Login to view')}</small>
                  </div>
                  <div className="metric-card teal">
                    <span>Assessments</span>
                    <strong>{dashboard?.totalAssessments ?? assessments.length}</strong>
                    <small>Total recorded</small>
                  </div>
                  <div className="metric-card green">
                    <span>Strengths</span>
                    <strong>{dashboard?.strengths?.length ?? '—'}</strong>
                    <small>Strong categories</small>
                  </div>
                  <div className="metric-card warm">
                    <span>Growth areas</span>
                    <strong>{dashboard?.growthAreas?.length ?? '—'}</strong>
                    <small>Focus categories</small>
                  </div>
                </div>
              </div>

              {/* Strengths & growth areas */}
              {dashboard && (
                <div className="two-column">
                  <div className="panel">
                    <div className="panel-header">
                      <h2>💪 Strengths</h2>
                    </div>
                    {dashboard.strengths?.length ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {dashboard.strengths.map((s, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10,
                            background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)',
                            borderRadius: 10, padding: '10px 14px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            <span style={{ color: '#22c55e', fontWeight: 700 }}>✓</span> {s}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state"><div className="empty-icon">🏅</div>Submit assessments to discover your strengths</div>
                    )}
                  </div>
                  <div className="panel">
                    <div className="panel-header">
                      <h2>🎯 Growth areas</h2>
                    </div>
                    {dashboard.growthAreas?.length ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {dashboard.growthAreas.map((g, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10,
                            background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
                            borderRadius: 10, padding: '10px 14px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            <span style={{ color: '#f59e0b', fontWeight: 700 }}>→</span> {g}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state"><div className="empty-icon">🎯</div>All categories performing well</div>
                    )}
                  </div>
                </div>
              )}

              {/* Performance chart */}
              <div className="two-column">
                <PerformanceChart data={trendData} />
                {(role === 'COACH' || role === 'ACADEMY' || role === 'ADMIN') && (
                  <CoachVerificationPanel athletes={coachAthletes}
                    onApprove={(a) => toast(`${a.name} verified by coach.`, 'success')}
                    onReject={(a) => toast(`${a.name} returned for re-assessment.`, 'info')} />
                )}
                {role === 'ATHLETE' && (
                  <div className="panel">
                    <div className="panel-header"><h2>◈ Quick insight</h2></div>
                    {dashboard?.latestInsights?.length ? (
                      dashboard.latestInsights.map((ins, i) => (
                        <div key={i} className="insight-box" style={{ marginBottom: 10 }}>
                          <div className="score-line">
                            <span>{ins.sport}</span>
                            <strong>{typeof ins.score === 'number' ? ins.score.toFixed(1) : ins.score}/100</strong>
                          </div>
                          <p>{ins.summary}</p>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state"><div className="empty-icon">◈</div>
                        <p>Submit assessments to generate AI-assisted talent insights.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Profile Tab ────────────────────────────────────────── */}
          {isLoggedIn && activeTab === 'profile' && (
            <div className="panel">
              <div className="panel-header">
                <h2>◎ Athlete profile</h2>
                <span className="muted">Personal & sport details</span>
              </div>
              <div className="form-grid">
                <label>Athlete name<input value={profileForm.athleteName}
                  onChange={(e) => setProfileForm({ ...profileForm, athleteName: e.target.value })} /></label>
                <label>Date of birth<input type="date" value={profileForm.dateOfBirth}
                  onChange={(e) => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })} /></label>
                <label>Gender
                  <select value={profileForm.gender}
                    onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}>
                    <option>Female</option><option>Male</option><option>Other</option>
                  </select>
                </label>
                <label>Location<input value={profileForm.location}
                  onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })} /></label>
                <label>Height (cm)<input type="number" value={profileForm.heightCm}
                  onChange={(e) => setProfileForm({ ...profileForm, heightCm: e.target.value })} /></label>
                <label>Weight (kg)<input type="number" value={profileForm.weightKg}
                  onChange={(e) => setProfileForm({ ...profileForm, weightKg: e.target.value })} /></label>
                <label>Primary sport
                  <select value={profileForm.primarySport}
                    onChange={(e) => setProfileForm({ ...profileForm, primarySport: e.target.value })}>
                    {sportOptions.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </label>
                <label>Secondary sport
                  <select value={profileForm.secondarySport}
                    onChange={(e) => setProfileForm({ ...profileForm, secondarySport: e.target.value })}>
                    {sportOptions.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </label>
                <label>Playing position<input value={profileForm.playingPosition}
                  onChange={(e) => setProfileForm({ ...profileForm, playingPosition: e.target.value })} /></label>
                <label>Skill level
                  <select value={profileForm.skillLevel}
                    onChange={(e) => setProfileForm({ ...profileForm, skillLevel: e.target.value })}>
                    <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                  </select>
                </label>
                <label>Years of training<input type="number" value={profileForm.yearsOfTraining}
                  onChange={(e) => setProfileForm({ ...profileForm, yearsOfTraining: e.target.value })} /></label>
                <label>Coach name<input value={profileForm.coachName}
                  onChange={(e) => setProfileForm({ ...profileForm, coachName: e.target.value })} /></label>
                <label>Academy name<input value={profileForm.academyName}
                  onChange={(e) => setProfileForm({ ...profileForm, academyName: e.target.value })} /></label>
                <label>Phone number<input value={profileForm.phoneNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })} /></label>
              </div>
              <div className="button-row">
                <button className="primary-btn" onClick={saveProfile} disabled={profileSaving}>
                  {profileSaving ? <><span className="loading-spinner" />Saving…</> : 'Save profile'}
                </button>
              </div>
            </div>
          )}

          {/* ── Assessment Tab ─────────────────────────────────────── */}
          {isLoggedIn && activeTab === 'assess' && (
            <div className="panel">
              <div className="panel-header">
                <h2>⊞ Assessment entry</h2>
                <span className="muted">Raw metrics → normalised score</span>
              </div>

              <div className="form-grid">
                <label>Sport
                  <select value={assessmentForm.sport}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, sport: e.target.value })}>
                    {sportOptions.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </label>
                <label>Category
                  <select value={assessmentForm.category}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, category: e.target.value })}>
                    <option>FITNESS</option><option>SKILL</option><option>PERFORMANCE</option>
                    <option>TACTICAL</option><option>PSYCHOLOGICAL</option>
                  </select>
                </label>
                <label>Benchmark label<input value={assessmentForm.benchmarkLabel} placeholder="e.g. U-17 national"
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, benchmarkLabel: e.target.value })} /></label>
                <label>Benchmark score<input type="number" value={assessmentForm.benchmarkScore} placeholder="0–100"
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, benchmarkScore: e.target.value })} /></label>

                {/* Dynamic sport-specific metric inputs */}
                <div className="metrics-section full-span">
                  <div className="metrics-section-title">
                    ◈ {assessmentForm.sport} raw metrics — enter measured values
                  </div>
                  <div className="metrics-grid">
                    {(sportMetrics[assessmentForm.sport] || DEFAULT_SPORT_METRICS[assessmentForm.sport] || []).map((def) => (
                      <label key={def.key}>
                        {def.label} {def.unit && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({def.unit})</span>}
                        <input
                          id={`metric-${def.key}`}
                          type="number"
                          step="0.1"
                          placeholder={def.hint}
                          value={metricValues[def.key] ?? ''}
                          onChange={(e) => setMetricValues((m) => ({ ...m, [def.key]: parseFloat(e.target.value) || '' }))}
                        />
                        <span className="metric-hint">{def.lowerIsBetter ? '▼ lower is better' : '▲ higher is better'}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Score preview */}
                {scorePreview.weightedScore > 0 && (
                  <div className="score-preview full-span">
                    <div>
                      <div className="score-preview-label">Live score preview</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        Calculated from entered metrics · will be refined on submission
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Weighted</div>
                        <div className="score-preview-value">{scorePreview.weightedScore}</div>
                      </div>
                      <div style={{
                        padding: '4px 12px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700,
                        background: `${tierPreview.color}22`, color: tierPreview.color,
                        border: `1px solid ${tierPreview.color}55`
                      }}>
                        {tierPreview.label}
                      </div>
                    </div>
                  </div>
                )}

                <label className="full-span">Notes
                  <textarea value={assessmentForm.notes} rows={3}
                    placeholder="Coach observations, conditions, context…"
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, notes: e.target.value })} />
                </label>
              </div>

              <div className="button-row">
                <button className="ghost-btn" onClick={() => { setMetricValues({}); setAssessmentForm((f) => ({ ...f, notes: '', benchmarkLabel: '', benchmarkScore: '' })) }}>
                  Clear
                </button>
                <button className="primary-btn" onClick={submitAssessment} disabled={assessmentSaving}>
                  {assessmentSaving ? <><span className="loading-spinner" />Saving…</> : 'Submit assessment'}
                </button>
              </div>
            </div>
          )}

          {/* ── History Tab ─────────────────────────────────────────── */}
          {isLoggedIn && activeTab === 'history' && (
            <div className="panel">
              <div className="panel-header split-row">
                <h2>◷ Assessment history</h2>
                <span className="muted">{assessments.length} record{assessments.length !== 1 ? 's' : ''}</span>
              </div>
              {histLoading ? (
                <div className="empty-state"><span className="loading-spinner" /> Loading…</div>
              ) : assessments.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <p>No assessments yet. Submit your first one in the Assessment tab.</p>
                </div>
              ) : (
                <div className="history-list">
                  {assessments.map((rec, i) => {
                    const tier = classifyTier(rec.weightedScore ?? rec.score ?? 0)
                    return (
                      <div className="history-item" key={rec.id ?? i}>
                        <div>
                          <strong>{rec.sport}</strong>
                          <span className="category-pill">{rec.category}</span>
                          {rec.notes && <small style={{ marginTop: 4 }}>{rec.notes.slice(0, 60)}{rec.notes.length > 60 ? '…' : ''}</small>}
                        </div>
                        <div>
                          <strong style={{ color: tier.color }}>{(rec.weightedScore ?? rec.score ?? 0).toFixed(1)}</strong>
                          <small>Weighted score</small>
                          <small>{rec.benchmarkLabel || ''}</small>
                        </div>
                        <div>
                          <div style={{
                            display: 'inline-block', padding: '3px 10px', borderRadius: 999,
                            fontSize: '0.72rem', fontWeight: 700,
                            background: `${tier.color}22`, color: tier.color,
                            border: `1px solid ${tier.color}44`
                          }}>{tier.label}</div>
                          {rec.assessedAt && (
                            <small style={{ marginTop: 4 }}>
                              {new Date(rec.assessedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                            </small>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Insights Tab ────────────────────────────────────────── */}
          {isLoggedIn && activeTab === 'insights' && (
            <div className="panel">
              <div className="panel-header split-row">
                <h2>◈ Talent insights</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(sportCatalog.length ? sportCatalog.map((s) => s.name) : DEFAULT_SPORTS).map((s) => (
                    <button key={s} className="ghost-btn" style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                      onClick={() => generateInsight(s)}>
                      + {s}
                    </button>
                  ))}
                </div>
              </div>

              {insights.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">◈</div>
                  <p>No insights yet. Submit assessments or click a sport button above to generate one.</p>
                </div>
              ) : (
                <div className="insights-list">
                  {insights.map((item, i) => {
                    const tier = classifyTier(item.overallScore ?? 0)
                    return (
                      <div key={item.id ?? i} className="insight-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <h3>{item.sport}</h3>
                          <div style={{
                            padding: '4px 12px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700,
                            background: `${tier.color}22`, color: tier.color, border: `1px solid ${tier.color}44`
                          }}>{tier.label}</div>
                        </div>
                        <div className="score-line">
                          <span>Overall assessment score</span>
                          <strong>{item.overallScore?.toFixed(1) ?? '—'} / 100</strong>
                        </div>
                        <p>{item.summary}</p>
                        {item.recommendations && (
                          <ul>
                            <li>{item.recommendations}</li>
                            {item.caution && <li style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>{item.caution}</li>}
                          </ul>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Coach Panel Tab ─────────────────────────────────────── */}
          {isLoggedIn && activeTab === 'coach' && (
            <div className="two-column">
              <CoachVerificationPanel athletes={coachAthletes}
                onApprove={(a) => toast(`${a.name} verified by coach.`, 'success')}
                onReject={(a) => toast(`${a.name} returned for re-assessment.`, 'info')} />
              <div className="panel">
                <div className="panel-header"><h2>⬡ Squad overview</h2></div>
                <div className="coach-list">
                  {coachAthletes.map((a) => (
                    <div key={a.name} className="coach-item">
                      <div>
                        <strong>{a.name}</strong>
                        <small>{a.sport}</small>
                      </div>
                      <div>
                        <strong style={{ color: classifyTier(a.score).color }}>{a.score}</strong>
                        <small>{a.status}</small>
                      </div>
                      <span className={a.trend.startsWith('+') ? 'trend-up' : 'trend-down'}>{a.trend}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </section>
      </main>

      {/* ── Toast Notifications ──────────────────────────────────────── */}
      <div className="toast-area" role="alert" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span className="toast-icon">{TOAST_ICONS[t.type] ?? '◈'}</span>
            <span className="toast-msg">{t.msg}</span>
          </div>
        ))}
      </div>

    </div>
  )
}
