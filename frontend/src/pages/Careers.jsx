/*
  Careers.jsx — career recommendations page at /dashboard/careers.
  Calls getRecommendations on mount to get careers with match percentages.
  If no test has been taken, careers are shown without match % and a banner
  prompts the student to take the aptitude test first.

  Features:
    — Live search (title, stream, description, skills)
    — Stream filter chips
    — Sort: best match / salary high→low / A–Z
    — Compare checkbox on each card (max 2) + floating compare bar
*/
import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link }            from 'react-router-dom'
import { motion, AnimatePresence }      from 'framer-motion'
import { Search, X, ChevronRight, GitCompare } from 'lucide-react'

import { getRecommendations } from '../services/api'
import usePageTitle            from '../hooks/usePageTitle'

// ── Helpers ───────────────────────────────────────────────────────────────────

/*
  formatSalary — converts a raw INR amount into a compact readable label.
  e.g. 400000 → "4L",  1500000 → "15L",  10000000 → "1.0Cr"
*/
function formatSalary(value) {
  if (value >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`
  if (value >= 100000)   return `${Math.round(value / 100000)}L`
  return `${Math.round(value / 1000)}K`
}

/*
  matchStroke — returns the CSS custom property string for the ring stroke.
  Keeps colour consistent with the Results page (teal / marigold / terracotta).
*/
function matchStroke(pct) {
  if (pct >= 70) return 'var(--teal)'
  if (pct >= 40) return 'var(--marigold)'
  return 'var(--terracotta)'
}

// ── Match ring (card-sized) ────────────────────────────────────────────────────

/*
  MatchRing — compact 48×48 SVG donut used inside each career card.
  Uses CSS custom properties so it auto-switches in dark mode without needing
  the CHART_COLORS lookup table required by Recharts SVG elements.
*/
function MatchRing({ pct }) {
  const r  = 18
  const sw = 4
  const C  = 2 * Math.PI * r   // ≈ 113.1
  const stroke = matchStroke(pct)

  return (
    <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
      <svg width={48} height={48} aria-label={`${pct}% match`}>
        {/* Track */}
        <circle cx={24} cy={24} r={r} fill="none" stroke="var(--edge)" strokeWidth={sw} />
        {/* Fill */}
        <circle
          cx={24} cy={24} r={r}
          fill="none"
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct / 100)}
          style={{ stroke, transform: 'rotate(-90deg)', transformOrigin: '24px 24px' }}
        />
        <text
          x={24} y={24}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: 10, fontWeight: 700, fontFamily: 'ui-monospace,monospace', fill: stroke }}
        >
          {pct}%
        </text>
      </svg>
      <span className="text-[9px] font-sans text-muted">match</span>
    </div>
  )
}

// ── Career card ────────────────────────────────────────────────────────────────

/*
  CareerCard — one tile in the recommendations grid.
  Shows the match ring only when hasResults is true.
  The Compare checkbox is disabled when 2 different careers are already selected.
*/
function CareerCard({ career, hasResults, isCompared, onToggleCompare, compareDisabled }) {
  const { id, title, stream, icon, description, skills, salary, matchPct } = career

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`
        bg-surface rounded-xl border p-4 flex flex-col gap-3
        hover:shadow-sm transition-shadow duration-150
        ${isCompared ? 'border-teal ring-1 ring-teal/30' : 'border-edge'}
      `}
    >
      {/* Header: icon + title + stream badge + match ring */}
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none flex-shrink-0 mt-0.5" aria-hidden="true">
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-sans font-semibold text-sm text-ink leading-tight">{title}</p>
          <span className="inline-block mt-1 text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-teal/10 text-teal">
            {stream}
          </span>
        </div>
        {hasResults && matchPct != null && <MatchRing pct={matchPct} />}
      </div>

      {/* Description — clamped to 2 lines */}
      <p className="text-xs font-sans text-muted leading-relaxed line-clamp-2 flex-1">
        {description}
      </p>

      {/* Entry-level salary */}
      <p className="text-xs font-sans text-muted">
        <span className="font-semibold text-ink">
          ₹{formatSalary(salary.entry.min)}–{formatSalary(salary.entry.max)}
        </span>
        {' '}p.a. · Entry level
      </p>

      {/* Top 3 skill chips */}
      <div className="flex flex-wrap gap-1.5">
        {skills.slice(0, 3).map(skill => (
          <span
            key={skill}
            className="text-[10px] font-sans font-medium px-2 py-0.5 rounded-full bg-edge text-muted"
          >
            {skill}
          </span>
        ))}
      </div>

      {/* Footer: compare checkbox + view link */}
      <div className="flex items-center justify-between pt-2 border-t border-edge">
        <label
          className={`flex items-center gap-1.5 select-none
            ${compareDisabled && !isCompared ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <input
            type="checkbox"
            checked={isCompared}
            onChange={() => onToggleCompare(id)}
            disabled={compareDisabled && !isCompared}
            className="w-3.5 h-3.5 accent-teal cursor-pointer"
          />
          <span className="text-[11px] font-sans text-muted">Compare</span>
        </label>

        <Link
          to={`/dashboard/careers/${id}`}
          className="inline-flex items-center gap-1 text-xs font-sans font-semibold text-teal hover:text-teal-dark transition-colors"
        >
          View details
          <ChevronRight size={12} />
        </Link>
      </div>
    </motion.div>
  )
}

// ── No-test banner ─────────────────────────────────────────────────────────────

/*
  NoTestBanner — explains that match % requires the aptitude test.
  Shown at the top of the page when hasResults is false.
*/
function NoTestBanner() {
  return (
    <div className="flex items-center gap-4 bg-marigold/10 border border-marigold/25 rounded-xl px-5 py-4 flex-wrap">
      <span className="text-2xl flex-shrink-0" aria-hidden="true">🎯</span>
      <div className="flex-1 min-w-0">
        <p className="font-sans font-semibold text-sm text-ink">
          Take the aptitude test to see your match percentages
        </p>
        <p className="text-xs font-sans text-muted mt-0.5">
          Careers are sorted A–Z for now. Your results will personalise the ranking.
        </p>
      </div>
      <Link
        to="/dashboard/test"
        className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-marigold text-ink text-xs font-sans font-semibold hover:bg-marigold-dk transition-colors"
      >
        Take test <ChevronRight size={13} />
      </Link>
    </div>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

/*
  CareersSkeleton — pulse placeholders while recommendations load.
*/
function CareersSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-5 px-4 sm:px-6 pt-6">
      <div className="h-16 bg-edge rounded-xl animate-pulse" />
      <div className="h-10 bg-edge rounded-xl animate-pulse" />
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-7 w-24 bg-edge rounded-full animate-pulse flex-shrink-0" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-56 bg-surface border border-edge rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  )
}

// ── Floating compare bar ───────────────────────────────────────────────────────

/*
  CompareBar — fixed bottom bar that appears when 1 or 2 careers are selected.
  At 2 selections the Compare button activates and navigates to /dashboard/compare.
*/
function CompareBar({ compareList, careers, onClear, onCompare }) {
  const names = compareList.map(id => careers.find(c => c.id === id)?.title ?? id)

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0,  opacity: 1 }}
      exit={{    y: 80, opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-surface border border-edge rounded-xl shadow-xl px-5 py-3 w-[calc(100vw-2rem)] max-w-sm"
    >
      <GitCompare size={16} className="text-teal flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <p className="text-xs font-sans font-semibold text-ink truncate">
          {names.length === 2 ? `${names[0]} vs ${names[1]}` : names[0]}
        </p>
        {compareList.length < 2 && (
          <p className="text-[10px] font-sans text-muted">Select one more career to compare</p>
        )}
      </div>

      {compareList.length === 2 && (
        <button
          onClick={onCompare}
          className="flex-shrink-0 inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-teal text-white text-xs font-sans font-semibold hover:bg-teal-dark transition-colors cursor-pointer"
        >
          Compare <ChevronRight size={12} />
        </button>
      )}

      <button
        onClick={onClear}
        aria-label="Clear comparison selection"
        className="flex-shrink-0 p-1 rounded-md text-muted hover:text-error hover:bg-edge transition-colors cursor-pointer"
      >
        <X size={14} />
      </button>
    </motion.div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: 'match',  label: 'Best match'           },
  { value: 'salary', label: 'Salary (high to low)'  },
  { value: 'az',     label: 'A–Z'                   },
]

/*
  Careers — the main recommendations page component.
  Loads data on mount, applies client-side search, stream filter and sort,
  and manages the compare selection state.
*/
export default function Careers() {
  usePageTitle('Career Recommendations')
  const navigate = useNavigate()

  const [allCareers,   setAllCareers]   = useState([])
  const [hasResults,   setHasResults]   = useState(false)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)

  const [search,       setSearch]       = useState('')
  const [activeStream, setActiveStream] = useState(null)   // null = show all streams
  const [sortBy,       setSortBy]       = useState('match')

  const [compareList,  setCompareList]  = useState([])     // at most 2 career ids

  useEffect(() => {
    getRecommendations()
      .then(res => {
        setAllCareers(res.data.careers)
        setHasResults(res.data.hasResults)
        // Fall back to A–Z when no test results exist
        if (!res.data.hasResults) setSortBy('az')
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  // Unique stream names derived from loaded data
  const streams = useMemo(
    () => [...new Set(allCareers.map(c => c.stream))].sort(),
    [allCareers]
  )

  // Apply search, filter and sort to produce the visible list
  const filtered = useMemo(() => {
    let list = [...allCareers]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.stream.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.skills.some(s => s.toLowerCase().includes(q))
      )
    }

    if (activeStream) {
      list = list.filter(c => c.stream === activeStream)
    }

    if (sortBy === 'match' && hasResults) {
      list.sort((a, b) => (b.matchPct ?? 0) - (a.matchPct ?? 0))
    } else if (sortBy === 'salary') {
      list.sort((a, b) => b.salary.mid.min - a.salary.mid.min)
    } else {
      list.sort((a, b) => a.title.localeCompare(b.title))
    }

    return list
  }, [allCareers, search, activeStream, sortBy, hasResults])

  function toggleCompare(id) {
    setCompareList(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)          // deselect
        : prev.length < 2                      // only add if under the limit
          ? [...prev, id]
          : prev
    )
  }

  if (loading) return <CareersSkeleton />
  if (error)   return <div className="py-16 text-center font-sans text-sm text-error">{error}</div>

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-28 px-4 sm:px-6 pt-6">

      {!hasResults && <NoTestBanner />}

      {/* Search + Sort row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search careers, skills…"
            className="w-full pl-9 pr-9 py-2.5 text-sm font-sans bg-surface border border-edge rounded-lg text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="relative flex-shrink-0">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="py-2.5 pl-3 pr-8 text-sm font-sans bg-surface border border-edge rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal cursor-pointer"
          >
            {SORT_OPTIONS.map(opt => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.value === 'match' && !hasResults}
              >
                {opt.value === 'match' && !hasResults
                  ? 'Best match (take test first)'
                  : opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stream filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mb-1" role="group" aria-label="Filter by stream">
        <button
          onClick={() => setActiveStream(null)}
          className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-sans font-semibold transition-colors cursor-pointer
            ${!activeStream
              ? 'bg-teal text-white'
              : 'bg-surface border border-edge text-muted hover:text-ink hover:border-teal/40'}`}
        >
          All ({allCareers.length})
        </button>
        {streams.map(stream => {
          const count    = allCareers.filter(c => c.stream === stream).length
          const isActive = activeStream === stream
          return (
            <button
              key={stream}
              onClick={() => setActiveStream(isActive ? null : stream)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-sans font-semibold transition-colors cursor-pointer whitespace-nowrap
                ${isActive
                  ? 'bg-teal text-white'
                  : 'bg-surface border border-edge text-muted hover:text-ink hover:border-teal/40'}`}
            >
              {stream} ({count})
            </button>
          )
        })}
      </div>

      {/* Result count */}
      <p className="text-xs font-sans text-muted">
        {filtered.length} career{filtered.length !== 1 ? 's' : ''}
        {activeStream ? ` in ${activeStream}` : ''}
        {search.trim() ? ` matching "${search.trim()}"` : ''}
      </p>

      {/* Career grid or empty state */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center space-y-2">
          <p className="font-sans font-semibold text-ink">No careers found</p>
          <p className="text-sm font-sans text-muted">Try a different search term or clear the filters.</p>
          <button
            onClick={() => { setSearch(''); setActiveStream(null) }}
            className="mt-2 text-xs font-sans font-semibold text-teal hover:text-teal-dark cursor-pointer underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((career, i) => (
            <motion.div
              key={career.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(i * 0.04, 0.3) }}
            >
              <CareerCard
                career={career}
                hasResults={hasResults}
                isCompared={compareList.includes(career.id)}
                onToggleCompare={toggleCompare}
                compareDisabled={compareList.length >= 2}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Floating compare bar — appears when at least 1 career is selected */}
      <AnimatePresence>
        {compareList.length > 0 && (
          <CompareBar
            compareList={compareList}
            careers={allCareers}
            onClear={() => setCompareList([])}
            onCompare={() => navigate(`/dashboard/compare?ids=${compareList.join(',')}`)}
          />
        )}
      </AnimatePresence>

    </div>
  )
}
