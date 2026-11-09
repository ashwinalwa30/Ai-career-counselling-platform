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
import CAREERS               from '../data/careers.js'
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

// ── Careers ───────────────────────────────────────────────────────────────────

/*
  getCareers — returns all careers, optionally filtered by stream.
  Accepts an optional { stream } query param matching the careers page filters.
*/
export async function getCareers({ stream } = {}) {
  await wait(400)

  const careers = stream
    ? CAREERS.filter(c => c.stream === stream)
    : CAREERS

  return {
    success: true,
    data:    { careers },
    message: 'Careers loaded',
  }
}

/*
  getCareerById — returns a single career object by its id slug.
  Throws if the id is not found so the detail page can show a 404-style state.
*/
export async function getCareerById(id) {
  await wait(300)

  const career = CAREERS.find(c => c.id === id)
  if (!career) throw new Error(`Career "${id}" not found.`)

  return {
    success: true,
    data:    { career },
    message: 'Career loaded',
  }
}

/*
  getRecommendations — calculates a match % for every career based on the
  student's RIASEC scores and aptitude section scores, then sorts by match.

  Match formula (50 / 50 split):
    riasecMatch   = sum of career's 2 RIASEC type scores / 12 total points × 100
    aptitudeMatch = average of career's 2 required section scores (already 0–100)
    overall       = round(0.5 × riasecMatch + 0.5 × aptitudeMatch)

  If no results exist (test not taken), careers are returned without a matchPct
  and hasResults is false — the UI uses this to show a "take the test" banner.
*/
export async function getRecommendations() {
  await wait(500)

  if (!lastTestResult) {
    // No test taken — return all careers in default order, no match %
    return {
      success: true,
      data: {
        careers:    CAREERS.map(c => ({ ...c, matchPct: null })),
        hasResults: false,
      },
      message: 'No test results — showing all careers',
    }
  }

  const { riasecScores, sectionScores } = lastTestResult

  const withMatch = CAREERS.map(career => {
    // RIASEC match: sum of this career's type scores normalised to 12 total points
    const riasecPoints = career.riasecTypes
      .reduce((sum, t) => sum + (riasecScores[t] ?? 0), 0)
    const riasecMatch  = Math.min(100, Math.round((riasecPoints / 12) * 100))

    // Aptitude match: average of the required section scores
    const aptitudeMatch = career.requiredAptitudes.length > 0
      ? Math.round(
          career.requiredAptitudes.reduce((sum, a) => sum + (sectionScores[a] ?? 0), 0)
          / career.requiredAptitudes.length
        )
      : 50

    const matchPct = Math.round(0.5 * riasecMatch + 0.5 * aptitudeMatch)

    return { ...career, matchPct }
  })

  // Sort descending by match %
  withMatch.sort((a, b) => b.matchPct - a.matchPct)

  return {
    success: true,
    data: {
      careers:    withMatch,
      hasResults: true,
    },
    message: 'Recommendations calculated',
  }
}

// ── AI Counsellor chat ────────────────────────────────────────────────────────

