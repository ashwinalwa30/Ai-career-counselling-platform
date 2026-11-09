/*
  TestPage — the full-screen, distraction-free test environment.
  It has its own minimal header (no sidebar or bottom nav from DashboardLayout).
  The page is split into: MinimalHeader, SectionTabs, QuestionCard, NavigationBar.
  Timer (Step 5), QuestionPalette (Step 4) and submission (Step 6) are added
  in later steps.
*/
import { useNavigate }         from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Compass, ChevronLeft, ChevronRight, CheckCircle, Flag,
  AlertTriangle, Loader2,
} from 'lucide-react'

import { TestProvider, useTest }                from '../context/TestContext'
import { PalettePanel, MobilePaletteDrawer }   from '../components/test/QuestionPalette'
import usePageTitle                             from '../hooks/usePageTitle'

// ── Helpers ───────────────────────────────────────────────────────────────────

/*
  getOptionText — options in cognitive sections are plain strings; in the
  interest profile they are { text, riasecType } objects. This helper
  normalises both to a plain string.
*/
function getOptionText(opt) {
  return typeof opt === 'string' ? opt : opt.text
}

// ── Minimal header ────────────────────────────────────────────────────────────
/*
  MinimalHeader — fixed top bar visible throughout the test.
  Shows the PathFinder logo, a linear progress bar, answered count, and a
  timer placeholder (the real countdown is wired in Step 5).
*/
function MinimalHeader() {
  const { questions, answeredCount, timerFormatted, timerColour, timerRemaining } = useTest()
  const pct = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0

  return (
    <header className="bg-surface border-b border-edge px-4 sm:px-6 py-3 flex-shrink-0">
      <div className="max-w-5xl mx-auto flex items-center gap-4">

        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Compass size={18} className="text-teal" strokeWidth={2.5} />
          <span className="font-sans font-extrabold text-sm tracking-tight text-ink hidden sm:inline">
            PathFinder
          </span>
        </div>

        {/* Progress bar + answered count */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-[10px] font-sans text-muted mb-1">
            <span>{answeredCount} of {questions.length} answered</span>
            <span>{Math.round(pct)}%</span>
          </div>
          <div className="h-1.5 bg-edge rounded-full overflow-hidden">
            <div
              className="h-full bg-teal rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Live countdown timer — colour shifts to marigold at ≤5 min, terracotta + pulse at ≤1 min */}
        <div
          className={`flex-shrink-0 font-mono text-sm font-semibold w-14 text-right ${timerColour}${timerRemaining <= 60 ? ' animate-pulse' : ''}`}
        >
          {timerFormatted}
        </div>
      </div>
    </header>
  )
}

// ── Section tabs ──────────────────────────────────────────────────────────────
/*
  SectionTabs — horizontal scrollable row of tabs.
  Clicking a tab jumps to the first question in that section.
  The active tab is the one that contains the current question.
*/
function SectionTabs() {
  const { sections, currentQuestion, answers, questions, goToSection } = useTest()

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Test sections">
      {sections.map(section => {
        const isActive = currentQuestion?.section === section.id

        // Count answered questions in this section for the small badge
        const sectionQs      = questions.filter(q => q.section === section.id)
        const sectionAnswered = sectionQs.filter(q => answers[q.id] !== null).length

        return (
          <button
            key={section.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => goToSection(section.id)}
            className={`
              flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg
              text-xs font-sans font-semibold transition-colors duration-150 cursor-pointer
              whitespace-nowrap
              ${isActive
                ? 'bg-teal text-white'
                : 'bg-surface border border-edge text-muted hover:text-ink hover:border-teal/40'}
            `}
          >
            {section.label}
            {/* Answered / total badge */}
            <span className={`
              text-[9px] px-1.5 py-0.5 rounded-full font-bold
              ${isActive ? 'bg-white/20 text-white' : 'bg-edge text-muted'}
            `}>
              {sectionAnswered}/{section.questionCount}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ── Question card ─────────────────────────────────────────────────────────────
/*
  QuestionCard — the main interaction area.
  Displays the question text and 4 large option cards.
  Clicking an option records the answer in TestContext.
  The selected option shows a teal border, background tint and check icon.
*/
function QuestionCard() {
  const {
    currentQuestion, currentIndex, questions, sections,
    answers, markedForReview, setAnswer,
  } = useTest()

  if (!currentQuestion) return null

  const selectedAnswer = answers[currentQuestion.id]
  const isMarked       = markedForReview.has(currentQuestion.id)
  const isInterest     = currentQuestion.section === 'interest_profile'
  const LETTERS        = ['A', 'B', 'C', 'D']

  // Find this section's label for the question header
  const sectionLabel   = sections.find(s => s.id === currentQuestion.section)?.label ?? ''

  // Compute position within the current section (e.g. "3 of 6")
  const sectionQs      = questions.filter(q => q.section === currentQuestion.section)
  const posInSection   = sectionQs.findIndex(q => q.id === currentQuestion.id) + 1

  return (
    <motion.div
      key={currentQuestion.id}        // re-mount animation on every question change
      className="bg-surface border border-edge rounded-xl p-5 sm:p-6"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* Question meta row */}
      <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
        <div className="flex items-center gap-2 text-xs font-sans text-muted">
          <span className="font-semibold text-ink">{sectionLabel}</span>
          <span>·</span>
          <span>Q{posInSection} of {sectionQs.length}</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">
            Overall {currentIndex + 1} / {questions.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isMarked && (
            <span className="inline-flex items-center gap-1 text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-marigold/15 text-marigold">
              <Flag size={9} />
              Marked
            </span>
          )}
          {isInterest ? (
            <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success">
              No right answer
            </span>
          ) : (
            <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-edge text-muted capitalize">
              {currentQuestion.difficulty}
            </span>
          )}
        </div>
      </div>

      {/* Question text */}
      <p className="font-sans font-medium text-ink text-base leading-relaxed mb-5">
        {currentQuestion.question}
      </p>

      {/* Option cards */}
      <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="Answer options">
        {currentQuestion.options.map((opt, i) => {
          const optText    = getOptionText(opt)
          const isSelected = selectedAnswer === optText

          return (
            <button
              key={i}
              role="radio"
              aria-checked={isSelected}
              onClick={() => setAnswer(currentQuestion.id, optText)}
              className={`
                flex items-center gap-3 w-full text-left
                px-4 py-3.5 rounded-lg border
                transition-all duration-150 cursor-pointer
                ${isSelected
                  ? 'bg-teal/8 border-teal ring-1 ring-teal/30'
                  : 'bg-paper border-edge hover:border-teal/40 hover:bg-teal/4'}
              `}
            >
              {/* Letter badge */}
              <span className={`
                flex-shrink-0 w-7 h-7 rounded-full text-xs font-sans font-bold
                flex items-center justify-center transition-colors
                ${isSelected ? 'bg-teal text-white' : 'bg-edge text-muted'}
              `}>
                {LETTERS[i]}
              </span>

              {/* Option text */}
              <span className={`
                flex-1 font-sans text-sm font-medium transition-colors
                ${isSelected ? 'text-ink' : 'text-muted'}
              `}>
                {optText}
              </span>

              {/* Selected check icon */}
              {isSelected && (
                <CheckCircle size={15} className="text-teal flex-shrink-0" />
              )}
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}

// ── Navigation bar ────────────────────────────────────────────────────────────
/*
  NavigationBar — Previous / Next buttons with Clear response and
  Mark for review in between. Submit replaces Next on the last question.
  The submit handler is a placeholder — real logic added in Step 6.
*/
/*
  NavigationBar — Prev / Next / Submit controls.
  Receives onSubmitClick so TestPageContent can open the confirmation modal.
*/
function NavigationBar({ onSubmitClick }) {
  const {
    currentQuestion, answers, markedForReview,
    isFirst, isLast, toggleMark, clearAnswer, goToNext, goToPrev,
  } = useTest()

  if (!currentQuestion) return null

  const isMarked  = markedForReview.has(currentQuestion.id)
  const hasAnswer = answers[currentQuestion.id] !== null

  return (
    <div className="flex items-center gap-2 flex-wrap">

      {/* Previous */}
      <button
        onClick={goToPrev}
        disabled={isFirst}
        className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-edge text-sm font-sans font-semibold text-muted hover:text-ink hover:border-ink transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={15} />
        Previous
      </button>

      <div className="flex-1" />

      {/* Clear response */}
      <button
        onClick={() => clearAnswer(currentQuestion.id)}
        disabled={!hasAnswer}
        className="px-3 py-2.5 rounded-lg border border-edge text-xs font-sans font-semibold text-muted hover:text-error hover:border-error/40 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Clear
      </button>

      {/* Mark for review */}
      <button
        onClick={() => toggleMark(currentQuestion.id)}
        className={`
          flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-xs font-sans font-semibold
          transition-colors cursor-pointer
          ${isMarked
            ? 'bg-marigold/10 border-marigold/30 text-marigold hover:bg-marigold/20'
            : 'border-edge text-muted hover:border-marigold/40 hover:text-marigold'}
        `}
      >
        <Flag size={12} />
        {isMarked ? 'Unmark' : 'Mark for review'}
      </button>

      {/* Next / Submit */}
      {isLast ? (
        <button
          id="test-submit-btn"
          onClick={onSubmitClick}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-teal text-white text-sm font-sans font-semibold hover:bg-teal-dark transition-colors cursor-pointer"
        >
          Submit test
          <ChevronRight size={15} />
        </button>
      ) : (
        <button
          onClick={goToNext}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-teal text-white text-sm font-sans font-semibold hover:bg-teal-dark transition-colors cursor-pointer"
        >
          Next
          <ChevronRight size={15} />
        </button>
      )}
    </div>
  )
}

// ── Submit confirmation modal ─────────────────────────────────────────────────
/*
  SubmitModal — dimmed overlay + centred card asking the student to confirm.
  Shows answered / total count and a warning if any questions are unanswered
  or still marked for review. Disabled while submission is in flight.
*/
function SubmitModal({ open, onCancel, onConfirm, submitting }) {
  const { questions, answeredCount, markedForReview } = useTest()
  const unanswered = questions.length - answeredCount
  const markedCount = markedForReview.size

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-ink/60 z-50"
            onClick={!submitting ? onCancel : undefined}
          />

          {/* Card */}
          <motion.div
            key="modal-card"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{    opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
          >
            <div className="bg-surface border border-edge rounded-xl shadow-xl w-full max-w-sm p-6 pointer-events-auto">

              <h2 className="font-sans font-bold text-base text-ink mb-1">
                Submit your test?
              </h2>
              <p className="font-sans text-sm text-muted mb-5">
                Once submitted you cannot change your answers.
              </p>

              {/* Answer summary */}
              <div className="bg-paper border border-edge rounded-lg px-4 py-3 mb-4 space-y-2">
                <div className="flex items-center justify-between text-sm font-sans">
                  <span className="text-muted">Answered</span>
                  <span className="font-semibold text-ink">{answeredCount} / {questions.length}</span>
                </div>
                {markedCount > 0 && (
                  <div className="flex items-center justify-between text-sm font-sans">
                    <span className="text-muted">Marked for review</span>
                    <span className="font-semibold text-marigold">{markedCount}</span>
                  </div>
                )}
              </div>

              {/* Warning if anything unanswered */}
              {unanswered > 0 && (
                <div className="flex items-start gap-2 bg-marigold/10 border border-marigold/25 rounded-lg px-3 py-2.5 mb-5">
                  <AlertTriangle size={14} className="text-marigold flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-sans text-marigold">
                    {unanswered} question{unanswered > 1 ? 's' : ''} left unanswered. Skipped questions will be marked as incorrect.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={onCancel}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-edge text-sm font-sans font-semibold text-muted hover:text-ink hover:border-ink transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Go back
                </button>
                <button
                  onClick={onConfirm}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-teal text-white text-sm font-sans font-semibold hover:bg-teal-dark transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Submitting…
                    </>
                  ) : 'Submit test'}
                </button>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── Loading screen ────────────────────────────────────────────────────────────
/*
  TestLoadingScreen — shown while getQuestions() resolves.
  Uses a spinner instead of skeletons since the layout isn't known yet.
*/
function TestLoadingScreen() {
  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-edge border-t-teal animate-spin" />
      <p className="text-sm text-muted font-sans">Loading your test…</p>
    </div>
  )
}

// ── Inner page (uses TestContext) ─────────────────────────────────────────────
/*
  TestPageContent — the actual layout, rendered only after questions load.
  Separated from TestPage so it can call useTest() safely inside TestProvider.
*/
/*
  TestPageContent — the actual layout. Manages the submit modal and handles
  both manual submission (via the modal) and auto-submission when time expires.
*/
function TestPageContent() {
  usePageTitle('Aptitude Test — In Progress')
  const { loading, expired, submitAnswers } = useTest()
  const navigate    = useNavigate()
  const [modalOpen,  setModalOpen]  = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Shared submit logic used by both manual confirm and auto-expiry
  async function handleSubmitConfirmed() {
    if (submitting) return          // guard against double calls
    setSubmitting(true)
    setModalOpen(false)
    await submitAnswers()
    navigate('/dashboard/results')
  }

  // Auto-submit as soon as the timer fires its expiry callback
  useEffect(() => {
    if (expired) handleSubmitConfirmed()
  }, [expired])  // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <TestLoadingScreen />

  return (
    <div className="min-h-screen bg-paper flex flex-col">

      <MinimalHeader />

      {/* Two-column on lg+: left = test interface, right = palette panel */}
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-start gap-5">

          {/* Left: section tabs, question card, navigation */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">
            <SectionTabs />
            <QuestionCard />
            <NavigationBar onSubmitClick={() => setModalOpen(true)} />
          </div>

          {/* Right: palette panel — desktop only, sticky so it stays in view while scrolling */}
          <aside className="hidden lg:block w-56 flex-shrink-0 sticky top-20">
            <PalettePanel />
          </aside>

        </div>
      </div>

      {/* Mobile palette: floating button + slide-up drawer */}
      <MobilePaletteDrawer />

      {/* Confirmation modal — shown on manual submit click */}
      <SubmitModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onConfirm={handleSubmitConfirmed}
        submitting={submitting}
      />

      {/* Full-screen overlay shown while auto-submitting on timer expiry */}
      <AnimatePresence>
        {submitting && expired && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-ink/70 z-50 flex flex-col items-center justify-center gap-4"
          >
            <Loader2 size={36} className="text-teal animate-spin" />
            <p className="font-sans font-semibold text-white text-base">
              Time's up! Submitting your test…
            </p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

// ── Exported page ─────────────────────────────────────────────────────────────
/*
  TestPage — wraps everything in TestProvider so all child components can
  call useTest(). This is the component registered in App.jsx.
*/
function TestPage() {
  return (
    <TestProvider>
      <TestPageContent />
    </TestProvider>
  )
}

export default TestPage
