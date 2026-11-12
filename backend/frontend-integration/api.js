/*
 * Replace frontend/src/services/api.js with this file to use the real backend.
 * The exported function names and response shapes match the existing React app.
 */

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/v1').replace(/\/$/, '')
const TOKEN_KEY = 'pf-auth-token' // Same key already used by AuthContext.jsx

async function request(path, options = {}, explicitToken) {
  const token = explicitToken ?? localStorage.getItem(TOKEN_KEY)
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  let payload
  try {
    payload = await response.json()
  } catch {
    throw new Error('The server returned an invalid response.')
  }

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Something went wrong. Please try again.')
  }

  return payload
}

const post = (path, body, token) => request(path, {
  method: 'POST',
  body: JSON.stringify(body),
}, token)

// Authentication
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

// Dashboard and profile
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

// Aptitude test
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

// Career explorer
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

// AI counsellor
export function sendChatMessage(message) {
  return post('/chat', { message })
}
