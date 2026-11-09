/*
  CareerDetail.jsx — career detail page at /dashboard/careers/:id.
  Loads the career by id from api.getCareerById and the student's
  recommendations (to get the match % for this career and its related ones).

  Sections:
    1. DetailHeader   — icon, title, stream, match %, description, back button
    2. RoadmapSection — animated vertical timeline (Class 10 → Growth)
    3. SalaryChart    — Recharts horizontal stacked-bar showing INR range per level
    4. SkillsCard     — 5 key competency chips
    5. EntranceExams  — exam name + description cards
    6. TopColleges    — numbered list
    7. DayInLife      — quote-style block
    8. FutureOutlook  — teal-tinted banner
    9. RelatedCareers — mini cards linking to sibling detail pages
*/
import { useState, useEffect }          from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion }                        from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { ArrowLeft, ChevronRight, BookOpen, Building2, Sun, TrendingUp } from 'lucide-react'

import { getCareerById, getRecommendations } from '../services/api'
import { useTheme }                           from '../context/ThemeContext'

// ── Chart colours (same pattern as Results.jsx) ───────────────────────────────

const CHART_COLORS = {
  light: { teal: '#0F5C52', marigold: '#E3A23B', edge: '#E4DDD1', muted: '#6B645C', ink: '#1C1917' },
  dark:  { teal: '#5FBFAE', marigold: '#EDB04F', edge: '#2E302C', muted: '#A39C90', ink: '#EDE8DF' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatSalary(value) {
  if (value >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`
  if (value >= 100000)   return `${Math.round(value / 100000)}L`
  return `${Math.round(value / 1000)}K`
}

function matchStroke(pct) {
  if (pct >= 70) return 'var(--teal)'
  if (pct >= 40) return 'var(--marigold)'
  return 'var(--terracotta)'
}

// ── Custom salary tooltip ─────────────────────────────────────────────────────

/*
  SalaryTooltip — themed custom tooltip for the salary range chart.
  Reconstructs the min from the invisible base bar + visible range bar.
*/
function SalaryTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const base  = payload[0]?.value ?? 0
  const range = payload[1]?.value ?? 0
  if (!range) return null
  return (
    <div className="bg-surface border border-edge rounded-lg px-3 py-2 shadow-md">
      <p className="text-[11px] font-sans text-muted mb-1">{label} level</p>
      <p className="text-sm font-mono font-bold text-ink">
        ₹{formatSalary(base)} – ₹{formatSalary(base + range)}
      </p>
      <p className="text-[10px] font-sans text-muted">per year (CTC)</p>
    </div>
  )
}

// ── Detail header ─────────────────────────────────────────────────────────────

/*
  DetailHeader — back button, career identity, match % ring and description.
*/
function DetailHeader({ career, matchPct, hasResults, navigate }) {
  const { icon, title, stream, description } = career
  const R  = 24
  const SW = 5
  const C  = 2 * Math.PI * R

  const stroke = matchPct != null ? matchStroke(matchPct) : 'var(--teal)'

  return (
    <div className="bg-surface border border-edge rounded-xl p-5 sm:p-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-muted hover:text-ink transition-colors cursor-pointer mb-5"
      >
        <ArrowLeft size={13} />
        Explore careers
      </button>

      <div className="flex items-start gap-4 flex-wrap">
        {/* Icon + title + stream */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl leading-none" aria-hidden="true">{icon}</span>
            <div>
              <h1 className="font-serif text-2xl font-semibold text-ink leading-tight">{title}</h1>
              <span className="inline-block mt-1 text-xs font-sans font-semibold px-2.5 py-0.5 rounded-full bg-teal/10 text-teal">
                {stream}
              </span>
            </div>
          </div>
          <p className="font-sans text-sm text-muted leading-relaxed">{description}</p>
        </div>

        {/* Match ring — only when test has been taken */}
        {hasResults && matchPct != null && (
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <svg width={72} height={72} aria-label={`${matchPct}% match`}>
              <circle cx={36} cy={36} r={R} fill="none" stroke="var(--edge)" strokeWidth={SW} />
              <circle
                cx={36} cy={36} r={R}
                fill="none"
                strokeWidth={SW}
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - matchPct / 100)}
                style={{ stroke, transform: 'rotate(-90deg)', transformOrigin: '36px 36px' }}
              />
              <text x={36} y={36} textAnchor="middle" dominantBaseline="middle"
                style={{ fontSize: 14, fontWeight: 700, fontFamily: 'ui-monospace,monospace', fill: stroke }}>
                {matchPct}%
              </text>
            </svg>
            <span className="text-[10px] font-sans text-muted">match</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Roadmap ───────────────────────────────────────────────────────────────────

/*
  RoadmapSection — vertical timeline with 7 milestones, each animating into
  view as the student scrolls down. Each step shows stage, title and description.
*/
function RoadmapSection({ roadmap }) {
  return (
    <div className="bg-surface border border-edge rounded-xl p-5">
      <h2 className="font-sans font-semibold text-sm text-ink mb-6">Your Roadmap</h2>

      <div className="relative">
        {/* Continuous vertical connector line */}
        <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-edge" aria-hidden="true" />

        <div className="space-y-0">
          {roadmap.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.35, delay: i * 0.07 }}
              className="relative flex gap-4 pb-7 last:pb-0"
            >
              {/* Numbered circle */}
              <div className="relative z-10 flex-shrink-0 w-9 h-9 rounded-full bg-teal flex items-center justify-center text-white text-xs font-sans font-bold shadow-sm">
                {step.step}
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <p className="text-[10px] font-sans font-semibold text-muted uppercase tracking-wide mb-0.5">
                  {step.stage}
                </p>
                <p className="font-sans font-semibold text-sm text-ink mb-1">{step.title}</p>
                <p className="text-xs font-sans text-muted leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Salary chart ──────────────────────────────────────────────────────────────

/*
  SalaryChart — horizontal Recharts bar showing the INR salary range at
  entry, mid and senior levels. Uses a stacked-bar trick: a transparent
  "base" bar offsets the visible "range" bar to show min–max correctly.
*/
function SalaryChart({ salary, colors }) {
  const data = [
    { level: 'Entry',  base: salary.entry.min,  range: salary.entry.max  - salary.entry.min  },
    { level: 'Mid',    base: salary.mid.min,     range: salary.mid.max    - salary.mid.min    },
    { level: 'Senior', base: salary.senior.min,  range: salary.senior.max - salary.senior.min },
  ]

  const domainMax = Math.ceil(salary.senior.max / 1000000) * 1000000

  return (
    <div className="bg-surface border border-edge rounded-xl p-5">
      <h2 className="font-sans font-semibold text-sm text-ink mb-1">Salary Progression</h2>
      <p className="text-xs font-sans text-muted mb-5">Annual CTC in India (INR)</p>

      <ResponsiveContainer width="100%" height={160}>
        <BarChart layout="vertical" data={data} barCategoryGap="35%" margin={{ right: 24 }}>
          <CartesianGrid horizontal={false} stroke={colors.edge} strokeDasharray="3 3" />
          <XAxis
            type="number"
            domain={[0, domainMax]}
            tickFormatter={v => v === 0 ? '0' : `${Math.round(v / 100000)}L`}
            tick={{ fill: colors.muted, fontSize: 10, fontFamily: 'sans-serif' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="level"
            width={46}
            tick={{ fill: colors.ink, fontSize: 11, fontFamily: 'sans-serif' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<SalaryTooltip />} cursor={{ fill: colors.edge, opacity: 0.3 }} />
          {/* Invisible offset bar */}
          <Bar dataKey="base"  stackId="s" fill="transparent" />
          {/* Visible range bar */}
          <Bar dataKey="range" stackId="s" fill={colors.teal} radius={[0, 4, 4, 0]}
               animationBegin={0} animationDuration={800} />
        </BarChart>
      </ResponsiveContainer>

      {/* Min–max labels below the chart */}
      <div className="flex justify-between mt-3 pt-3 border-t border-edge">
        {data.map(d => (
          <div key={d.level} className="text-center">
            <p className="text-[10px] font-sans text-muted">{d.level}</p>
            <p className="text-xs font-mono font-semibold text-ink">
              ₹{formatSalary(d.base)}–{formatSalary(d.base + d.range)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Skills card ───────────────────────────────────────────────────────────────

/*
  SkillsCard — the 5 key competencies shown as large readable chips.
*/
function SkillsCard({ skills }) {
  return (
    <div className="bg-surface border border-edge rounded-xl p-5">
      <h2 className="font-sans font-semibold text-sm text-ink mb-4">Key Skills</h2>
      <div className="flex flex-wrap gap-2">
        {skills.map(skill => (
          <span
            key={skill}
            className="text-xs font-sans font-semibold px-3 py-1.5 rounded-full bg-teal/8 text-teal border border-teal/20"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Entrance exams ────────────────────────────────────────────────────────────

/*
  EntranceExams — each exam shown as a small card with name and description.
*/
function EntranceExams({ exams }) {
  return (
    <div className="bg-surface border border-edge rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen size={14} className="text-teal" />
        <h2 className="font-sans font-semibold text-sm text-ink">Entrance Exams</h2>
      </div>
      <div className="space-y-3">
        {exams.map(exam => (
          <div key={exam.name} className="flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-md bg-teal/10 flex items-center justify-center">
              <span className="text-[8px] font-bold text-teal">✓</span>
            </span>
            <div>
              <p className="font-sans font-semibold text-xs text-ink">{exam.name}</p>
              <p className="font-sans text-xs text-muted leading-relaxed">{exam.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Top colleges ──────────────────────────────────────────────────────────────

/*
  TopColleges — numbered list of the top 5 Indian institutions for this career.
*/
function TopColleges({ colleges }) {
  return (
    <div className="bg-surface border border-edge rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Building2 size={14} className="text-teal" />
        <h2 className="font-sans font-semibold text-sm text-ink">Top Colleges in India</h2>
      </div>
      <ol className="space-y-2.5">
        {colleges.map((college, i) => (
          <li key={college} className="flex items-center gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-edge text-muted flex items-center justify-center text-[10px] font-bold font-sans">
              {i + 1}
            </span>
            <span className="font-sans text-sm text-ink">{college}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

// ── Day in the life ───────────────────────────────────────────────────────────

/*
  DayInLife — quote-style full-width card describing a typical workday.
*/
function DayInLife({ text }) {
  return (
    <div className="bg-surface border border-edge rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sun size={14} className="text-marigold" />
        <h2 className="font-sans font-semibold text-sm text-ink">A Day in the Life</h2>
      </div>
      <p className="font-sans text-sm text-muted leading-relaxed border-l-2 border-marigold/40 pl-4">
        {text}
      </p>
    </div>
  )
}

// ── Future outlook ────────────────────────────────────────────────────────────

/*
  FutureOutlook — teal-tinted banner summarising market demand and trends.
*/
function FutureOutlook({ text }) {
  return (
    <div className="bg-teal/5 border border-teal/20 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={14} className="text-teal" />
        <h2 className="font-sans font-semibold text-sm text-ink">Future Outlook</h2>
      </div>
      <p className="font-sans text-sm text-muted leading-relaxed">{text}</p>
    </div>
  )
}

// ── Related career mini-card ──────────────────────────────────────────────────

/*
  RelatedCareerCard — a compact link tile used in the "You might also like"
  row at the bottom of the detail page.
*/
function RelatedCareerCard({ career, hasResults }) {
  return (
    <Link
      to={`/dashboard/careers/${career.id}`}
      className="flex items-center gap-3 bg-surface border border-edge rounded-xl p-4 hover:border-teal/40 hover:shadow-sm transition-all group"
    >
      <span className="text-xl flex-shrink-0" aria-hidden="true">{career.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-sans font-semibold text-sm text-ink truncate group-hover:text-teal transition-colors">
          {career.title}
        </p>
        <p className="text-xs font-sans text-muted">{career.stream}</p>
      </div>
      {hasResults && career.matchPct != null && (
        <span className="text-xs font-mono font-bold text-teal flex-shrink-0">
          {career.matchPct}%
        </span>
      )}
      <ChevronRight size={14} className="text-muted flex-shrink-0" />
    </Link>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

/*
  DetailSkeleton — pulse placeholders while data loads.
*/
function DetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-pulse">
      <div className="h-40 bg-surface border border-edge rounded-xl" />
      <div className="h-96 bg-surface border border-edge rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="h-56 bg-surface border border-edge rounded-xl" />
        <div className="h-56 bg-surface border border-edge rounded-xl" />
      </div>
      <div className="h-32 bg-surface border border-edge rounded-xl" />
      <div className="h-24 bg-surface border border-edge rounded-xl" />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

/*
  CareerDetail — the main exported page component.
  Fetches the career + recommendations in parallel, then renders all sections.
*/
export default function CareerDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const colors    = CHART_COLORS[theme]

  const [career,         setCareer]         = useState(null)
  const [matchPct,       setMatchPct]       = useState(null)
  const [hasResults,     setHasResults]     = useState(false)
  const [relatedCareers, setRelatedCareers] = useState([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState(null)

  useEffect(() => {
    setLoading(true)
    setCareer(null)

    Promise.all([getCareerById(id), getRecommendations()])
      .then(([careerRes, recsRes]) => {
        const c          = careerRes.data.career
        const allCareers = recsRes.data.careers

        setCareer(c)
        setHasResults(recsRes.data.hasResults)

        // Find this career's match % from the recommendations list
        const thisRec = allCareers.find(x => x.id === id)
        setMatchPct(thisRec?.matchPct ?? null)

        // Related careers with their match % already attached
        setRelatedCareers(
          allCareers.filter(x => c.relatedCareers.includes(x.id))
        )
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])  // re-fetch when the id changes (e.g. clicking a related career)

  if (loading) return <DetailSkeleton />

  if (error) return (
    <div className="max-w-3xl mx-auto py-16 text-center space-y-3">
      <p className="font-sans font-semibold text-ink">Career not found</p>
      <p className="text-sm font-sans text-muted">{error}</p>
      <Link to="/dashboard/careers" className="text-sm font-sans font-semibold text-teal hover:text-teal-dark">
        ← Back to careers
      </Link>
    </div>
  )

  if (!career) return null

  const { skills, salary, entranceExams, topColleges, roadmap, dayInTheLife, futureOutlook } = career

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl mx-auto space-y-5 pb-10"
    >
      <DetailHeader
        career={career}
        matchPct={matchPct}
        hasResults={hasResults}
        navigate={navigate}
      />

      <RoadmapSection roadmap={roadmap} />

      {/* Salary + Skills side by side on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SalaryChart salary={salary} colors={colors} />
        <SkillsCard  skills={skills} />
      </div>

      {/* Exams + Colleges side by side on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <EntranceExams exams={entranceExams} />
        <TopColleges   colleges={topColleges} />
      </div>

      <DayInLife   text={dayInTheLife} />
      <FutureOutlook text={futureOutlook} />

      {/* Related careers */}
      {relatedCareers.length > 0 && (
        <div>
          <h2 className="font-sans font-semibold text-sm text-ink mb-3">You Might Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {relatedCareers.map(c => (
              <RelatedCareerCard key={c.id} career={c} hasResults={hasResults} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
