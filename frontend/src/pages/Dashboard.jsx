/*
  Dashboard — the main content panel shown at /dashboard (index route).
  Calls getDashboardData on mount, shows skeleton loaders while waiting,
  then renders: greeting, profile ring, test status card, career matches
  (locked until test is done), a next-steps checklist, and a daily fact.
*/
import { useState, useEffect } from 'react'
import { useNavigate }         from 'react-router-dom'
import { motion }              from 'framer-motion'
import {
  CheckCircle, Circle, Lock, Lightbulb, ArrowRight,
} from 'lucide-react'

import { useAuth }          from '../context/AuthContext'
import { getDashboardData } from '../services/api'

// ── Skeleton ──────────────────────────────────────────────────────────────────
/*
  Skeleton — animated placeholder shown while data is loading.
  Pass a Tailwind className to control width/height per usage site.
*/
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-edge ${className}`} />
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Returns "Good morning / afternoon / evening" based on the current hour
function getTimeGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// ── Profile Completion Ring ───────────────────────────────────────────────────
/*
  ProfileRing — SVG donut showing how complete the student's profile is.
  The ring starts at 12 o'clock (-rotate-90 on the SVG).
*/
function ProfileRing({ profileCompletion }) {
  const { percentage, items } = profileCompletion
  const r            = 40
  const circumference = 2 * Math.PI * r     // ≈ 251.33
  const dashOffset   = circumference * (1 - percentage / 100)

  return (
    <div className="bg-surface border border-edge rounded-lg p-5">
      <p className="text-xs font-sans font-semibold text-muted uppercase tracking-wide mb-4">
        Profile completion
      </p>

      <div className="flex items-center gap-5">
        {/* SVG ring */}
        <div className="relative flex-shrink-0 w-[80px] h-[80px]">
          <svg
            width="80" height="80" viewBox="0 0 100 100"
            className="-rotate-90"
            aria-hidden="true"
          >
            {/* Track ring */}
            <circle cx="50" cy="50" r={r} fill="none" stroke="var(--edge)" strokeWidth="11" />
            {/* Progress ring */}
            <circle
              cx="50" cy="50" r={r}
              fill="none"
              stroke="var(--teal)"
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.9s ease' }}
            />
          </svg>
          {/* Percentage label centred in the ring */}
          <span className="absolute inset-0 flex items-center justify-center font-sans font-bold text-base text-ink">
            {percentage}%
          </span>
        </div>

        {/* Checklist of profile items */}
        <ul className="space-y-1.5 flex-1 min-w-0">
          {items.map(item => (
            <li key={item.id} className="flex items-center gap-2">
              {item.done
                ? <CheckCircle size={13} className="text-success flex-shrink-0" />
                : <Circle      size={13} className="text-muted flex-shrink-0"   />
              }
              <span className={`text-xs font-sans truncate ${item.done ? 'text-ink' : 'text-muted'}`}>
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ── Test Status Card ──────────────────────────────────────────────────────────
/*
  TestStatusCard — renders a different CTA for each test state:
    "not_started" → teal "Start" button
    "in_progress" → marigold "Resume" button with progress note
    "completed"   → green badge + "View results" button
*/
function TestStatusCard({ testStatus }) {
  const navigate = useNavigate()

  // Build the config for the current state so the JSX stays clean
  const CONFIG = {
    not_started: {
      badge:    'Not started',
      badgeCls: 'bg-edge text-muted',
      heading:  'Ready to discover your strengths?',
      body:     '40 questions · approx. 20 minutes · instant results',
      btnLabel: 'Start the aptitude test',
      btnCls:   'bg-teal text-white hover:bg-teal-dark',
      onClick:  () => navigate('/dashboard/test'),
    },
    in_progress: {
      badge:    'In progress',
      badgeCls: 'bg-marigold/15 text-marigold',
      heading:  'You are part way through',
      body:     `${testStatus.questionsAnswered} of ${testStatus.totalQuestions} questions answered`,
      btnLabel: 'Resume test',
      btnCls:   'bg-marigold text-ink hover:bg-marigold-dk',
      onClick:  () => navigate('/dashboard/test'),
    },
    completed: {
      badge:    'Completed',
      badgeCls: 'bg-success/10 text-success',
      heading:  'Your results are ready',
      body:     'See your aptitude scores and matched career paths.',
      btnLabel: 'View results',
      btnCls:   'bg-teal text-white hover:bg-teal-dark',
      onClick:  () => navigate('/dashboard/results'),
    },
  }

  const c = CONFIG[testStatus.status]

  return (
    <div className="bg-surface border border-edge rounded-lg p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1 min-w-0">
        <span className={`inline-block text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full mb-2 ${c.badgeCls}`}>
          {c.badge}
        </span>
        <p className="font-semibold text-ink text-sm mb-0.5">{c.heading}</p>
        <p className="text-xs text-muted font-sans">{c.body}</p>
      </div>
      <button
        onClick={c.onClick}
        className={`
          flex-shrink-0 inline-flex items-center gap-2 justify-center
          px-4 py-2.5 rounded-lg text-sm font-sans font-semibold
          transition-colors duration-150 cursor-pointer
          ${c.btnCls}
        `}
      >
        {c.btnLabel}
        <ArrowRight size={14} />
      </button>
    </div>
  )
}

// ── Career Match Card ─────────────────────────────────────────────────────────
/*
  CareerMatchCard — displays one career result.
  When 'locked', the content is blurred and a Lock overlay appears,
  prompting the student to take the test.
*/
function CareerMatchCard({ career, locked }) {
  return (
    <div className="relative bg-surface border border-edge rounded-lg p-4 overflow-hidden">

      {/* Content — blurred when locked so the layout is still visible */}
      <div className={locked ? 'blur-sm select-none pointer-events-none' : ''}>
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="text-2xl leading-none">{career.icon}</span>
          <span className="text-xs font-sans font-bold px-2 py-0.5 rounded-full bg-teal/10 text-teal flex-shrink-0">
            {career.matchPct}% match
          </span>
        </div>
        <p className="font-semibold text-ink text-sm leading-tight mb-0.5">{career.title}</p>
        <p className="text-[10px] text-muted font-sans mb-2">{career.stream}</p>
        <p className="text-xs text-muted font-sans leading-relaxed mb-3">{career.description}</p>
        <div className="flex flex-wrap gap-1">
          {career.tags.map(tag => (
            <span
              key={tag}
              className="text-[10px] font-sans font-medium px-2 py-0.5 rounded-full bg-edge text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Lock overlay */}
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface/60">
          <div className="bg-surface border border-edge rounded-lg px-4 py-3 text-center shadow-sm">
            <Lock size={15} className="text-muted mx-auto mb-1.5" />
            <p className="text-xs font-sans font-semibold text-ink">Locked</p>
            <p className="text-[10px] font-sans text-muted mt-0.5">Take the test to unlock</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Next Steps Checklist ──────────────────────────────────────────────────────
/*
  NextSteps — interactive to-do list.
  Clicking a row toggles its done state locally (would sync to server in production).
*/
function NextSteps({ steps, onToggle }) {
  const doneCount = steps.filter(s => s.done).length

  return (
    <div className="bg-surface border border-edge rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-sans font-semibold text-muted uppercase tracking-wide">
          Your next steps
        </p>
        <span className="text-xs font-sans text-muted">{doneCount}/{steps.length} done</span>
      </div>

      <ul className="space-y-2.5">
        {steps.map(step => (
          <li key={step.id}>
            <button
              onClick={() => onToggle(step.id)}
              aria-pressed={step.done}
              aria-label={step.text}
              className="flex items-center gap-3 w-full text-left cursor-pointer group"
            >
              {step.done
                ? <CheckCircle size={16} className="text-success flex-shrink-0" />
                : <Circle      size={16} className="text-edge group-hover:text-muted flex-shrink-0 transition-colors" />
              }
              <span className={`text-sm font-sans transition-colors ${
                step.done ? 'line-through text-muted' : 'text-ink group-hover:text-teal'
              }`}>
                {step.text}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Daily Fact ────────────────────────────────────────────────────────────────
/*
  DailyFact — "Did you know?" card.
  The fact rotates daily (chosen by day-of-year in api.js).
*/
function DailyFact({ fact, source }) {
  return (
    <div className="bg-surface border border-edge rounded-lg p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-marigold/15 flex items-center justify-center flex-shrink-0">
          <Lightbulb size={13} className="text-marigold" />
        </div>
        <p className="text-xs font-sans font-semibold text-muted uppercase tracking-wide">
          Did you know?
        </p>
      </div>

      <p className="text-sm font-sans text-ink leading-relaxed flex-1">{fact}</p>

      <p className="text-[10px] font-sans text-muted">Source: {source}</p>
    </div>
  )
}

// ── Skeleton layout ───────────────────────────────────────────────────────────
/*
  DashboardSkeleton — mirrors the shape of the real dashboard while data loads,
  preventing a layout shift when the content appears.
*/
function DashboardSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
      <div>
        <Skeleton className="h-4 w-32 mb-3" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-52" />
          <Skeleton className="h-52" />
          <Skeleton className="h-52" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
      </div>
    </div>
  )
}

// ── Main page component ───────────────────────────────────────────────────────
function Dashboard() {
  const { user } = useAuth()

  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  // Steps are in local state so toggling is instant without a network round-trip
  const [steps,   setSteps]   = useState([])

  useEffect(() => {
    getDashboardData(user?.id).then(res => {
      setData(res.data)
      setSteps(res.data.nextSteps)
      setLoading(false)
    })
  }, [user?.id])

  function toggleStep(id) {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, done: !s.done } : s))
  }

  if (loading) return <DashboardSkeleton />

  const { profileCompletion, testStatus, careerMatches, dailyFact } = data
  const testDone  = testStatus.status === 'completed'
  const firstName = user?.fullName?.split(' ')[0] || 'there'

  return (
    <motion.div
      className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold text-ink">
          {getTimeGreeting()}, {firstName}.
        </h1>
        <p className="text-sm text-muted font-sans mt-0.5">
          {testDone
            ? 'Your career matches are ready — explore them below.'
            : 'Take the aptitude test to unlock your personalised career matches.'}
        </p>
      </div>

      {/* Profile ring + Test status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ProfileRing profileCompletion={profileCompletion} />
        <TestStatusCard testStatus={testStatus} />
      </div>

      {/* Career matches */}
      <div>
        <p className="text-xs font-sans font-semibold text-muted uppercase tracking-wide mb-3">
          Top career matches
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {careerMatches.map(career => (
            <CareerMatchCard
              key={career.id}
              career={career}
              locked={!testDone}
            />
          ))}
        </div>
      </div>

      {/* Next steps + Daily fact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NextSteps steps={steps} onToggle={toggleStep} />
        <DailyFact fact={dailyFact.fact} source={dailyFact.source} />
      </div>
    </motion.div>
  )
}

export default Dashboard
