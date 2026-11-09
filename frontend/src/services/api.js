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
      testStatus:        testState,
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
  submitTest — scores the student's answers and stores the result.

  'answers' is an object mapping questionId → selected option text:
    { lr_01: '38', ip_01: 'Art, Music or Drama', ... }

  Cognitive scoring: count correct answers per section, convert to percentage.
  RIASEC scoring: for each interest question, find the matching option's
  riasecType and increment that type's tally.
*/
export async function submitTest(answers) {
  await wait()

  const COGNITIVE_SECTION_IDS = [
    'logical_reasoning', 'numerical_ability', 'verbal_ability', 'spatial_reasoning',
  ]

  // Score cognitive sections
  const cognitiveScores = {}
  COGNITIVE_SECTION_IDS.forEach(sectionId => {
    const qs      = QUESTIONS.filter(q => q.section === sectionId)
    const correct = qs.filter(q => answers[q.id] === q.correctAnswer).length
    cognitiveScores[sectionId] = {
      correct,
      total:      qs.length,
      percentage: Math.round((correct / qs.length) * 100),
    }
  })

  // Tally RIASEC types from interest profile answers
  const riasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }
  QUESTIONS
    .filter(q => q.section === 'interest_profile')
    .forEach(q => {
      const selectedText = answers[q.id]
      if (selectedText != null) {
        const opt = q.options.find(o => o.text === selectedText)
        if (opt) riasecScores[opt.riasecType]++
      }
    })

  // Mark test as done
  testState = {
    ...testState,
    status:            'completed',
    questionsAnswered: QUESTIONS.length,
    completedAt:       new Date().toISOString(),
  }

  const result = {
    cognitiveScores,
    riasecScores,
    totalAnswered: Object.keys(answers).length,
    completedAt:   testState.completedAt,
  }
  lastTestResult = result

  return {
    success: true,
    data:    { result },
    message: 'Test submitted successfully',
  }
}

/*
  getTestResults — returns the most recently scored test result.
  Called by the Results page after the student submits.
*/
export async function getTestResults() {
  await wait(300)

  if (!lastTestResult) {
    throw new Error('No results found. Please complete the aptitude test first.')
  }

  return {
    success: true,
    data:    { result: lastTestResult },
    message: 'Results loaded',
  }
}
