/*
  CareerCompare.jsx — side-by-side comparison of exactly 2 careers at /dashboard/compare.
  Reads ?ids=id1,id2 from the URL (set by CompareBar in Careers.jsx).
  Highlights the "winner" on every numeric field (match %, salary tiers).
*/
import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams }         from 'react-router-dom'
import { motion }                        from 'framer-motion'
import { ArrowLeft, Trophy, ChevronRight, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

import { getCareerById, getRecommendations } from '../services/api'
import { useTheme }                           from '../context/ThemeContext'
import usePageTitle                            from '../hooks/usePageTitle'

// ── Colour helpers ─────────────────────────────────────────────────────────────

/*
  CHART_COLORS — hex values for Recharts SVG elements that cannot read CSS vars.
  Mirrors the design tokens in index.css.
*/
const CHART_COLORS = {
  light: { teal: '#0F5C52', marigold: '#E3A23B', edge: '#E4DDD1', muted: '#6B645C' },
  dark:  { teal: '#5FBFAE', marigold: '#EDB04F', edge: '#2E302C', muted: '#A39C90' },
}

function formatSalary(value) {
  if (value >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`
  if (value >= 100000)   return `${Math.round(value / 100000)}L`
  return `${Math.round(value / 1000)}K`
}

/*
  avgSalary — returns the midpoint of a salary band.
  Used to compare salary levels numerically and decide the winner.
*/
function avgSalary(band) {
  return (band.min + band.max) / 2
}

// ── Match ring (small SVG donut) ───────────────────────────────────────────────

/*
  MatchRing — compact SVG ring showing match % with colour coding.
  Uses CSS custom properties directly so it auto-switches in dark mode.
*/
function MatchRing({ pct }) {
  if (pct == null) return null
  const r = 22, cx = 28, cy = 28
  const circumference = 2 * Math.PI * r
  const filled        = (pct / 100) * circumference
  const colour = pct >= 70 ? 'var(--teal)' : pct >= 45 ? 'var(--marigold)' : 'var(--terracotta)'
  return (
    <svg width={56} height={56} viewBox="0 0 56 56" className="flex-shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--edge)" strokeWidth={5} />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke={colour} strokeWidth={5}
        strokeDasharray={`${filled} ${circumference - filled}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
        fill={colour} fontSize={11} fontWeight={700} fontFamily="Plus Jakarta Sans, sans-serif">
        {pct}%
      </text>
    </svg>
  )
}

// ── Winner badge ───────────────────────────────────────────────────────────────

/*
  WinnerBadge — small trophy chip shown on the winning side of a comparison row.
*/
function WinnerBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-sans font-semibold
      px-2 py-0.5 rounded-full bg-marigold/15 text-marigold-dk">
      <Trophy size={9} /> Winner
    </span>
  )
}

// ── Salary mini-chart ──────────────────────────────────────────────────────────

/*
  SalaryMiniChart — a small horizontal bar chart showing entry/mid/senior salary
  ranges for one career. Each bar is an invisible base + a coloured range stacked.
*/
function SalaryMiniChart({ salary, color }) {
  const data = [
    { label: 'Entry',  base: salary.entry.min,  range: salary.entry.max  - salary.entry.min  },
    { label: 'Mid',    base: salary.mid.min,     range: salary.mid.max    - salary.mid.min    },
    { label: 'Senior', base: salary.senior.min,  range: salary.senior.max - salary.senior.min },
  ]

  return (
    <ResponsiveContainer width="100%" height={90}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 8, top: 4, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis dataKey="label" type="category" width={42}
          tick={{ fontSize: 10, fontFamily: 'Plus Jakarta Sans, sans-serif', fill: color.muted }} />
        <Tooltip
          cursor={false}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            const entry = data.find(d => d.label === label)
            if (!entry) return null
            const min = entry.base
            const max = entry.base + entry.range
            return (
              <div className="bg-surface border border-edge rounded-lg px-2.5 py-1.5 text-xs font-sans text-ink shadow-sm">
                <p className="font-semibold">{label}</p>
                <p className="text-muted">₹{formatSalary(min)} – ₹{formatSalary(max)}</p>
              </div>
            )
          }}
        />
        <Bar dataKey="base" stackId="s" fill="transparent" />
        <Bar dataKey="range" stackId="s" fill={color.teal} radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Comparison row ─────────────────────────────────────────────────────────────

