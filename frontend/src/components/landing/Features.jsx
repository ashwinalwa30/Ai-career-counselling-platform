/*
  Features — six capability cards arranged in a 3-column grid.
  Icon accent colours cycle through teal, marigold, and terracotta so the
  grid has visual rhythm without being monotonous. Each card lifts on hover.
*/
import { motion } from 'framer-motion'
import {
  ClipboardCheck, UserCircle2, MessageCircle,
  Map, Languages, FileBarChart2,
} from 'lucide-react'

const FEATURES = [
  {
    icon:        ClipboardCheck,
    title:       'Aptitude Test',
    description: 'Scientifically designed questions covering logical, verbal, numerical and spatial reasoning.',
    accent:      'teal',
  },
  {
    icon:        UserCircle2,
    title:       'RIASEC Personality',
    description: 'Discover your Holland Code and understand which career environments suit you best.',
    accent:      'marigold',
  },
  {
    icon:        MessageCircle,
    title:       'AI Counsellor',
    description: 'Chat in Hindi or English with an AI counsellor — anytime, without an appointment.',
    accent:      'terracotta',
  },
  {
    icon:        Map,
    title:       'Career Roadmaps',
    description: 'Step-by-step plans from your current class to your chosen career, including entrance exams.',
    accent:      'teal',
  },
  {
    icon:        Languages,
    title:       'Hindi & English',
    description: 'Every test, result, roadmap and report is fully available in both Hindi and English.',
    accent:      'marigold',
  },
  {
    icon:        FileBarChart2,
    title:       'Parent Report',
    description: 'A shareable PDF designed to help parents understand and support their child\'s path.',
    accent:      'terracotta',
  },
]

// Pre-built class strings — dynamic `text-${accent}` won't be purged by Tailwind
const ACCENT = {
  teal:       { bg: 'bg-teal/10',       text: 'text-teal',       border: 'hover:border-teal/40'       },
  marigold:   { bg: 'bg-marigold/10',   text: 'text-marigold',   border: 'hover:border-marigold/40'   },
  terracotta: { bg: 'bg-terracotta/10', text: 'text-terracotta', border: 'hover:border-terracotta/40' },
}

function FeatureCard({ feature, index }) {
  const a = ACCENT[feature.accent]

  return (
    <motion.div
      className={`
        group bg-surface border border-edge rounded-lg p-6
        transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md
        ${a.border}
      `}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.45, delay: index * 0.07 }}
    >
      {/* Icon badge */}
      <span className={`inline-flex w-10 h-10 rounded-lg ${a.bg} items-center justify-center mb-4`}>
        <feature.icon size={18} className={a.text} />
      </span>

      <h3 className="font-semibold text-ink text-base mb-1.5">{feature.title}</h3>
      <p className="text-sm text-muted font-sans leading-relaxed">{feature.description}</p>
    </motion.div>
  )
}

function Features() {
  return (
    <section className="bg-surface border-t border-b border-edge py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Section heading */}
        <motion.div
          className="max-w-xl mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl font-semibold text-ink mb-4">
            Everything a student needs
          </h2>
          <p className="text-muted text-base font-sans leading-relaxed">
            One platform built to guide students from confusion to clarity — no tuition
            centre, no expensive counsellor, no gatekeeping.
          </p>
        </motion.div>

        {/* Feature cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>

      </div>
    </section>
  )
}

export default Features
