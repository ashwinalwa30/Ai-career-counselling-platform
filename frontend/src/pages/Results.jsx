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
import { ClipboardList, ChevronRight, Printer } from 'lucide-react'

import { getResults, getRecommendations } from '../services/api'
import { useTheme }   from '../context/ThemeContext'
import { useAuth }    from '../context/AuthContext'
import usePageTitle    from '../hooks/usePageTitle'

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

/*
  SECTION_STRENGTH_NOTE — a short note shown on the strength card for each
  section, pointing the student toward careers that value that skill.
*/
const SECTION_STRENGTH_NOTE = {
  logical_reasoning: 'Your logical thinking is a strong asset. Careers in engineering, law and data analysis reward this skill directly.',
  numerical_ability: 'Your numerical confidence stands out. Finance, economics and technology rely heavily on this ability.',
  verbal_ability:    'Your verbal skills shine. Consider paths in writing, law, communication, education or content creation.',
  spatial_reasoning: 'Strong spatial sense is rare and valuable. Architecture, design, surgery and engineering all prize this skill.',
}

/*
  SECTION_TIPS — 3 concrete, actionable study habits per weak section.
  Practical and specific so the student can start today.
*/
const SECTION_TIPS = {
  logical_reasoning: [
    'Practise puzzle types like number series, analogies and syllogisms for 15 minutes every day.',
    'Solve one new riddle or brain-teaser each morning to sharpen pattern recognition.',
    'Work through past reasoning papers from exams like NTSE, KVPY or Olympiads.',
  ],
  numerical_ability: [
    'Practise mental maths daily: tables up to 25, percentage shortcuts and fraction conversions.',
    'Spend 10 minutes each day on speed maths apps or textbook exercise sets.',
    'Focus on profit-loss, ratio-proportion and time-work — the most common question types.',
  ],
  verbal_ability: [
    'Read one English article or editorial daily and note down any unfamiliar words.',
    'Build your vocabulary with 5 new words a day using flashcards or a vocab app.',
    'Practise fill-in-the-blank and sentence-correction exercises from previous exam papers.',
  ],
  spatial_reasoning: [
    'Sketch mirror images and rotated shapes with pen and paper to build visual thinking.',
    'Solve Rubik\'s cube or tangram puzzles — they sharpen mental rotation skills.',
    'Work through past spatial reasoning papers and re-draw each figure by hand.',
  ],
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

// ── Strengths & weaknesses ────────────────────────────────────────────────────

/*
  StrengthCard — teal-tinted card for one of the student's strong sections.
  Shows the section score and a note on which careers value this skill.
*/
function StrengthCard({ sectionId, score }) {
  return (
    <div className="bg-teal/5 border border-teal/20 rounded-xl p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="font-sans font-semibold text-sm text-ink">{SECTION_LABELS[sectionId]}</p>
        <span className="font-mono text-xs font-bold text-teal">{score}%</span>
      </div>
      <p className="text-xs font-sans text-muted leading-relaxed">
        {SECTION_STRENGTH_NOTE[sectionId]}
      </p>
    </div>
  )
}

/*
  ImprovementCard — marigold-tinted card for a section to work on.
  Lists 3 practical, specific habits the student can start today.
*/
function ImprovementCard({ sectionId, score }) {
  const tips = SECTION_TIPS[sectionId] ?? []
  return (
    <div className="bg-marigold/5 border border-marigold/20 rounded-xl p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="font-sans font-semibold text-sm text-ink">{SECTION_LABELS[sectionId]}</p>
        <span className="font-mono text-xs font-bold text-marigold">{score}%</span>
      </div>
      <ul className="space-y-2">
        {tips.map((tip, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-marigold/20 text-marigold flex items-center justify-center text-[9px] font-bold">
              {i + 1}
            </span>
            <p className="text-xs font-sans text-muted leading-relaxed">{tip}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

/*
  StrengthsWeaknessesSection — groups strength and improvement cards in one
  panel with a divider. Strength cards come first; improvement cards second.
*/
function StrengthsWeaknessesSection({ sectionScores, strengths, weaknesses }) {
  return (
    <div className="bg-surface border border-edge rounded-xl p-5 space-y-5">
      <div>
        <h3 className="font-sans font-semibold text-sm text-ink mb-3">Your Strengths</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {strengths.map(id => (
            <StrengthCard key={id} sectionId={id} score={sectionScores[id]} />
          ))}
        </div>
      </div>

      <div className="border-t border-edge" />

      <div>
        <h3 className="font-sans font-semibold text-sm text-ink mb-1">Areas to Improve</h3>
        <p className="text-xs font-sans text-muted mb-3">
          A few targeted habits make a big difference over time.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {weaknesses.map(id => (
            <ImprovementCard key={id} sectionId={id} score={sectionScores[id]} />
          ))}
        </div>
      </div>
    </div>
  )
}

/*
  CareerMatchesCTA — full-width teal banner at the bottom of the results page.
  Links the student to the Career Explorer once they have seen their scores.
*/
function CareerMatchesCTA() {
  return (
    <div className="bg-teal rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div>
        <h3 className="font-sans font-bold text-base text-white mb-1">
          Ready to explore your career matches?
        </h3>
        <p className="text-sm font-sans text-white/70">
          Your personality type and aptitude scores have been used to identify careers that suit you.
        </p>
      </div>
      <Link
        to="/dashboard/careers"
        className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-teal font-sans font-semibold text-sm hover:bg-teal-dark hover:text-white transition-colors whitespace-nowrap"
      >
        See career matches
        <ChevronRight size={15} />
      </Link>
    </div>
  )
}

// ── Print recommended next steps ──────────────────────────────────────────────

/*
  Fixed next steps shown in the printed report.
  These are the same actions every student should take after seeing results.
*/
const PRINT_NEXT_STEPS = [
  'Review your top career matches and shortlist 2–3 that excite you most.',
  'Research the entrance exams required for each of your shortlisted careers.',
  'Focus your Class 11–12 stream and subject choice on your strongest aptitude areas.',
  'Speak with a subject teacher or career counsellor about your results.',
  'Explore each career\'s full roadmap and college list in the Career Explorer.',
]

// ── Printable report ──────────────────────────────────────────────────────────

/*
  PrintableReport — a hidden div that is only visible when window.print() is called.
  Contains a clean, plain-text-friendly layout: student details, scores, RIASEC,
  top 5 career matches and next steps. No Recharts — just HTML percentage bars.
  Wrapped in class="print-only" so CSS hides it on screen and shows it in print.
*/
function PrintableReport({ result, topCareers, user }) {
  const { overallScore, sectionScores, riasecScores, topTypes, completedAt } = result

  const summary = buildPersonalitySummary(topTypes)

  return (
    <div className="print-only" id="print-report">

      {/* ── Header ── */}
      <div className="print-card" style={{ borderBottom: '2px solid #0F5C52', paddingBottom: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'serif', margin: '0 0 4px' }}>
              Career Assessment Report
            </p>
            <p style={{ fontSize: '12px', color: '#6B645C', margin: 0 }}>PathFinder · AI Career Counselling</p>
          </div>
          <p style={{ fontSize: '11px', color: '#6B645C', textAlign: 'right', margin: 0 }}>
            Completed on {formatDate(completedAt)}
          </p>
        </div>
      </div>

      {/* ── Student details ── */}
      <div className="print-card" style={{ background: '#F7F3EC', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '3px 8px 3px 0', color: '#6B645C', width: '120px' }}>Student</td>
              <td style={{ padding: '3px 0', fontWeight: 600, color: '#1C1917' }}>{user?.fullName ?? '—'}</td>
              <td style={{ padding: '3px 8px 3px 24px', color: '#6B645C', width: '100px' }}>Class</td>
              <td style={{ padding: '3px 0', fontWeight: 600, color: '#1C1917' }}>Class {user?.class ?? '—'} · {user?.board ?? '—'}</td>
            </tr>
            <tr>
              <td style={{ padding: '3px 8px 3px 0', color: '#6B645C' }}>School</td>
              <td style={{ padding: '3px 0', fontWeight: 600, color: '#1C1917' }}>{user?.schoolName ?? '—'}</td>
              <td style={{ padding: '3px 8px 3px 24px', color: '#6B645C' }}>State</td>
              <td style={{ padding: '3px 0', fontWeight: 600, color: '#1C1917' }}>{user?.state ?? '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Overall score ── */}
      <div className="print-card" style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
        {/* Score circle */}
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%', flexShrink: 0,
          border: '6px solid #0F5C52', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#0F5C52', lineHeight: 1 }}>{overallScore}</span>
          <span style={{ fontSize: '9px', color: '#6B645C' }}>/ 100</span>
        </div>
        <div>
          <p style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'serif', margin: '0 0 4px', color: '#1C1917' }}>
            Overall Score: {overallScore}%
          </p>
          <p style={{ fontSize: '12px', color: '#6B645C', margin: 0 }}>{summary}</p>
        </div>
      </div>

      {/* ── Aptitude section scores ── */}
      <div className="print-card" style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px', color: '#1C1917', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Aptitude Section Scores
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <tbody>
            {Object.entries(sectionScores).map(([id, score]) => (
              <tr key={id} style={{ borderBottom: '1px solid #E4DDD1' }}>
                <td style={{ padding: '7px 0', color: '#1C1917', fontWeight: 500, width: '180px' }}>
                  {SECTION_LABELS[id] ?? id}
                </td>
                <td style={{ padding: '7px 12px' }}>
                  {/* Visual percentage bar */}
                  <div style={{ background: '#E4DDD1', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                    <div style={{ background: '#0F5C52', height: '100%', width: `${score}%`, borderRadius: '4px' }} />
                  </div>
                </td>
                <td style={{ padding: '7px 0', textAlign: 'right', fontWeight: 700, color: '#0F5C52', width: '48px' }}>
                  {score}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── RIASEC profile ── */}
      <div className="print-card" style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px', color: '#1C1917', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          RIASEC Personality Profile
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {Object.entries(riasecScores).map(([type, score]) => {
            const rank    = topTypes.indexOf(type)
            const isTop1  = rank === 0
            const isTop2  = rank === 1
            const bgColor = isTop1 ? '#0F5C52' : isTop2 ? '#E3A23B' : '#E4DDD1'
            const txColor = isTop1 ? '#ffffff' : isTop2 ? '#1C1917' : '#6B645C'
            return (
              <div key={type} style={{
                padding: '8px 10px', borderRadius: '6px', background: bgColor,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '13px', color: txColor }}>
                    {type} — {RIASEC_INFO[type]?.label}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '12px', color: txColor }}>{score} pts</span>
                </div>
                <p style={{ margin: '3px 0 0', fontSize: '10px', color: isTop1 ? 'rgba(255,255,255,0.75)' : '#6B645C' }}>
                  {RIASEC_INFO[type]?.shortTrait}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Top 5 career matches ── */}
      {topCareers.length > 0 && (
        <div className="print-card" style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px', color: '#1C1917', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Top 5 Career Matches
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#F7F3EC' }}>
                <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: '#6B645C', borderBottom: '1px solid #E4DDD1' }}>Career</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: '#6B645C', borderBottom: '1px solid #E4DDD1' }}>Stream</th>
                <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: '#6B645C', borderBottom: '1px solid #E4DDD1' }}>Match</th>
              </tr>
            </thead>
            <tbody>
              {topCareers.map((career, i) => (
                <tr key={career.id} style={{ borderBottom: '1px solid #E4DDD1' }}>
                  <td style={{ padding: '7px 8px', fontWeight: 600, color: '#1C1917' }}>
                    {i + 1}. {career.title}
                  </td>
                  <td style={{ padding: '7px 8px', color: '#6B645C' }}>{career.stream}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700, color: '#0F5C52' }}>
                    {career.matchPct}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Recommended next steps ── */}
      <div className="print-card">
        <p style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px', color: '#1C1917', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Recommended Next Steps
        </p>
        <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#1C1917' }}>
          {PRINT_NEXT_STEPS.map((step, i) => (
            <li key={i} style={{ padding: '4px 0', lineHeight: 1.5, color: '#6B645C' }}>
              <span style={{ color: '#1C1917' }}>{step}</span>
            </li>
          ))}
        </ol>
        <p style={{ fontSize: '10px', color: '#6B645C', marginTop: '20px', borderTop: '1px solid #E4DDD1', paddingTop: '10px' }}>
          Generated by PathFinder · This report is for personal guidance only.
        </p>
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
    <div className="max-w-7xl mx-auto space-y-5 px-4 sm:px-6 py-6 animate-pulse">
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
  usePageTitle('Results')
  const { theme } = useTheme()
  const { user }  = useAuth()
  const colors    = CHART_COLORS[theme]

  // undefined = still loading; null = no test taken; object = results ready
  const [result,     setResult]     = useState(undefined)
  const [topCareers, setTopCareers] = useState([])
  const [error,      setError]      = useState(null)

  useEffect(() => {
    // Fetch results and recommendations in parallel
    Promise.all([getResults(), getRecommendations()])
      .then(([resResult, resRecs]) => {
        setResult(resResult.data.result)
        // Keep only top 5 matches that have a matchPct
        const withPct = resRecs.data.careers.filter(c => c.matchPct != null)
        setTopCareers(withPct.slice(0, 5))
      })
      .catch(err => setError(err.message))
  }, [])

  if (result === undefined) return <ResultsSkeleton />

  if (error) return (
    <div className="py-16 text-center font-sans text-sm text-error">{error}</div>
  )

  if (!result) return <EmptyState />

  const { sectionScores, riasecScores, topTypes, strengths, weaknesses } = result

  return (
    <>
      {/* ── On-screen results (hidden when printing) ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y:  0 }}
        transition={{ duration: 0.4 }}
        className="no-print max-w-7xl mx-auto space-y-5 px-4 sm:px-6 py-6"
      >
        {/* Page title + Download button */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-serif text-xl font-semibold text-ink">Your Results</h1>
            <p className="text-xs font-sans text-muted mt-0.5">
              Aptitude scores, personality profile and career matches.
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-edge text-sm font-sans font-semibold text-muted hover:text-ink hover:border-teal/40 transition-colors cursor-pointer"
          >
            <Printer size={14} />
            Download report
          </button>
        </div>

        <ResultsHeader result={result} colors={colors} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <SectionRadarChart sectionScores={sectionScores} colors={colors} />
          <SectionBarChart   sectionScores={sectionScores} strengths={strengths} colors={colors} />
        </div>

        <RiasecSection riasecScores={riasecScores} topTypes={topTypes} colors={colors} />

        <StrengthsWeaknessesSection
          sectionScores={sectionScores}
          strengths={strengths}
          weaknesses={weaknesses}
        />

        <CareerMatchesCTA />
      </motion.div>

      {/* ── Print-only report (hidden on screen, shown in print) ── */}
      <PrintableReport result={result} topCareers={topCareers} user={user} />
    </>
  )
}