/*
  CompareRow — one labelled row with two cells side by side.
  winnerIdx = 0 or 1 to show the trophy on the winning side; null means tie/no winner.
*/
function CompareRow({ label, left, right, winnerIdx = null, fullWidth = false }) {
  return (
    <div className="border-b border-edge last:border-0">
      {/* Row label */}
      <p className="px-4 pt-3 text-[10px] font-sans font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <div className={`grid grid-cols-2 gap-px ${fullWidth ? '' : 'divide-x divide-edge'}`}>
        {[left, right].map((content, idx) => (
          <div key={idx} className={`px-4 pb-3 pt-1.5 ${winnerIdx === idx ? 'bg-marigold/5' : ''}`}>
            {content}
            {winnerIdx === idx && <div className="mt-1.5"><WinnerBadge /></div>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function CompareSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-5 animate-pulse pb-10 px-4 sm:px-6 pt-6">
      <div className="h-8 w-24 bg-edge rounded-md" />
      <div className="bg-surface border border-edge rounded-xl overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-edge">
          {[0, 1].map(i => (
            <div key={i} className="p-5 space-y-3">
              <div className="h-6 w-8 bg-edge rounded" />
              <div className="h-5 w-32 bg-edge rounded" />
              <div className="h-4 w-20 bg-edge rounded-full" />
              <div className="h-14 bg-edge rounded" />
            </div>
          ))}
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border-t border-edge grid grid-cols-2 divide-x divide-edge">
            {[0, 1].map(j => (
              <div key={j} className="p-4 space-y-1.5">
                <div className="h-3 w-16 bg-edge rounded" />
                <div className="h-5 w-24 bg-edge rounded" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

/*
  CareerCompare — main page component.
  Reads two career IDs from the URL, fetches them in parallel alongside
  the recommendations list to get match percentages, then renders each
  comparison field in a two-column layout with winner highlighting.
*/
export default function CareerCompare() {
  usePageTitle('Compare Careers')
  const [searchParams]              = useSearchParams()
  const { theme }                   = useTheme()
  const colors                      = CHART_COLORS[theme] ?? CHART_COLORS.light

  const ids = useMemo(() => {
    const raw = searchParams.get('ids') ?? ''
    return raw.split(',').map(s => s.trim()).filter(Boolean).slice(0, 2)
  }, [searchParams])

  const [careers,  setCareers]  = useState([null, null])
  const [matchMap, setMatchMap] = useState({})
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    if (ids.length < 2) {
      setError('Please select exactly 2 careers to compare.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Fetch both careers and the recommendations list in parallel
    Promise.all([
      getCareerById(ids[0]),
      getCareerById(ids[1]),
      getRecommendations(),
    ])
      .then(([r0, r1, recs]) => {
        setCareers([r0.data.career, r1.data.career])
        // Build a quick id → matchPct lookup
        const map = {}
        recs.data.careers.forEach(c => { if (c.matchPct != null) map[c.id] = c.matchPct })
        setMatchMap(map)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [ids])

  if (loading) return <CompareSkeleton />

  if (error || careers[0] == null || careers[1] == null) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 flex flex-col items-center gap-4">
        <AlertTriangle size={32} className="text-error" />
        <p className="font-sans text-sm text-ink text-center">{error ?? 'Could not load careers.'}</p>
        <Link
          to="/dashboard/careers"
          className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-teal hover:text-teal-dark"
        >
          <ArrowLeft size={12} /> Back to careers
        </Link>
      </div>
    )
  }

  const [a, b] = careers

  // Helper: returns 0 if a wins, 1 if b wins, null if equal
  function winner(valA, valB) {
    if (valA === valB) return null
    return valA > valB ? 0 : 1
  }

  const matchA   = matchMap[a.id] ?? null
  const matchB   = matchMap[b.id] ?? null
  const matchWin = (matchA != null && matchB != null) ? winner(matchA, matchB) : null

  const entryWin  = winner(avgSalary(a.salary.entry),  avgSalary(b.salary.entry))
  const midWin    = winner(avgSalary(a.salary.mid),    avgSalary(b.salary.mid))
  const seniorWin = winner(avgSalary(a.salary.senior), avgSalary(b.salary.senior))

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-10 px-4 sm:px-6 py-6">

      {/* Back link */}
      <Link
        to="/dashboard/careers"
        className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-muted hover:text-ink transition-colors"
      >
        <ArrowLeft size={12} /> Back to careers
      </Link>

      {/* Page title */}
      <div>
        <h1 className="font-serif text-xl font-semibold text-ink">Compare Careers</h1>
        <p className="text-xs font-sans text-muted mt-0.5">Side-by-side breakdown to help you decide.</p>
      </div>

      {/* Main comparison card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-surface border border-edge rounded-xl overflow-hidden"
      >

        {/* Header row — icon, title, stream, match ring */}
        <div className="grid grid-cols-2 divide-x divide-edge">
          {[a, b].map((career, idx) => (
            <div key={career.id} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-3xl leading-none" aria-hidden="true">{career.icon}</span>
                  <h2 className="mt-2 font-sans font-bold text-sm text-ink leading-snug">{career.title}</h2>
                  <span className="inline-block mt-1 text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-teal/10 text-teal">
                    {career.stream}
                  </span>
                </div>
                {(matchA != null || matchB != null) && (
                  <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                    <MatchRing pct={idx === 0 ? matchA : matchB} />
                    <span className="text-[10px] font-sans text-muted">match</span>
                  </div>
                )}
              </div>
              <p className="mt-2.5 text-xs font-sans text-muted leading-relaxed line-clamp-3">
                {career.description}
              </p>
              <Link
                to={`/dashboard/careers/${career.id}`}
                className="mt-3 inline-flex items-center gap-1 text-xs font-sans font-semibold text-teal hover:text-teal-dark transition-colors"
              >
                Full details <ChevronRight size={11} />
              </Link>
            </div>
          ))}
        </div>

        {/* Match % row */}
        {(matchA != null || matchB != null) && (
          <CompareRow
            label="Match with you"
            winnerIdx={matchWin}
            left={
              matchA != null
                ? <p className="font-sans font-bold text-lg text-ink">{matchA}%</p>
                : <p className="font-sans text-xs text-muted">Take the test to see</p>
            }
            right={
              matchB != null
                ? <p className="font-sans font-bold text-lg text-ink">{matchB}%</p>
                : <p className="font-sans text-xs text-muted">Take the test to see</p>
            }
          />
        )}

        {/* Salary charts */}
        <div className="border-b border-edge">
          <p className="px-4 pt-3 text-[10px] font-sans font-semibold uppercase tracking-wide text-muted">
            Salary at a glance
          </p>
          <div className="grid grid-cols-2 divide-x divide-edge pb-2">
            {[a, b].map(career => (
              <div key={career.id} className="px-2">
                <SalaryMiniChart salary={career.salary} color={colors} />
              </div>
            ))}
          </div>
        </div>

        {/* Entry salary */}
        <CompareRow
          label="Entry salary (per year)"
          winnerIdx={entryWin}
          left={
            <p className="font-sans text-sm font-semibold text-ink">
              ₹{formatSalary(a.salary.entry.min)}–{formatSalary(a.salary.entry.max)}
            </p>
          }
          right={
            <p className="font-sans text-sm font-semibold text-ink">
              ₹{formatSalary(b.salary.entry.min)}–{formatSalary(b.salary.entry.max)}
            </p>
          }
        />

        {/* Mid salary */}
        <CompareRow
          label="Mid-career salary"
          winnerIdx={midWin}
          left={
            <p className="font-sans text-sm font-semibold text-ink">
              ₹{formatSalary(a.salary.mid.min)}–{formatSalary(a.salary.mid.max)}
            </p>
          }
          right={
            <p className="font-sans text-sm font-semibold text-ink">
              ₹{formatSalary(b.salary.mid.min)}–{formatSalary(b.salary.mid.max)}
            </p>
          }
        />

        {/* Senior salary */}
        <CompareRow
          label="Senior salary"
          winnerIdx={seniorWin}
          left={
            <p className="font-sans text-sm font-semibold text-ink">
              ₹{formatSalary(a.salary.senior.min)}–{formatSalary(a.salary.senior.max)}
            </p>
          }
          right={
            <p className="font-sans text-sm font-semibold text-ink">
              ₹{formatSalary(b.salary.senior.min)}–{formatSalary(b.salary.senior.max)}
            </p>
          }
        />

        {/* Top skills */}
        <CompareRow
          label="Key skills"
          left={
            <div className="flex flex-wrap gap-1 mt-0.5">
              {a.skills.slice(0, 4).map(s => (
                <span key={s} className="text-[10px] font-sans font-medium px-1.5 py-0.5 rounded-md bg-edge text-ink">
                  {s}
                </span>
              ))}
            </div>
          }
          right={
            <div className="flex flex-wrap gap-1 mt-0.5">
              {b.skills.slice(0, 4).map(s => (
                <span key={s} className="text-[10px] font-sans font-medium px-1.5 py-0.5 rounded-md bg-edge text-ink">
                  {s}
                </span>
              ))}
            </div>
          }
        />

        {/* Entrance exams */}
        <CompareRow
          label="Key entrance exams"
          left={
            <ul className="space-y-1 mt-0.5">
              {a.entranceExams.slice(0, 3).map(e => (
                <li key={e.name} className="text-xs font-sans text-ink font-semibold leading-tight">
                  {e.name}
                  <span className="ml-1 font-normal text-muted">— {e.desc}</span>
                </li>
              ))}
              {a.entranceExams.length === 0 && (
                <li className="text-xs font-sans text-muted">No major exams required</li>
              )}
            </ul>
          }
          right={
            <ul className="space-y-1 mt-0.5">
              {b.entranceExams.slice(0, 3).map(e => (
                <li key={e.name} className="text-xs font-sans text-ink font-semibold leading-tight">
                  {e.name}
                  <span className="ml-1 font-normal text-muted">— {e.desc}</span>
                </li>
              ))}
              {b.entranceExams.length === 0 && (
                <li className="text-xs font-sans text-muted">No major exams required</li>
              )}
            </ul>
          }
        />

        {/* Top colleges */}
        <CompareRow
          label="Top colleges"
          left={
            <ul className="space-y-0.5 mt-0.5">
              {a.topColleges.slice(0, 3).map(c => (
                <li key={c} className="text-xs font-sans text-muted leading-tight">{c}</li>
              ))}
            </ul>
          }
          right={
            <ul className="space-y-0.5 mt-0.5">
              {b.topColleges.slice(0, 3).map(c => (
                <li key={c} className="text-xs font-sans text-muted leading-tight">{c}</li>
              ))}
            </ul>
          }
        />

        {/* Future outlook */}
        <CompareRow
          label="Future outlook"
          left={<p className="text-xs font-sans text-muted leading-relaxed mt-0.5 line-clamp-3">{a.futureOutlook}</p>}
          right={<p className="text-xs font-sans text-muted leading-relaxed mt-0.5 line-clamp-3">{b.futureOutlook}</p>}
        />

      </motion.div>

      {/* CTA — explore all or go back */}
      <div className="flex gap-3 flex-wrap">
        <Link
          to="/dashboard/explore"
          className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-teal hover:text-teal-dark transition-colors"
        >
          Browse all careers <ChevronRight size={12} />
        </Link>
        <Link
          to="/dashboard/careers"
          className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-muted hover:text-ink transition-colors"
        >
          My recommendations <ChevronRight size={12} />
        </Link>
      </div>

    </div>
  )
}
