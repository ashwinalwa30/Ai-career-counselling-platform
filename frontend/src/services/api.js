/*
  api.js — the single gateway for ALL data operations.
  Every function returns a Promise that resolves with { success, data, message }
  shaped exactly like a real REST API response would be.
  Components import from here; they never touch src/data/ directly.
  When the backend is ready, only this file needs to change — components stay the same.
*/

import MOCK_USERS from '../data/users.js'
import {
  PROFILE_COMPLETION,
  TEST_STATUS,
  TOP_CAREER_MATCHES,
  NEXT_STEPS,
  CAREER_FACTS,
} from '../data/dashboard.js'
import QUESTIONS, { SECTIONS } from '../data/questions.js'
import {
  calculateSectionScores,
  calculateOverallScore,
  calculateRiasecScores,
  getTopRiasecTypes,
  getStrengthsAndWeaknesses,
} from '../utils/scoring.js'

// ── In-memory "database" ────────────────────────────────────────────────────
// Starts with the seed data. registerUser pushes new entries here at runtime.
// This resets on page refresh (intentional for a mock).
const db = [...MOCK_USERS]

/*
  testState — mutable copy of TEST_STATUS so submitTest can flip it to
  'completed' and getDashboardData will reflect that immediately.
*/
let testState      = { ...TEST_STATUS }
let lastTestResult = null   // stores the most recent scored result

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

// ── Test status ───────────────────────────────────────────────────────────────

/*
  getTestStatus — lightweight call used by the instructions page.
  Returns the current test state and section metadata without loading all questions.
*/
export async function getTestStatus() {
  await wait(200)

  return {
    success: true,
    data:    { testStatus: testState, sections: SECTIONS },
    message: 'Test status loaded',
  }
}

// ── Dashboard ────────────────────────────────────────────────────────────────

/*
  getDashboardData — returns everything the Dashboard page needs in one call.
  Picks today's career fact using the day-of-year so it changes daily.
  userId is accepted for future real-API use; the mock ignores it.
*/
export async function getDashboardData(userId) {   // eslint-disable-line no-unused-vars
  await wait()

  // Pick a fact based on today's date so it rotates naturally each day
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86_400_000
  )
  const todaysFact = CAREER_FACTS[dayOfYear % CAREER_FACTS.length]

  return {
    success: true,
    data: {
      profileCompletion: PROFILE_COMPLETION,
      // Include overallScore so the dashboard card can show it when completed
      testStatus: {
        ...testState,
        overallScore: lastTestResult?.overallScore ?? null,
      },
      careerMatches:     TOP_CAREER_MATCHES,
      nextSteps:         NEXT_STEPS,
      dailyFact:         todaysFact,
    },
    message: 'Dashboard data loaded',
  }
}

// ── Profile ───────────────────────────────────────────────────────────────────

/*
  getProfile — returns the full user profile including subjectMarks and dob.
  getCurrentUser only returns the minimal auth payload; this endpoint returns
  everything needed for the Profile page.
*/
export async function getProfile(userId) {
  await wait()

  const user = db.find(u => u.id === userId)
  if (!user) throw new Error('User not found.')

  return {
    success: true,
    data:    { profile: publicUser(user) },
    message: 'Profile loaded',
  }
}

/*
  updateProfile — merges the provided fields into the in-memory user record.
  Returns the updated user so the caller can refresh AuthContext.
  In production this would be a PATCH /users/:id request.
*/
export async function updateProfile(userId, updates) {
  await wait()

  const idx = db.findIndex(u => u.id === userId)
  if (idx === -1) throw new Error('User not found.')

  db[idx] = { ...db[idx], ...updates }

  return {
    success: true,
    data:    { user: publicUser(db[idx]) },
    message: 'Profile updated successfully',
  }
}

// ── Aptitude test ─────────────────────────────────────────────────────────────

/*
  getQuestions — returns all questions and section metadata.
  The test page uses this to build tabs, question cards and the palette.
*/
export async function getQuestions() {
  await wait(400)

  return {
    success: true,
    data:    { questions: QUESTIONS, sections: SECTIONS },
    message: 'Questions loaded',
  }
}

/*
  submitTest — scores all answers using the pure functions in scoring.js,
  stores the result in memory, and marks the test as completed.

  'answers' maps questionId → selected option text:
    { lr_01: '38', ip_01: 'Art, Music or Drama', ... }

  The result shape mirrors what the real backend/AI endpoint will return,
  so the Results page never needs to change when the backend is wired up.
*/
export async function submitTest(answers) {
  await wait()

  const sectionScores = calculateSectionScores(answers, QUESTIONS)
  const overallScore  = calculateOverallScore(sectionScores)
  const riasecScores  = calculateRiasecScores(answers, QUESTIONS)
  const topTypes      = getTopRiasecTypes(riasecScores)
  const { strengths, weaknesses } = getStrengthsAndWeaknesses(sectionScores)

  testState = {
    ...testState,
    status:            'completed',
    questionsAnswered: QUESTIONS.length,
    completedAt:       new Date().toISOString(),
  }

  lastTestResult = {
    overallScore,
    sectionScores,
    riasecScores,
    topTypes,
    strengths,
    weaknesses,
    completedAt: testState.completedAt,
  }

  return {
    success: true,
    data:    { result: lastTestResult },
    message: 'Test submitted successfully',
  }
}

/*
  getResults — returns the most recently scored test result, shaped exactly
  like the real backend response will be.
  Returns null in the data payload if no test has been taken yet — the
  Results page uses this to show the empty state.
*/
export async function getResults() {
  await wait(300)

  return {
    success: true,
    data:    { result: lastTestResult },   // null if test not yet taken
    message: lastTestResult ? 'Results loaded' : 'No test taken yet',
  }
}
