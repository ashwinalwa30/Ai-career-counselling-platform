/*
  Results.jsx — Aptitude test results page, inside DashboardLayout.
  Loads the scored result from api.getResults on mount.
  If no test has been taken, shows an encouraging empty state.
  Otherwise renders:
    1. ResultsHeader  — large animated score ring, date, personality summary
    2. SectionRadarChart — Recharts Radar of the four cognitive sections
    3. SectionBarChart   — horizontal bars coloured by strength vs weakness
    4. RiasecSection     — bar chart of all 6 types + an explanation card each
*/
import { useState, useEffect } from 'react'
import { Link }                from 'react-router-dom'
import { motion }              from 'framer-motion'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  ResponsiveContainer,
} from 'recharts'
import { ClipboardList, ChevronRight } from 'lucide-react'

import { getResults } from '../services/api'
import { useTheme }   from '../context/ThemeContext'

// ── Static data ───────────────────────────────────────────────────────────────

/*
  RIASEC_INFO — metadata for each personality type used in the summary
  headline and in the explanation cards below the bar chart.
*/
const RIASEC_INFO = {
  R: {
    label:      'Realistic',
    shortTrait: 'practical',
    trait:      'practical and hands-on',
    desc:       'You enjoy working with tools, machines and nature. Building and fixing physical things energises you.',
  },
  I: {
    label:      'Investigative',
    shortTrait: 'analytical',
    trait:      'curious and analytical',
    desc:       'You love researching, experimenting and solving complex problems. Science and maths come naturally.',
  },
  A: {
    label:      'Artistic',
    shortTrait: 'creative',
    trait:      'creative and expressive',
    desc:       'You thrive in design, writing, music and the arts. Original ideas and self-expression drive your best work.',
  },
  S: {
    label:      'Social',
    shortTrait: 'empathetic',
    trait:      'empathetic and collaborative',
    desc:       'You enjoy teaching, counselling and working with people. Helping others grow motivates you.',
  },
  E: {
    label:      'Enterprising',
    shortTrait: 'entrepreneurial',
    trait:      'ambitious and entrepreneurial',
    desc:       'You are drawn to leadership, business and persuasion. Starting and driving projects is your strength.',
  },
  C: {
    label:      'Conventional',
    shortTrait: 'organised',
    trait:      'organised and detail-oriented',
    desc:       'You excel at structured tasks, data and systems. Accuracy and reliability define your work style.',
  },
}

/*
  CHART_COLORS — explicit hex values for Recharts SVG elements per theme.
  Recharts renders inside <svg> and cannot read Tailwind classes or CSS
  variables, so we maintain both palettes here and pass the right one down.
*/
const CHART_COLORS = {
  light: {
    teal:       '#0F5C52',
    marigold:   '#E3A23B',
    terracotta: '#C2593F',
    edge:       '#E4DDD1',
    muted:      '#6B645C',
    ink:        '#1C1917',
  },
  dark: {
    teal:       '#5FBFAE',
    marigold:   '#EDB04F',
    terracotta: '#D9765C',
    edge:       '#2E302C',
    muted:      '#A39C90',
    ink:        '#EDE8DF',
  },
}

const SECTION_LABELS = {
  logical_reasoning: 'Logical',
  numerical_ability: 'Numerical',
  verbal_ability:    'Verbal',
  spatial_reasoning: 'Spatial',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

/*
  buildPersonalitySummary — composes the one-line headline from the top 2
  RIASEC types, e.g. "You're an Investigative–Artistic thinker: analytical and creative."
*/
function buildPersonalitySummary(topTypes) {
  const [t1, t2] = topTypes
  const i1 = RIASEC_INFO[t1]
  const i2 = RIASEC_INFO[t2]
  if (!i1 || !i2) return ''
  return `You're a ${i1.label}–${i2.label} thinker: ${i1.shortTrait} and ${i2.shortTrait}.`
}

/*
  ringColour — picks the score ring's stroke colour based on performance level.
  Returns a hex string from the active palette so it works in <svg>.
*/
function ringColour(score, colors) {
  if (score >= 70) return colors.teal
  if (score >= 40) return colors.marigold
  return colors.terracotta
}

// ── Custom Recharts tooltip ────────────────────────────────────────────────────

/*
  ChartTooltip — a themed tooltip rendered as a React node (outside the SVG)
  so it can use Tailwind classes and therefore adapts to light/dark mode.
*/
function ChartTooltip({ active, payload, label, suffix = '%' }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface border border-edge rounded-lg px-3 py-2 shadow-md">
      <p className="text-[11px] font-sans text-muted mb-0.5">{label}</p>
      <p className="text-sm font-mono font-bold text-ink">
        {payload[0].value}{suffix}
      </p>
    </div>
  )
}

