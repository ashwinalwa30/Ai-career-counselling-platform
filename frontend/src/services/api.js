/*
  api.js — the single gateway for ALL data operations.
  Every function returns a Promise that resolves with { success, data, message }
  shaped exactly like a real REST API response would be.
  Components import from here; they never touch src/data/ directly.
  When the backend is ready, only this file needs to change — components stay the same.
*/

import MOCK_USERS from '../data/users.js'

// ── In-memory "database" ────────────────────────────────────────────────────
// Starts with the seed data. registerUser pushes new entries here at runtime.
// This resets on page refresh (intentional for a mock).
const db = [...MOCK_USERS]

// Maps token → userId so getCurrentUser can look up the session
const tokenStore = {
  mock_token_usr_001: 'usr_001',
}

// ── Helpers ─────────────────────────────────────────────────────────────────

// Simulates real network latency so loading states are testable
function wait(ms = 600) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Never send the password field to the client
function publicUser(user) {
  const { password, ...safe } = user
  return safe
}

// ── Auth functions ───────────────────────────────────────────────────────────

/*
  loginUser — checks credentials against the mock DB.
  Rejects with a human-readable error when email or password is wrong
  so the Login page can display it inline without a try/catch on each field.
*/
export async function loginUser(email, password) {
  await wait()

  const user = db.find(u => u.email.toLowerCase() === email.trim().toLowerCase())

  if (!user || user.password !== password) {
    // Same message for both cases — don't reveal whether the email exists
    throw new Error('Incorrect email or password. Please check and try again.')
  }

  const token = `mock_token_${user.id}`
  tokenStore[token] = user.id

  return {
    success: true,
    data:    { user: publicUser(user), token },
    message: 'Logged in successfully',
  }
}

/*
  registerUser — creates a new account after checking for duplicate emails.
  userData should include: fullName, email, password, phone,
  class, board, schoolName, state, preferredLanguage, interests.
*/
export async function registerUser(userData) {
  await wait()

  const duplicate = db.find(
    u => u.email.toLowerCase() === userData.email.trim().toLowerCase()
  )
  if (duplicate) {
    throw new Error('An account with this email already exists. Try logging in.')
  }

  const newUser = {
    id:        `usr_${Date.now()}`,
    createdAt: new Date().toISOString(),
    interests: [],
    ...userData,
  }

  db.push(newUser)

  const token = `mock_token_${newUser.id}`
  tokenStore[token] = newUser.id

  return {
    success: true,
    data:    { user: publicUser(newUser), token },
    message: 'Account created successfully',
  }
}

/*
  forgotPassword — always resolves successfully so we don't reveal
  whether an email is registered (security best practice).
*/
export async function forgotPassword(email) {   // eslint-disable-line no-unused-vars
  await wait()

  return {
    success: true,
    data:    null,
    message: 'If that email is registered, a reset link has been sent.',
  }
}

/*
  getCurrentUser — validates a stored token and returns the matching user.
  Called on app load to restore a session from localStorage.
*/
export async function getCurrentUser(token) {
  await wait(300)

  const userId = tokenStore[token]
  if (!userId) throw new Error('Session expired. Please log in again.')

  const user = db.find(u => u.id === userId)
  if (!user)   throw new Error('Account not found.')

  return {
    success: true,
    data:    { user: publicUser(user) },
    message: 'Session restored',
  }
}

/*
  logoutUser — no server state to clear in this mock, just simulates the call.
*/
export async function logoutUser() {
  await wait(300)

  return {
    success: true,
    data:    null,
    message: 'Logged out successfully',
  }
}
