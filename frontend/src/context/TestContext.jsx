/*
  TestContext — single source of truth for the entire test session.
  Loads all questions on mount and exposes answers, marked-for-review
  flags, navigation helpers, and derived counts.
  Every component inside the test flow (TestPage, QuestionPalette, useTimer)
  uses useTest() instead of maintaining local state.
*/
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getQuestions, submitTest } from '../services/api'
import { useTimer } from '../hooks/useTimer'

const TestContext = createContext(null)

// Key used to persist test progress across page refreshes
const STORAGE_KEY = 'pf-test-progress'

export function TestProvider({ children }) {
  const [questions,       setQuestions]       = useState([])
  const [sections,        setSections]        = useState([])
  // answers maps questionId → selected option text (null = not answered)
  const [answers,         setAnswers]         = useState({})
  // markedForReview is a Set of question ids
  const [markedForReview, setMarkedForReview] = useState(new Set())
  const [currentIndex,    setCurrentIndex]    = useState(0)
  const [loading,         setLoading]         = useState(true)
  const [expired,         setExpired]         = useState(false)

  // Auto-submit when timer reaches zero — wrapped in useCallback so the
  // reference is stable and doesn't restart the interval on each render
  const handleAutoExpire = useCallback(() => {
    setExpired(true)
  }, [])

  const {
    remaining:     timerRemaining,
    formatted:     timerFormatted,
    colourClass:   timerColour,
  } = useTimer(30 * 60, handleAutoExpire)

  // ── Load questions on mount, then restore any saved progress ─────────────
  useEffect(() => {
    getQuestions().then(res => {
      const qs = res.data.questions
      setQuestions(qs)
      setSections(res.data.sections)

      // Build a fresh answers map (all null) as the default starting point
      const init = {}
      qs.forEach(q => { init[q.id] = null })

      // Try restoring progress saved from a previous session
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
        const savedKeys  = saved ? Object.keys(saved.answers ?? {}).sort().join(',') : ''
        const freshKeys  = Object.keys(init).sort().join(',')

        if (saved && savedKeys === freshKeys) {
          // Keys match — this is the same question set, restore everything
          setAnswers(saved.answers)
          setMarkedForReview(new Set(saved.marks ?? []))
          setCurrentIndex(saved.currentIndex ?? 0)
          setLoading(false)
          return
        }
      } catch (_) { /* corrupt localStorage — ignore */ }

      setAnswers(init)
      setLoading(false)
    })
  }, [])

  // ── Persist progress to localStorage on every change ──────────────────────
  useEffect(() => {
    // Don't write until questions are loaded (avoids overwriting with empty state)
    if (loading || questions.length === 0) return
    const progress = {
      answers,
      marks:        [...markedForReview],
      currentIndex,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  }, [answers, markedForReview, currentIndex, loading, questions.length])

  // ── Warn before leaving mid-test ──────────────────────────────────────────
  useEffect(() => {
    if (loading) return
    const handler = e => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [loading])

  // ── Derived values ────────────────────────────────────────────────────────
  const currentQuestion = questions[currentIndex] ?? null
  const answeredCount   = Object.values(answers).filter(v => v !== null).length
  const isFirst         = currentIndex === 0
  const isLast          = currentIndex === questions.length - 1

  // ── Actions ───────────────────────────────────────────────────────────────

  // Record the student's chosen option for a question
  function setAnswer(questionId, optionText) {
    setAnswers(prev => ({ ...prev, [questionId]: optionText }))
  }

  // Wipe a previous answer (the button is called "Clear response")
  function clearAnswer(questionId) {
    setAnswers(prev => ({ ...prev, [questionId]: null }))
  }

  // Toggle a question's marked-for-review flag
  function toggleMark(questionId) {
    setMarkedForReview(prev => {
      const next = new Set(prev)
      if (next.has(questionId)) next.delete(questionId)
      else                      next.add(questionId)
      return next
    })
  }

  // Navigate to any question by its flat index (0-based)
  function goToIndex(index) {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index)
    }
  }

  function goToNext() { goToIndex(currentIndex + 1) }
  function goToPrev() { goToIndex(currentIndex - 1) }

  // Jump to the first question of a given section
  // Submit all answers to the API, then wipe saved progress from localStorage
  async function submitAnswers() {
    const result = await submitTest(answers)
    localStorage.removeItem(STORAGE_KEY)
    return result
  }

  function goToSection(sectionId) {
    const idx = questions.findIndex(q => q.section === sectionId)
    if (idx !== -1) setCurrentIndex(idx)
  }

  return (
    <TestContext.Provider value={{
      // State
      questions, sections, answers, markedForReview,
      currentIndex, currentQuestion, loading, expired,
      // Derived
      answeredCount, isFirst, isLast,
      // Timer
      timerRemaining, timerFormatted, timerColour,
      // Actions
      setAnswer, clearAnswer, toggleMark,
      goToIndex, goToNext, goToPrev, goToSection,
      submitAnswers,
    }}>
      {children}
    </TestContext.Provider>
  )
}

/*
  useTest — hook for all components inside the test flow.
  Throws a clear error if used outside <TestProvider>.
*/
export function useTest() {
  const ctx = useContext(TestContext)
  if (!ctx) throw new Error('useTest must be used inside <TestProvider>')
  return ctx
}
