/*
  api.js — the single gateway for ALL data operations connecting to the PathFinder REST API.
  Every function returns a Promise that resolves with { success, data, message }
  matching the backend response envelope.
*/

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5001/v1').replace(/\/$/, '')
const TOKEN_KEY = 'pf-auth-token' // Stored auth token key used across the app

async function request(path, options = {}, explicitToken) {
  const token = explicitToken ?? localStorage.getItem(TOKEN_KEY)
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    })
  } catch {
    throw new Error('Unable to connect to the server. Please ensure the backend is running.')
  }

  let payload
  try {
    payload = await response.json()
  } catch {
    throw new Error('The server returned an invalid response.')
  }

  if (!response.ok || !payload.success) {
    const error = new Error(payload?.message || 'Something went wrong. Please try again.')
    error.status = response.status
    error.data = payload?.data
    throw error
  }

  return payload
}

const post = (path, body, token) => request(path, {
  method: 'POST',
  body: JSON.stringify(body),
}, token)

// ── Authentication ────────────────────────────────────────────────────────────

export function loginUser(email, password) {
  return post('/auth/login', { email, password })
}

export function registerUser(userData) {
  return post('/auth/register', userData)
}

export function forgotPassword(email) {
  return post('/auth/forgot-password', { email })
}

export function getCurrentUser(token) {
  return request('/auth/me', {}, token)
}

export function logoutUser() {
  return post('/auth/logout', {})
}

// ── Dashboard and Profile ─────────────────────────────────────────────────────

export function getDashboardData(_userId) {
  return request('/dashboard')
}

export function getProfile(userId) {
  return request(`/users/${encodeURIComponent(userId)}/profile`)
}

export function updateProfile(userId, updates) {
  return request(`/users/${encodeURIComponent(userId)}/profile`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
}

// ── Aptitude Test ─────────────────────────────────────────────────────────────

export function getTestStatus() {
  return request('/test/status')
}

export function getQuestions() {
  return request('/test/questions')
}

export function submitTest(answers) {
  return post('/test/submit', { answers })
}

export function getResults() {
  return request('/test/results')
}

// ── Career Explorer & Recommendations ─────────────────────────────────────────

export function getCareers({ stream } = {}) {
  const query = stream ? `?stream=${encodeURIComponent(stream)}` : ''
  return request(`/careers${query}`)
}

export function getCareerById(id) {
  return request(`/careers/${encodeURIComponent(id)}`)
}

export function getRecommendations() {
  return request('/careers/recommendations')
}

// ── AI Counsellor Chat ────────────────────────────────────────────────────────

export function sendChatMessage(message) {
  return post('/chat', { message })
}
