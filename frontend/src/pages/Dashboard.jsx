/*
  Dashboard — the main content panel shown at /dashboard (index route).
  On xl screens: two-column layout (main content + 320px right sidebar).
  Main: greeting, profile ring, test status, career matches, next steps, daily fact.
  Right sidebar: mini aptitude radar, quick action buttons, recently viewed careers.
*/
import { useState, useEffect }     from 'react'
import { Link, useNavigate }       from 'react-router-dom'
import { motion }                  from 'framer-motion'
import {
  CheckCircle, Circle, Lock, Lightbulb, ArrowRight,
  RefreshCw, Compass, MessageCircle, Printer, History,
} from 'lucide-react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from 'recharts'

import { useAuth }                       from '../context/AuthContext'
import { useLanguage }                   from '../context/LanguageContext'
import { useTheme }                      from '../context/ThemeContext'
import usePageTitle                      from '../hooks/usePageTitle'
import { getDashboardData, getResults, getRecommendations } from '../services/api'

// ── Hex colours for Recharts (can't use CSS vars in SVG attributes) ───────────
const CHART_COLORS = {
  light: { radar: '#0F5C52', grid: '#E4DDD1', text: '#6B645C' },
  dark:  { radar: '#5FBFAE', grid: '#2E302C', text: '#A39C90' },
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
/*
  Skeleton — animated placeholder shown while data is loading.
  Pass a Tailwind className to control width/height per usage site.
*/
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-edge ${className}`} />
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Returns the translation key for the time-based greeting
function getGreetingKey() {
  const h = new Date().getHours()
  if (h < 12) return 'dash_morning'
  if (h < 17) return 'dash_afternoon'
  return 'dash_evening'
}

// ── Profile Completion Ring ───────────────────────────────────────────────────
/*
  ProfileRing — SVG donut showing how complete the student's profile is.
  The ring starts at 12 o'clock (-rotate-90 on the SVG).
*/
function ProfileRing({ profileCompletion }) {
  const { t }             = useLanguage()
  const { percentage, items } = profileCompletion
  const r            = 40
  const circumference = 2 * Math.PI * r     // ≈ 251.33
  const dashOffset   = circumference * (1 - percentage / 100)

  return (
    <div className="bg-surface border border-edge rounded-lg p-5">
      <p className="text-xs font-sans font-semibold text-muted uppercase tracking-wide mb-4">
        {t('dash_profile')}
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
  const { t }    = useLanguage()

  // Build the config for the current state so the JSX stays clean
  const CONFIG = {
    not_started: {
      badge:    t('ts_not_started'),
      badgeCls: 'bg-edge text-muted',
      heading:  t('ts_ns_heading'),
      body:     t('ts_ns_body'),
      btnLabel: t('ts_ns_btn'),
      btnCls:   'bg-teal text-white hover:bg-teal-dark',
      onClick:  () => navigate('/dashboard/test'),
    },
    in_progress: {
      badge:    t('ts_in_progress'),
      badgeCls: 'bg-marigold/15 text-marigold',
      heading:  t('ts_ip_heading'),
      body:     t('ts_ip_body', { answered: testStatus.questionsAnswered, total: testStatus.totalQuestions }),
      btnLabel: t('ts_ip_btn'),
      btnCls:   'bg-marigold text-ink hover:bg-marigold-dk',
      onClick:  () => navigate('/dashboard/test'),
    },
    completed: {
      badge:    t('ts_completed'),
      badgeCls: 'bg-success/10 text-success',
      heading:  t('ts_done_heading'),
      body:     testStatus.overallScore != null
                  ? t('ts_done_body', { score: testStatus.overallScore })
                  : t('ts_done_body_ns'),
      btnLabel: t('ts_done_btn'),
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
  CareerMatchCard — displays one career result with match percentage.
  When 'locked', the content is blurred and a Lock overlay appears,
  prompting the student to take the test.
*/
function CareerMatchCard({ career, locked }) {
  const { t } = useLanguage()
  return (
    <div className="relative bg-surface border border-edge rounded-lg p-4 overflow-hidden">

      {/* Content — blurred when locked so the layout is still visible */}
      <div className={locked ? 'blur-sm select-none pointer-events-none' : ''}>
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="text-2xl leading-none">{career.icon}</span>
          {career.matchPct != null && (
            <span className="text-xs font-sans font-bold px-2 py-0.5 rounded-full bg-teal/10 text-teal flex-shrink-0">
              {career.matchPct}% match
            </span>
          )}
        </div>
        <p className="font-semibold text-ink text-sm leading-tight mb-0.5">{career.title}</p>
        <p className="text-[10px] text-muted font-sans mb-2">{career.stream}</p>
        <p className="text-xs text-muted font-sans leading-relaxed mb-3 max-w-[40ch]">{career.description}</p>
        <div className="flex flex-wrap gap-1">
          {(career.skills ?? []).slice(0, 3).map(skill => (
            <span
              key={skill}
              className="text-[10px] font-sans font-medium px-2 py-0.5 rounded-full bg-edge text-muted"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Lock overlay */}
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface/60">
          <div className="bg-surface border border-edge rounded-lg px-4 py-3 text-center shadow-sm">
            <Lock size={15} className="text-muted mx-auto mb-1.5" />
            <p className="text-xs font-sans font-semibold text-ink">{t('locked')}</p>
            <p className="text-[10px] font-sans text-muted mt-0.5">{t('locked_sub')}</p>
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
  const { t }     = useLanguage()
  const doneCount = steps.filter(s => s.done).length

  return (
    <div className="bg-surface border border-edge rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-sans font-semibold text-muted uppercase tracking-wide">
          {t('dash_next_steps')}
        </p>
        <span className="text-xs font-sans text-muted">{t('dash_done_count', { done: doneCount, total: steps.length })}</span>
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
  const { t } = useLanguage()
  return (
    <div className="bg-surface border border-edge rounded-lg p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-marigold/15 flex items-center justify-center flex-shrink-0">
          <Lightbulb size={13} className="text-marigold" />
        </div>
        <p className="text-xs font-sans font-semibold text-muted uppercase tracking-wide">
          {t('dash_did_you_know')}
        </p>
      </div>

      <p className="text-sm font-sans text-ink leading-relaxed max-w-prose">{fact}</p>

      {source && (
        <p className="text-[10px] font-sans text-muted">{t('dash_source')}: {source}</p>
      )}
    </div>
  )
}

// ── Right Sidebar ─────────────────────────────────────────────────────────────

// sectionScores keys are section IDs (e.g. 'logical_reasoning'); map them to
// short display labels that fit the compact radar chart.
const SECTION_LABEL = {
  logical_reasoning:    'Logic',
  numerical_ability:    'Maths',
  verbal_ability:       'Verbal',
  spatial_reasoning:    'Spatial',
  interest_personality: 'Interest',
}

/*
  MiniRadar — compact RadarChart of aptitude section scores.
  Only rendered when the student has completed the test and resultData is available.
  Abbreviated axis labels keep the small chart readable.
*/
function MiniRadar({ sectionScores, theme }) {
  const c = CHART_COLORS[theme] || CHART_COLORS.light

  // Build the data array recharts expects: [{ subject, value }]
  const data = Object.entries(sectionScores).map(([key, value]) => ({
    subject: SECTION_LABEL[key] ?? key,
    value,
  }))

  return (
    <ResponsiveContainer width="100%" height={160}>
      <RadarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
        <PolarGrid stroke={c.grid} />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: c.text, fontSize: 9, fontFamily: 'Plus Jakarta Sans' }}
        />
        <Radar
          dataKey="value"
          stroke={c.radar}
          fill={c.radar}
          fillOpacity={0.25}
          strokeWidth={1.5}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}

/*
  QuickActions — four shortcut buttons giving fast access to key actions.
  Uses Link for navigation items and a button for print (no route needed).
*/
function QuickActions() {
  const ACTIONS = [
    { label: 'Retake test',       icon: RefreshCw,     to: '/dashboard/test'       },
    { label: 'Explore careers',   icon: Compass,       to: '/dashboard/explore'    },
    { label: 'Talk to counsellor',icon: MessageCircle, to: '/dashboard/counsellor' },
    { label: 'Download report',   icon: Printer,       onClick: () => window.print() },
  ]

  return (
    <div className="bg-surface border border-edge rounded-lg p-4">
      <p className="text-[10px] font-sans font-semibold text-muted uppercase tracking-wide mb-3">
        Quick actions
      </p>
      <ul className="space-y-1">
        {ACTIONS.map(action => {
          const Icon = action.icon
          const cls  = `flex items-center gap-2.5 w-full px-3 py-2 rounded-lg
            text-xs font-sans font-semibold text-ink
            hover:bg-edge/60 transition-colors text-left cursor-pointer`

          if (action.onClick) {
            return (
              <li key={action.label}>
                <button onClick={action.onClick} className={cls}>
                  <Icon size={13} className="text-teal flex-shrink-0" />
                  {action.label}
                </button>
              </li>
            )
          }
          return (
            <li key={action.label}>
              <Link to={action.to} className={`${cls} no-underline`}>
                <Icon size={13} className="text-teal flex-shrink-0" />
                {action.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/*
  RecentlyViewed — placeholder panel showing the last-viewed careers.
  Real tracking (localStorage or server) is out of scope for the mock;
  we show a friendly empty state with a link to the Explorer.
*/
function RecentlyViewed({ careers }) {
  if (!careers || careers.length === 0) {
    return (
      <div className="bg-surface border border-edge rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <History size={13} className="text-muted" />
          <p className="text-[10px] font-sans font-semibold text-muted uppercase tracking-wide">
            Recently viewed
          </p>
        </div>
        <p className="text-xs font-sans text-muted leading-relaxed mb-3">
          Careers you open will appear here for quick access.
        </p>
        <Link
          to="/dashboard/explore"
          className="text-xs font-sans font-semibold text-teal hover:underline no-underline"
        >
          Browse careers →
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-edge rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <History size={13} className="text-muted" />
        <p className="text-[10px] font-sans font-semibold text-muted uppercase tracking-wide">
          Recently viewed
        </p>
      </div>
      <ul className="space-y-2">
        {careers.map(c => (
          <li key={c.id}>
            <Link
              to={`/dashboard/careers/${c.id}`}
              className="flex items-center gap-2 text-xs font-sans text-ink hover:text-teal no-underline transition-colors"
            >
              <span className="text-base leading-none">{c.icon}</span>
              <span className="truncate">{c.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/*
  RightSidebar — sticky right column shown on xl screens.
  Contains the aptitude score mini-radar (when test is done),
  quick action shortcuts, and recently viewed careers.
*/
function RightSidebar({ resultData, theme }) {
  const testDone     = !!resultData
  const sectionScores = resultData?.sectionScores || {}

  return (
    <aside className="hidden xl:flex xl:flex-col gap-4 sticky top-4 self-start">

      {/* Mini aptitude radar — only when test is complete */}
      {testDone && Object.keys(sectionScores).length > 0 && (
        <div className="bg-surface border border-edge rounded-lg p-4">
          <p className="text-[10px] font-sans font-semibold text-muted uppercase tracking-wide mb-1">
            Aptitude snapshot
          </p>
          <MiniRadar sectionScores={sectionScores} theme={theme} />
          <Link
            to="/dashboard/results"
            className="text-xs font-sans font-semibold text-teal hover:underline no-underline block mt-1 text-center"
          >
            View full results →
          </Link>
        </div>
      )}

      <QuickActions />
      <RecentlyViewed careers={[]} />

    </aside>
  )
}

// ── Data helpers ──────────────────────────────────────────────────────────────

/*
  computeProfileCompletion — builds the profile checklist from the real user
  object so the ring and tick marks always reflect actual account state.
  'test' item is ticked once the student completes the aptitude test.
*/
function computeProfileCompletion(user, testDone) {
  const items = [
    { id: 'basic',     label: 'Basic info',         done: !!(user?.fullName && user?.email) },
    { id: 'school',    label: 'School details',      done: !!(user?.schoolName && user?.class) },
    { id: 'interests', label: 'Interests selected',  done: !!(user?.interests?.length) },
    { id: 'photo',     label: 'Profile photo',       done: !!(user?.avatarUrl) },
    { id: 'test',      label: 'Aptitude test taken', done: testDone },
  ]
  const doneCount = items.filter(i => i.done).length
  return {
    percentage: Math.round((doneCount / items.length) * 100),
    items,
  }
}

/*
  computeNextSteps — ticks each step based on real app state.
  Steps 4 and 5 use localStorage flags set by CareerDetail and Counsellor
  so they persist across navigation without a server round-trip.
*/
function computeNextSteps(profilePct, testDone, resultData) {
  return [
    { id: 'ns_1', text: 'Complete your profile',          done: profilePct >= 80 },
    { id: 'ns_2', text: 'Take the aptitude test',         done: testDone },
    { id: 'ns_3', text: 'Review your top career matches', done: !!(testDone && resultData) },
    { id: 'ns_4', text: 'Explore a career roadmap',       done: localStorage.getItem('pf-roadmap-opened') === 'true' },
    { id: 'ns_5', text: 'Chat with the AI counsellor',    done: localStorage.getItem('pf-chat-sent') === 'true' },
  ]
}

// ── Skeleton layout ───────────────────────────────────────────────────────────
/*
  DashboardSkeleton — mirrors the two-column shape of the real dashboard
  while data is loading, preventing a layout shift when content appears.
*/
function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="xl:grid xl:grid-cols-[1fr_320px] xl:gap-6 xl:items-start">
        <div className="space-y-6">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <div className="hidden xl:flex xl:flex-col gap-4">
          <Skeleton className="h-52" />
          <Skeleton className="h-44" />
          <Skeleton className="h-36" />
        </div>
      </div>
    </div>
  )
}

// ── Main page component ───────────────────────────────────────────────────────
function Dashboard() {
  usePageTitle('Dashboard')
  const { user }  = useAuth()
  const { t }     = useLanguage()
  const { theme } = useTheme()

  const [data,          setData]          = useState(null)
  const [resultData,    setResultData]    = useState(null)
  const [careerMatches, setCareerMatches] = useState([])
  const [loading,       setLoading]       = useState(true)
  // Steps live in local state so toggling is instant without a network round-trip
  const [steps,         setSteps]         = useState([])

  useEffect(() => {
    // Fetch dashboard data, test results, and career recommendations in parallel
    Promise.all([
      getDashboardData(user?.id),
      getResults(),
      getRecommendations(),
    ]).then(([dashRes, resRes, recsRes]) => {
      const result  = resRes.data.result          // null if test not yet taken
      const testDone = dashRes.data.testStatus.status === 'completed'

      // Merge the real overall score from getResults into the testStatus object
      const mergedTestStatus = {
        ...dashRes.data.testStatus,
        overallScore: result?.overallScore ?? dashRes.data.testStatus.overallScore ?? null,
      }

      // Compute profile completion from real user data instead of hardcoded flags
      const profileComp = computeProfileCompletion(user, testDone)

      // Compute next steps from real state + localStorage flags
      const initialSteps = computeNextSteps(profileComp.percentage, testDone, result)

      setData({ ...dashRes.data, testStatus: mergedTestStatus })
      setResultData(result)
      // Show top 6 careers by match percentage from the real recommendations API
      setCareerMatches(recsRes.data.careers.slice(0, 6))
      setSteps(initialSteps)
      setLoading(false)
    })
  }, [user?.id])

  function toggleStep(id) {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, done: !s.done } : s))
  }

  if (loading) return <DashboardSkeleton />

  const { testStatus, dailyFact } = data
  // Recompute profile completion each render so it reflects the current user object
  const testDone          = testStatus.status === 'completed'
  const profileCompletion = computeProfileCompletion(user, testDone)
  const firstName         = user?.fullName?.split(' ')[0] || 'there'

  return (
    <motion.div
      className="max-w-7xl mx-auto px-4 sm:px-6 py-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/*
        Two-column layout on xl screens: main content takes remaining space,
        right sidebar is pinned at 320px. On smaller screens it's a single column.
      */}
      <div className="xl:grid xl:grid-cols-[1fr_320px] xl:gap-6 xl:items-start">

        {/* ── Main content column ── */}
        <div className="space-y-6">

          {/* Greeting */}
          <div>
            <h1 className="text-2xl font-semibold text-ink">
              {t(getGreetingKey())}, {firstName}.
            </h1>
            <p className="text-sm text-muted font-sans mt-0.5">
              {testDone ? t('dash_sub_done') : t('dash_sub_todo')}
            </p>
          </div>

          {/* Profile ring + Test status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ProfileRing profileCompletion={profileCompletion} />
            <TestStatusCard testStatus={testStatus} />
          </div>

          {/* Career matches — 1 col mobile, 2 tablet, 3 large screens */}
          <div>
            <p className="text-xs font-sans font-semibold text-muted uppercase tracking-wide mb-3">
              {t('dash_top_careers')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

        </div>

        {/* ── Right sidebar (xl screens only) ── */}
        <RightSidebar resultData={resultData} theme={theme} />

      </div>
    </motion.div>
  )
}

export default Dashboard
