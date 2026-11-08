/*
  CareerStreams — six stream cards with an icon, tagline and three sample careers.
  Mobile: horizontal snap-scroll so cards stay full-width and swipeable.
  Desktop: responsive grid. id="careers" so the navbar anchor works.
*/
import { motion } from 'framer-motion'
import { Atom, TrendingUp, BookOpen, Wrench, Palette, Trophy } from 'lucide-react'

const STREAMS = [
  {
    icon:        Atom,
    name:        'Science',
    tagline:     'Physics, Chemistry, Biology, Mathematics',
    careers:     ['Engineer', 'Doctor', 'Data Scientist'],
    accent:      'teal',
  },
  {
    icon:        TrendingUp,
    name:        'Commerce',
    tagline:     'Economics, Accountancy, Business Studies',
    careers:     ['Chartered Accountant', 'Investment Banker', 'Entrepreneur'],
    accent:      'marigold',
  },
  {
    icon:        BookOpen,
    name:        'Arts & Humanities',
    tagline:     'History, Political Science, Sociology',
    careers:     ['Civil Servant', 'Journalist', 'Lawyer'],
    accent:      'terracotta',
  },
  {
    icon:        Wrench,
    name:        'Vocational & Skills',
    tagline:     'ITI, Polytechnic, trade programmes',
    careers:     ['Electrician', 'Auto Technician', 'Web Developer'],
    accent:      'teal',
  },
  {
    icon:        Palette,
    name:        'Design & Creative',
    tagline:     'Fine Arts, Fashion, Architecture',
    careers:     ['UX Designer', 'Architect', 'Animator'],
    accent:      'marigold',
  },
  {
    icon:        Trophy,
    name:        'Sports',
    tagline:     'Athletics, coaching, sports science',
    careers:     ['Professional Athlete', 'Sports Coach', 'Physio'],
    accent:      'terracotta',
  },
]

// Explicit class strings — dynamic class building is not purged by Tailwind
const ACCENT = {
  teal:       { icon: 'text-teal',       bg: 'bg-teal/10',       pill: 'bg-teal/8 text-teal'             },
  marigold:   { icon: 'text-marigold',   bg: 'bg-marigold/10',   pill: 'bg-marigold/8 text-marigold'     },
  terracotta: { icon: 'text-terracotta', bg: 'bg-terracotta/10', pill: 'bg-terracotta/8 text-terracotta' },
}

function StreamCard({ stream, className = '' }) {
  const a = ACCENT[stream.accent]
  return (
    <div
      className={`
        bg-surface border border-edge rounded-lg p-5
        flex flex-col gap-4
        transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md
        ${className}
      `}
    >
      {/* Icon */}
      <span className={`inline-flex w-10 h-10 rounded-lg ${a.bg} items-center justify-center`}>
        <stream.icon size={18} className={a.icon} />
      </span>

      {/* Name + tagline */}
      <div>
        <h3 className="font-semibold text-ink text-base mb-1">{stream.name}</h3>
        <p className="text-xs text-muted font-sans leading-relaxed">{stream.tagline}</p>
      </div>

      {/* Sample career pills */}
      <div className="flex flex-wrap gap-1.5 mt-auto">
        {stream.careers.map(c => (
          <span key={c} className={`text-xs font-sans font-medium px-2.5 py-1 rounded-full ${a.pill}`}>
            {c}
          </span>
        ))}
      </div>
    </div>
  )
}

function CareerStreams() {
  return (
    <section id="careers" className="bg-paper py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Section heading */}
        <motion.div
          className="max-w-xl mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl font-semibold text-ink mb-4">
            Every path has a place here
          </h2>
          <p className="text-muted text-base font-sans leading-relaxed">
            PathFinder covers all six major career streams recognised in Indian
            secondary education — from Science and Commerce to Sports and
            Vocational trades.
          </p>
        </motion.div>

        {/*
          Mobile: horizontal snap-scroll (-mx-4 px-4 bleeds to screen edge).
          Desktop: 3-column grid.
          Tailwind lets us switch display: flex → display: grid with md:grid.
        */}
        <div className="
          flex flex-row gap-4 overflow-x-auto pb-4
          snap-x snap-mandatory scroll-smooth
          -mx-4 px-4
          md:mx-0 md:px-0 md:grid md:grid-cols-2 md:overflow-visible md:pb-0
          lg:grid-cols-3
        ">
          {STREAMS.map((stream, i) => (
            <motion.div
              key={stream.name}
              className="snap-start shrink-0 w-[272px] md:w-auto"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: i * 0.07 }}
            >
              <StreamCard stream={stream} className="h-full" />
            </motion.div>
          ))}
        </div>

        {/* Mobile scroll hint */}
        <p className="mt-4 text-xs text-muted font-sans text-center md:hidden">
          Swipe to see all streams →
        </p>

      </div>
    </section>
  )
}

export default CareerStreams
