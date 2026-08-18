const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api'

async function apiRequest(endpoint, options = {}, fallbackData = null) {
  const requestHeaders = { ...(options.headers || {}) }

  if (options.token) {
    requestHeaders.Authorization = `Bearer ${options.token}`
  }

  if (options.body !== undefined && !requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: requestHeaders,
  })

  if (!response.ok) {
    if (fallbackData !== null) {
      return fallbackData
    }

    const text = await response.text()
    let parsedMessage = text
    try {
      const parsedJson = JSON.parse(text)
      parsedMessage = parsedJson.message || parsedJson.error || text
    } catch {
      parsedMessage = text || 'Request failed'
    }
    throw new Error(parsedMessage)
  }

  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    return null
  }

  return response.json()
}

export const authApi = {
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
}

export const athleteApi = {
  profile: (token, payload) => apiRequest('/athletes/profile', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  }),
  getProfile: (token) => apiRequest('/athletes/profile', { token }),
}

export const assessmentApi = {
  save: (token, payload) => apiRequest('/assessments', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  }),
  history: (token) => apiRequest('/assessments', { token }),
  insights: (token) => apiRequest('/talent-insights', { token }),
  generateInsight: (token, sport) => apiRequest(`/talent-insights/${encodeURIComponent(sport)}`, {
    method: 'POST',
    token,
  }),
}

export const dashboardApi = {
  overview: (token) => apiRequest('/dashboard', { token }),
}

export default apiRequest