/*
  sendChatMessage — returns a helpful counsellor reply for the student's message.

  !! AI INTEGRATION POINT !!
  Replace this entire function body with a real API call when the AI model is ready:

    POST /api/chat
    Body: { message, context: { testResult, topCareers } }
    Response: { success, data: { reply: string }, message }

  The AI team should receive `lastTestResult` and top-3 career titles as context
  so the model can personalise its answers. The component interface (message in,
  reply string out) stays the same — only this function body changes.
*/
export async function sendChatMessage(message) {
  // Simulate a realistic AI "thinking" delay
  await wait(1200 + Math.random() * 800)

  const q = message.toLowerCase().trim()

  // Build personalised context from test results when available
  const hasResults  = !!lastTestResult
  const score       = lastTestResult?.overallScore
  const topCareers  = hasResults
    ? CAREERS
        .map(c => {
          const rp = (c.riasecTypes || [])
            .reduce((s, t) => s + (lastTestResult.riasecScores?.[t] ?? 0), 0)
          return { ...c, matchPct: Math.round(0.5 * Math.min(100, Math.round((rp / 12) * 100)) + 0.5 * 50) }
        })
        .sort((a, b) => b.matchPct - a.matchPct)
        .slice(0, 3)
        .map(c => c.title)
    : []

  // ── Keyword-matched responses ─────────────────────────────────────────────

  if (q.includes('stream') || q.includes('pcm') || q.includes('pcb') || q.includes('arts') || q.includes('commerce')) {
    if (hasResults && topCareers.length) {
      return {
        success: true,
        data: { reply: `Based on your aptitude test (overall score: ${score}%), your profile aligns well with careers like **${topCareers.join(', ')}**. These usually require PCM or Commerce streams depending on the specific path. Would you like to explore one of these in detail?` },
        message: 'Reply generated',
      }
    }
    return {
      success: true,
      data: { reply: `Choosing a stream depends on your aptitude and interests. PCM opens doors to engineering, medicine, and technology. Commerce leads to finance, management, and law. Arts/Humanities suits those strong in social sciences, literature, and media. I'd recommend taking the aptitude test first — it'll give you a personalised match score for each field. Want me to explain what the test covers?` },
      message: 'Reply generated',
    }
  }

  if (q.includes('class 10') || q.includes('after 10') || q.includes('10th')) {
    return {
      success: true,
      data: { reply: `After Class 10, you have three main options:\n\n1. **Science (PCM)** — for engineering, technology, or pure sciences.\n2. **Science (PCB)** — for medicine, pharmacy, or biotech.\n3. **Commerce** — for CA, economics, finance, or management.\n4. **Arts/Humanities** — for law, journalism, design, civil services, or social work.\n\nChoose based on what subjects excite you most and the careers you're drawn to. It's not irreversible — many paths switch later. What are your strongest subjects right now?` },
      message: 'Reply generated',
    }
  }

  if (q.includes('jee') || q.includes('neet') || q.includes('entrance') || q.includes('exam')) {
    return {
      success: true,
      data: { reply: `Here's a quick overview of key entrance exams:\n\n**Engineering:** JEE Main (NIT/IIIT), JEE Advanced (IIT), BITSAT (BITS Pilani)\n**Medicine:** NEET-UG (all medical colleges)\n**Law:** CLAT (National Law Universities)\n**Management:** CAT/MAT (MBA, post-graduation)\n**Civil Services:** UPSC CSE (IAS/IPS/IFS)\n\nFor JEE/NEET, start preparation in Class 11 itself — consistent practice and NCERT mastery are the foundation. Which exam are you targeting?` },
      message: 'Reply generated',
    }
  }

  if (q.includes('data science') || q.includes('ai') || q.includes('artificial intelligence') || q.includes('machine learning')) {
    return {
      success: true,
      data: { reply: `Data Science and AI are among the fastest-growing fields in India. Here's the roadmap:\n\n1. **Build the base:** Strong Mathematics (Class 11–12) — especially Statistics, Linear Algebra, and Calculus.\n2. **Degree:** B.Tech CSE, B.Sc Statistics/Maths, or B.Sc Data Science.\n3. **Skills to learn:** Python, SQL, Machine Learning libraries (NumPy, Pandas, scikit-learn).\n4. **Top colleges:** IITs, IISc, BITS, NITs, CMI Chennai.\n\nData Scientists earn ₹8–30L at entry level. The demand is huge, especially in fintech, healthcare, and e-commerce. Want to see the full roadmap?` },
      message: 'Reply generated',
    }
  }

  if (q.includes('doctor') || q.includes('medicine') || q.includes('mbbs') || q.includes('medical')) {
    return {
      success: true,
      data: { reply: `Becoming a doctor in India requires dedication and long-term planning:\n\n1. **Class 11–12:** Science with PCB — focus heavily on Biology and Chemistry.\n2. **NEET-UG:** The single entrance exam for all government and private medical colleges. Target 600+ out of 720.\n3. **MBBS:** 5.5 years (4.5 years + 1 year internship).\n4. **Post-graduation:** MD/MS is highly recommended for specialisation.\n\nTop colleges: AIIMS Delhi, CMC Vellore, Kasturba Medical College. The path is long but deeply rewarding. Are you interested in a specialisation like surgery, psychiatry, or paediatrics?` },
      message: 'Reply generated',
    }
  }

  if (q.includes('engineer') || q.includes('engineering') || q.includes('b.tech') || q.includes('btech')) {
    return {
      success: true,
      data: { reply: `Engineering remains one of India's most popular career paths. Key branches:\n\n- **CS/IT:** Software, AI, cybersecurity — highest demand.\n- **Mechanical:** Manufacturing, aerospace, automotive.\n- **Civil:** Infrastructure, urban planning, construction.\n- **Electronics:** Telecom, embedded systems, VLSI.\n\nFor top colleges (IIT/NIT), prepare seriously for JEE from Class 11. For state universities, check state CETs. Entry salaries range from ₹3.5L (tier-3) to ₹20L+ (IIT campus placements). Which branch interests you?` },
      message: 'Reply generated',
    }
  }

  if (q.includes('ias') || q.includes('upsc') || q.includes('civil service') || q.includes('civil services')) {
    return {
      success: true,
      data: { reply: `Civil Services is a highly prestigious and challenging path:\n\n1. **Any degree** qualifies — there's no specific stream requirement. Many toppers come from engineering, arts, and science backgrounds.\n2. **UPSC CSE:** 3 stages — Prelims, Mains, Interview. Minimum age: 21; Maximum: 32 (General).\n3. **Preparation:** Typically 1–3 years of dedicated study. Start with NCERT books (Class 6–12) for the base.\n4. **Top resources:** Vajiram & Ravi, Insight IAS, ForumIAS (online).\n\nIf you're in Class 11–12, focus on building strong reading habits and current affairs awareness now. Would you like preparation tips specific to your current class?` },
      message: 'Reply generated',
    }
  }

  if (q.includes('salary') || q.includes('earn') || q.includes('money') || q.includes('pay') || q.includes('income')) {
    if (hasResults && topCareers.length) {
      return {
        success: true,
        data: { reply: `Based on your profile, your top matches — **${topCareers.join(', ')}** — have strong earning potential. In India, salaries grow significantly with experience: most careers see a 3–5× jump from entry to senior level.\n\nFor example, a Software Engineer starts at ₹5–10L and can reach ₹30–80L+ in senior/principal roles. Would you like detailed salary info for any specific career?` },
        message: 'Reply generated',
      }
    }
    return {
      success: true,
      data: { reply: `Salary varies hugely by career, college, city, and skills. As a rough guide for India:\n\n- **Tech/Engineering:** ₹5–15L entry, ₹20–80L+ senior\n- **Medicine:** ₹6–10L post-internship, ₹20–60L+ specialist\n- **Finance/CA:** ₹7–12L entry, ₹25–60L+ senior\n- **Civil Services:** Pay as per 7th CPC + allowances (₹56K–₹2.5L/month)\n- **Design/Media:** ₹3–6L entry, varies widely\n\nSalary is important, but job satisfaction and growth matter just as much. Which career's salary are you curious about?` },
      message: 'Reply generated',
    }
  }

  // Generic personalised fallback when results are available
  if (hasResults && topCareers.length) {
    return {
      success: true,
      data: { reply: `That's a great question! Based on your aptitude score of **${score}%**, your profile matches well with **${topCareers.join(', ')}**. If your question is about one of these careers — or any other field — feel free to ask and I'll give you a detailed answer. I can also help with entrance exams, college choices, subject selection, or what to do after Class 10/12.` },
      message: 'Reply generated',
    }
  }

  // Generic fallback with no results
  return {
    success: true,
    data: { reply: `That's a thoughtful question! To give you a more personalised answer, I'd recommend taking the aptitude test first — it takes about 30 minutes and helps me understand your strengths and interests.\n\nIn the meantime, I can help you with:\n- Choosing between streams (Science/Commerce/Arts)\n- Understanding entrance exams (JEE, NEET, CLAT, UPSC)\n- Exploring specific careers\n- College and course selection\n\nWhat would you like to know more about?` },
    message: 'Reply generated',
  }
}