// ── Score ring ─────────────────────────────────────────────────────────────────

/*
  ScoreRing — an animated SVG donut that fills to the student's overall score.
  Animates from empty to the actual score via a CSS transition on strokeDashoffset.
*/
function ScoreRing({ score, colors }) {
  const R  = 52
  const SW = 9
  const C  = 2 * Math.PI * R   // ≈ 326.7

  // Animate: start fully empty, then fill to actual score after mount
  const [dashOffset, setDashOffset] = useState(C)
  useEffect(() => {
    const id = setTimeout(() => setDashOffset(C * (1 - score / 100)), 150)
    return () => clearTimeout(id)
  }, [score, C])

  const col = ringColour(score, colors)

  return (
    <svg width={130} height={130} className="flex-shrink-0" aria-label={`Overall score: ${score} percent`}>
      {/* Track */}
      <circle cx={65} cy={65} r={R} fill="none" stroke={colors.edge} strokeWidth={SW} />
      {/* Filled arc */}
      <circle
        cx={65} cy={65} r={R}
        fill="none"
        stroke={col}
        strokeWidth={SW}
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={dashOffset}
        style={{
          transform:       'rotate(-90deg)',
          transformOrigin: '65px 65px',
          transition:      'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)',
        }}
      />
      {/* Score number */}
      <text x={65} y={58} textAnchor="middle" dominantBaseline="middle"
        style={{ fill: col, fontSize: 26, fontWeight: 700, fontFamily: 'ui-monospace,monospace' }}>
        {score}
      </text>
      <text x={65} y={79} textAnchor="middle" dominantBaseline="middle"
        style={{ fill: colors.muted, fontSize: 10, fontFamily: 'sans-serif' }}>
        out of 100
      </text>
    </svg>
  )
}

// ── Results header ─────────────────────────────────────────────────────────────

/*
  ResultsHeader — score ring on the left, date + personality summary on the right.
  The coloured badge below the summary reflects the student's performance level.
*/
function ResultsHeader({ result, colors }) {
  const { overallScore, topTypes, completedAt } = result
  const summary = buildPersonalitySummary(topTypes)

  const badgeCls = overallScore >= 70
    ? 'bg-teal/10 text-teal'
    : overallScore >= 40
      ? 'bg-marigold/10 text-marigold'
      : 'bg-terracotta/10 text-terracotta'

  return (
    <div className="bg-surface border border-edge rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
      <ScoreRing score={overallScore} colors={colors} />

      <div className="flex-1 text-center sm:text-left">
        <p className="text-xs font-sans text-muted mb-2">
          Completed on {formatDate(completedAt)}
        </p>
        <h2 className="font-serif text-xl font-semibold text-ink leading-snug mb-3">
          {summary}
        </h2>
        <span className={`inline-block text-xs font-sans font-semibold px-2.5 py-1 rounded-full ${badgeCls}`}>
          Overall score: {overallScore}%
        </span>
      </div>
    </div>
  )
}

// ── Section radar chart ────────────────────────────────────────────────────────

