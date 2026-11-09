/*
  TestInstructions — the /dashboard/test page shown before the student starts.
  Outlines the 5 sections, rules and time limit.
  An "I have read the instructions" checkbox must be ticked before the
  Start button becomes active.
  If a test is already in progress the button changes to "Resume test".
  If the test is completed the student is directed to their results.
*/
import { useState, useEffect } from 'react'
import { useNavigate }         from 'react-router-dom'
import { motion }              from 'framer-motion'
import {
  Zap, Hash, BookOpen, Layers, Heart,
  Clock, ListChecks, BarChart2, CheckCircle,
  ChevronRight, AlertCircle,
} from 'lucide-react'

import { getTestStatus } from '../services/api'

// ── Static content ────────────────────────────────────────────────────────────

/*
  SECTION_DISPLAY — visual config for each section card: icon + colour scheme.
  The ids must match SECTIONS.id in questions.js.
*/
const SECTION_DISPLAY = {
  logical_reasoning: { Icon: Zap,      ring: 'bg-teal/10 text-teal',            border: 'border-teal/20'       },
  numerical_ability: { Icon: Hash,     ring: 'bg-marigold/10 text-marigold',    border: 'border-marigold/20'   },
  verbal_ability:    { Icon: BookOpen, ring: 'bg-terracotta/10 text-terracotta',border: 'border-terracotta/20' },
  spatial_reasoning: { Icon: Layers,   ring: 'bg-teal/10 text-teal',            border: 'border-teal/20'       },
  interest_profile:  { Icon: Heart,    ring: 'bg-success/10 text-success',      border: 'border-success/20'    },
}

// Four summary chips shown at the top of the page
const OVERVIEW_STATS = [
  { icon: ListChecks, label: 'Total questions', value: '36' },
  { icon: Layers,     label: 'Sections',        value: '5'  },
  { icon: Clock,      label: 'Time limit',      value: '30 min' },
  { icon: BarChart2,  label: 'Results',         value: 'Instant' },
]

// Rules listed below the section cards
const RULES = [
  'The timer counts down from 30 minutes. The test submits automatically when it reaches zero.',
  'You can mark any question for review and return to it at any time before submitting.',
  'Your answers save automatically — a page refresh will not lose your progress.',
  'Once you click "Submit test", your answers cannot be changed.',
  'Use the Previous / Next buttons or the question palette to move between questions.',
  'The Interest Profile section has no right or wrong answers — just be honest for the most accurate career match.',
]

// ── Sub-components ────────────────────────────────────────────────────────────

/*
  OverviewChip — one of the four summary stats at the top.
*/
function OverviewChip({ icon: Icon, label, value }) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-3 bg-surface border border-edge rounded-lg flex-1 min-w-[80px]">
      <Icon size={16} className="text-teal" />
      <span className="font-sans font-bold text-base text-ink">{value}</span>
      <span className="font-sans text-[10px] text-muted text-center leading-tight">{label}</span>
    </div>
  )
}

/*
  SectionCard — shows one section's icon, name, question count and description.
*/
function SectionCard({ section }) {
  const display = SECTION_DISPLAY[section.id]
  const Icon    = display.Icon

  return (
    <div className={`flex items-start gap-3 p-4 bg-surface border ${display.border} rounded-lg`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${display.ring}`}>
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-sans font-semibold text-sm text-ink">{section.label}</p>
          <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-edge text-muted">
            {section.questionCount} {section.type === 'interest' ? 'statements' : 'questions'}
          </span>
        </div>
        <p className="text-xs text-muted font-sans mt-0.5 leading-relaxed">
          {section.description}
        </p>
      </div>
    </div>
  )
}

/*
  Skeleton — pulse placeholder while test status loads.
*/
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-edge ${className}`} />
}

function InstructionsSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="flex gap-3">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 flex-1" />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20" />)}
      </div>
      <Skeleton className="h-36" />
      <Skeleton className="h-24" />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
function TestInstructions() {
  const navigate = useNavigate()

  const [sections,   setSections]   = useState([])
  const [testStatus, setTestStatus] = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [hasRead,    setHasRead]    = useState(false)

  useEffect(() => {
    getTestStatus().then(res => {
      setTestStatus(res.data.testStatus)
      setSections(res.data.sections)
      setLoading(false)
    })
  }, [])

  if (loading) return <InstructionsSkeleton />

  const status = testStatus?.status   // 'not_started' | 'in_progress' | 'completed'

  return (
    <motion.div
      className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-semibold text-ink">Aptitude Test</h1>
        <p className="text-sm text-muted font-sans mt-1">
          Read the instructions carefully before you begin.
        </p>
      </div>

      {/* Overview chips */}
      <div className="flex gap-2 sm:gap-3">
        {OVERVIEW_STATS.map(stat => (
          <OverviewChip key={stat.label} {...stat} />
        ))}
      </div>

      {/* Section cards */}
      <div>
        <h2 className="text-xs font-sans font-semibold text-muted uppercase tracking-wide mb-3">
          Sections
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sections.map(section => (
            <SectionCard key={section.id} section={section} />
          ))}
        </div>
      </div>

      {/* Rules */}
      <div className="bg-surface border border-edge rounded-lg p-5">
        <h2 className="text-xs font-sans font-semibold text-muted uppercase tracking-wide mb-4">
          Rules and guidelines
        </h2>
        <ol className="space-y-3">
          {RULES.map((rule, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-teal/10 text-teal font-sans font-bold text-[10px] flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm font-sans text-muted leading-relaxed">{rule}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* CTA section — changes based on test state */}
      <div className="bg-surface border border-edge rounded-lg p-5">

        {status === 'not_started' && (
          <>
            {/* Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer mb-5 select-none">
              <input
                type="checkbox"
                checked={hasRead}
                onChange={e => setHasRead(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-edge cursor-pointer accent-teal flex-shrink-0"
              />
              <span className="text-sm font-sans text-ink">
                I have read and understood all the instructions above.
              </span>
            </label>

            <button
              onClick={() => navigate('/dashboard/test/start')}
              disabled={!hasRead}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-teal text-white font-sans font-semibold text-sm hover:bg-teal-dark transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Start test
              <ChevronRight size={15} />
            </button>

            {!hasRead && (
              <p className="mt-3 text-xs text-muted font-sans">
                Tick the checkbox above to enable the Start button.
              </p>
            )}
          </>
        )}

        {status === 'in_progress' && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-9 h-9 rounded-full bg-marigold/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle size={16} className="text-marigold" />
              </div>
              <div>
                <p className="font-sans font-semibold text-sm text-ink">Test in progress</p>
                <p className="font-sans text-xs text-muted">
                  You answered {testStatus.questionsAnswered} of {testStatus.totalQuestions} questions. Pick up where you left off.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard/test/start')}
              className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-marigold text-ink font-sans font-semibold text-sm hover:bg-marigold-dk transition-colors cursor-pointer"
            >
              Resume test
              <ChevronRight size={15} />
            </button>
          </div>
        )}

        {status === 'completed' && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-9 h-9 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle size={16} className="text-success" />
              </div>
              <div>
                <p className="font-sans font-semibold text-sm text-ink">Test completed</p>
                <p className="font-sans text-xs text-muted">
                  You have already taken this test. View your results and career matches.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard/results')}
              className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal text-white font-sans font-semibold text-sm hover:bg-teal-dark transition-colors cursor-pointer"
            >
              View results
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default TestInstructions
