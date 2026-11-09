/*
  CareerExplore.jsx — browse ALL 20 careers by stream at /dashboard/explore.
  Uses getCareers() which returns careers without match percentages, so it
  works without taking the aptitude test.

  Interaction model:
    "All" selected → careers appear under their stream section headers (grouped)
    Stream chip selected → flat grid of only that stream's careers
  A search bar filters within the current view.
*/
import { useState, useEffect, useMemo } from 'react'
import { Link }                          from 'react-router-dom'
import { motion }                        from 'framer-motion'
import { Search, X, ChevronRight }       from 'lucide-react'

import { getCareers } from '../services/api'
import usePageTitle   from '../hooks/usePageTitle'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatSalary(value) {
  if (value >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`
  if (value >= 100000)   return `${Math.round(value / 100000)}L`
  return `${Math.round(value / 1000)}K`
}

// ── Explore card ──────────────────────────────────────────────────────────────

/*
  ExploreCard — a compact career tile used in the grouped stream sections.
  Simpler than the Careers page card: no compare checkbox, no match ring.
*/
function ExploreCard({ career, index }) {
  const { id, icon, title, stream, description, salary } = career

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.25) }}
    >
      <Link
        to={`/dashboard/careers/${id}`}
        className="group flex flex-col gap-2.5 bg-surface border border-edge rounded-xl p-4 hover:border-teal/40 hover:shadow-sm transition-all h-full"
      >
        {/* Icon + title + stream */}
        <div className="flex items-start gap-2.5">
          <span className="text-2xl leading-none flex-shrink-0 mt-0.5" aria-hidden="true">{icon}</span>
          <div className="min-w-0">
            <p className="font-sans font-semibold text-sm text-ink leading-tight group-hover:text-teal transition-colors">
              {title}
            </p>
            <span className="inline-block mt-1 text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-teal/10 text-teal">
              {stream}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs font-sans text-muted leading-relaxed line-clamp-2 flex-1">
          {description}
        </p>

        {/* Entry salary + link */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-edge">
          <p className="text-xs font-sans text-muted">
            <span className="font-semibold text-ink">
              ₹{formatSalary(salary.entry.min)}–{formatSalary(salary.entry.max)}
            </span>
            {' '}entry
          </p>
          <span className="inline-flex items-center gap-0.5 text-xs font-sans font-semibold text-teal group-hover:gap-1.5 transition-all">
            Explore <ChevronRight size={12} />
          </span>
        </div>
      </Link>
    </motion.div>
  )
}

// ── Stream section ────────────────────────────────────────────────────────────

/*
  StreamSection — a labelled group of career cards for one stream.
  Used when "All" is selected so careers are visually organised by field.
*/
function StreamSection({ stream, careers }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="font-sans font-semibold text-sm text-ink">{stream}</h2>
        <span className="text-xs font-sans text-muted">{careers.length} career{careers.length !== 1 ? 's' : ''}</span>
        <div className="flex-1 h-px bg-edge" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {careers.map((career, i) => (
          <ExploreCard key={career.id} career={career} index={i} />
        ))}
      </div>
    </section>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ExploreSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 bg-edge rounded-xl" />
      <div className="flex gap-2">
        {[...Array(6)].map((_, i) => <div key={i} className="h-7 w-24 bg-edge rounded-full flex-shrink-0" />)}
      </div>
      {[...Array(2)].map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="h-5 w-32 bg-edge rounded-md" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="h-44 bg-surface border border-edge rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

/*
  CareerExplore — the main exported page component.
  Groups careers by stream when browsing all; filters to a flat list when a
  specific stream is selected.
*/
export default function CareerExplore() {
  usePageTitle('Career Explorer')
  const [allCareers,   setAllCareers]   = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)

  const [search,       setSearch]       = useState('')
  const [activeStream, setActiveStream] = useState(null)

  useEffect(() => {
    getCareers()
      .then(res => setAllCareers(res.data.careers))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  // Unique streams in sorted order
  const streams = useMemo(
    () => [...new Set(allCareers.map(c => c.stream))].sort(),
    [allCareers]
  )

  // Apply search, then optionally filter by active stream
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
    if (activeStream) list = list.filter(c => c.stream === activeStream)
    return list
  }, [allCareers, search, activeStream])

  // Build stream-grouped object for the "All" view
  const grouped = useMemo(() => {
    if (activeStream) return null
    const result = {}
    streams.forEach(stream => {
      const sc = filtered.filter(c => c.stream === stream)
      if (sc.length) result[stream] = sc
    })
    return result
  }, [filtered, activeStream, streams])

  if (loading) return <ExploreSkeleton />
  if (error)   return <div className="py-16 text-center font-sans text-sm text-error">{error}</div>

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-10 px-4 sm:px-6 py-6">

      {/* Intro + link to personalised recommendations */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-xl font-semibold text-ink">Career Explorer</h1>
          <p className="text-xs font-sans text-muted mt-0.5">
            Browse all {allCareers.length} careers by field — no test required.
          </p>
        </div>
        <Link
          to="/dashboard/careers"
          className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-teal hover:text-teal-dark transition-colors"
        >
          My recommendations <ChevronRight size={12} />
        </Link>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search careers, streams, skills…"
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

      {/* Stream filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mb-1">
        <button
          onClick={() => setActiveStream(null)}
          className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-sans font-semibold transition-colors cursor-pointer
            ${!activeStream ? 'bg-teal text-white' : 'bg-surface border border-edge text-muted hover:text-ink hover:border-teal/40'}`}
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
                ${isActive ? 'bg-teal text-white' : 'bg-surface border border-edge text-muted hover:text-ink hover:border-teal/40'}`}
            >
              {stream} ({count})
            </button>
          )
        })}
      </div>

      {/* Grouped view (All) or flat filtered view (stream selected) */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center space-y-2">
          <p className="font-sans font-semibold text-ink">No careers found</p>
          <p className="text-sm font-sans text-muted">Try a different search term.</p>
          <button
            onClick={() => { setSearch(''); setActiveStream(null) }}
            className="mt-2 text-xs font-sans font-semibold text-teal hover:text-teal-dark cursor-pointer underline"
          >
            Clear filters
          </button>
        </div>
      ) : grouped ? (
        // Grouped by stream
        <div className="space-y-8">
          {Object.entries(grouped).map(([stream, careers]) => (
            <StreamSection key={stream} stream={stream} careers={careers} />
          ))}
        </div>
      ) : (
        // Flat filtered list
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((career, i) => (
            <ExploreCard key={career.id} career={career} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