/*
  SectionRadarChart — visualises all four section scores as a filled polygon.
  Quick read: a wider, more "filled" shape means more balanced performance.
*/
function SectionRadarChart({ sectionScores, colors }) {
  const data = Object.entries(sectionScores).map(([id, score]) => ({
    section: SECTION_LABELS[id] ?? id,
    score,
  }))

  return (
    <div className="bg-surface border border-edge rounded-xl p-5">
      <h3 className="font-sans font-semibold text-sm text-ink mb-4">Aptitude Profile</h3>
      <ResponsiveContainer width="100%" height={240}>
        <RadarChart cx="50%" cy="50%" outerRadius="68%" data={data}>
          <PolarGrid stroke={colors.edge} />
          <PolarAngleAxis
            dataKey="section"
            tick={{ fill: colors.muted, fontSize: 11, fontFamily: 'sans-serif' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            dataKey="score"
            stroke={colors.teal}
            fill={colors.teal}
            fillOpacity={0.22}
            animationBegin={0}
            animationDuration={900}
          />
          <Tooltip content={<ChartTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Section bar chart ──────────────────────────────────────────────────────────

/*
  SectionBarChart — horizontal bars let the student compare all four sections
  at a glance.  Strength bars are teal; areas to improve are marigold.
*/
function SectionBarChart({ sectionScores, strengths, colors }) {
  const data = Object.entries(sectionScores).map(([id, score]) => ({
    section:    SECTION_LABELS[id] ?? id,
    score,
    isStrength: strengths.includes(id),
  }))

  return (
    <div className="bg-surface border border-edge rounded-xl p-5">
      <h3 className="font-sans font-semibold text-sm text-ink mb-4">Section Scores</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart layout="vertical" data={data} margin={{ left: 0, right: 28 }}>
          <CartesianGrid horizontal={false} stroke={colors.edge} strokeDasharray="3 3" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: colors.muted, fontSize: 10, fontFamily: 'sans-serif' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="section"
            width={78}
            tick={{ fill: colors.ink, fontSize: 11, fontFamily: 'sans-serif' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: colors.edge, opacity: 0.35 }} />
          <Bar dataKey="score" radius={[0, 4, 4, 0]} animationBegin={0} animationDuration={800}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.isStrength ? colors.teal : colors.marigold} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Colour legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-edge">
        <div className="flex items-center gap-1.5 text-[10px] font-sans text-muted">
          <span className="w-3 h-3 rounded-sm" style={{ background: colors.teal }} />
          Strength
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-sans text-muted">
          <span className="w-3 h-3 rounded-sm" style={{ background: colors.marigold }} />
          Area to improve
        </div>
      </div>
    </div>
  )
}

// ── RIASEC type card ───────────────────────────────────────────────────────────

/*
  RiasecTypeCard — explanation card for one RIASEC type.
  Rank 0 (top match) gets a teal ring; rank 1 gets marigold; others are neutral.
*/
function RiasecTypeCard({ typeCode, typeInfo, rank }) {
  const isFirst = rank === 0
  const isSecond = rank === 1
  const isTop   = isFirst || isSecond

  return (
    <div className={`
      rounded-xl border p-4
      ${isFirst  ? 'bg-teal/5 border-teal/25' :
        isSecond ? 'bg-marigold/5 border-marigold/25' :
        'bg-surface border-edge'}
    `}>
      <div className="flex items-start gap-3">
        <span className={`
          flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
          text-sm font-sans font-bold
          ${isFirst  ? 'bg-teal text-white' :
            isSecond ? 'bg-marigold text-ink' :
            'bg-edge text-muted'}
        `}>
          {typeCode}
        </span>

        <div className="min-w-0">
          <div className="flex items-center flex-wrap gap-1.5 mb-1">
            <p className={`font-sans font-semibold text-sm ${isTop ? 'text-ink' : 'text-muted'}`}>
              {typeInfo.label}
            </p>
            {isFirst && (
              <span className="text-[9px] font-sans font-bold px-1.5 py-0.5 rounded-full bg-teal/15 text-teal uppercase tracking-wide">
                Top match
              </span>
            )}
            {isSecond && (
              <span className="text-[9px] font-sans font-bold px-1.5 py-0.5 rounded-full bg-marigold/15 text-marigold uppercase tracking-wide">
                2nd match
              </span>
            )}
          </div>
          <p className="text-xs font-sans text-muted leading-relaxed">
            {typeInfo.desc}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── RIASEC section ─────────────────────────────────────────────────────────────

/*
  RiasecSection — bar chart of all 6 RIASEC scores (top 2 highlighted) plus
  an explanation card for every type below.
*/
function RiasecSection({ riasecScores, topTypes, colors }) {
  const riasecData = Object.entries(riasecScores).map(([type, score]) => ({
    type,
    score,
    rank: topTypes.indexOf(type),   // -1 if not in top 2
  }))

  return (
    <div className="bg-surface border border-edge rounded-xl p-5">
      <h3 className="font-sans font-semibold text-sm text-ink mb-1">
        Interest Profile — RIASEC Types
      </h3>
      <p className="text-xs font-sans text-muted mb-5">
        Your choices in the interest profile map to six career personality types.
        The taller the bar, the more that type describes you.
      </p>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={riasecData} margin={{ top: 4 }}>
          <CartesianGrid vertical={false} stroke={colors.edge} strokeDasharray="3 3" />
          <XAxis
            dataKey="type"
            tick={{ fill: colors.muted, fontSize: 11, fontFamily: 'sans-serif' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 12]}
            tick={{ fill: colors.muted, fontSize: 10, fontFamily: 'sans-serif' }}
            axisLine={false}
            tickLine={false}
            width={22}
          />
          <Tooltip
            content={({ active, payload, label }) => (
              <ChartTooltip
                active={active}
                payload={payload}
                label={RIASEC_INFO[label]?.label ?? label}
                suffix=" pts"
              />
            )}
            cursor={{ fill: colors.edge, opacity: 0.35 }}
          />
          <Bar dataKey="score" radius={[4, 4, 0, 0]} animationBegin={0} animationDuration={800}>
            {riasecData.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.rank === 0 ? colors.teal    :
                  entry.rank === 1 ? colors.marigold :
                  colors.edge
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Explanation cards — 2-column on sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
        {riasecData.map(({ type, rank }) => (
          <RiasecTypeCard
            key={type}
            typeCode={type}
            typeInfo={RIASEC_INFO[type]}
            rank={rank}
          />
        ))}
      </div>
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────────

/*
  EmptyState — shown when getResults returns null (test not yet taken).
*/
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y:  0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center text-center py-24 gap-5"
    >
      <div className="w-16 h-16 rounded-2xl bg-teal/10 flex items-center justify-center">
        <ClipboardList size={28} className="text-teal" />
      </div>
      <div>
        <h2 className="font-serif text-xl font-semibold text-ink mb-2">No results yet</h2>
        <p className="font-sans text-sm text-muted max-w-xs">
          Complete the aptitude test to see your scores, personality type and
          personalised career recommendations.
        </p>
      </div>
      <Link
        to="/dashboard/test"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal text-white font-sans font-semibold text-sm hover:bg-teal-dark transition-colors"
      >
        Take the test
        <ChevronRight size={15} />
      </Link>
    </motion.div>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

/*
  ResultsSkeleton — block placeholders shown while the data is loading.
*/
function ResultsSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-pulse">
      <div className="bg-surface border border-edge rounded-xl h-36" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-surface border border-edge rounded-xl h-72" />
        <div className="bg-surface border border-edge rounded-xl h-72" />
      </div>
      <div className="bg-surface border border-edge rounded-xl h-96" />
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

/*
  Results — the main exported page component, rendered inside DashboardLayout.
  Calls getResults on mount and passes the result down to sub-components.
*/
export default function Results() {
  const { theme } = useTheme()
  const colors    = CHART_COLORS[theme]

  // undefined = still loading; null = no test taken; object = results ready
  const [result, setResult] = useState(undefined)
  const [error,  setError]  = useState(null)

  useEffect(() => {
    getResults()
      .then(res => setResult(res.data.result))
      .catch(err => setError(err.message))
  }, [])

  if (result === undefined) return <ResultsSkeleton />

  if (error) return (
    <div className="py-16 text-center font-sans text-sm text-error">{error}</div>
  )

  if (!result) return <EmptyState />

  const { sectionScores, riasecScores, topTypes, strengths } = result

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y:  0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto space-y-5"
    >
      <ResultsHeader result={result} colors={colors} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SectionRadarChart sectionScores={sectionScores} colors={colors} />
        <SectionBarChart   sectionScores={sectionScores} strengths={strengths} colors={colors} />
      </div>

      <RiasecSection riasecScores={riasecScores} topTypes={topTypes} colors={colors} />
    </motion.div>
  )
}
