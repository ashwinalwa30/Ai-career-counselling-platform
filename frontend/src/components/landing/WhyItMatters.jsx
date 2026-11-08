/*
  WhyItMatters — three stat cards that frame the problem facing Indian students,
  followed by context text. Numbers are illustrative; a small note says so.
*/
import { motion } from 'framer-motion'
import { GraduationCap, Users, AlertCircle } from 'lucide-react'

const STATS = [
  {
    number: '93%',
    label: 'of students choose their stream without any professional career guidance',
    icon: GraduationCap,
    iconColor: 'text-terracotta',
    iconBg:    'bg-terracotta/10',
  },
  {
    number: '1 : 500+',
    label: 'ratio of career counsellors to students in most Indian government schools',
    icon: Users,
    iconColor: 'text-marigold',
    iconBg:    'bg-marigold/10',
  },
  {
    number: '71%',
    label: 'of graduates feel their degree does not match their actual interests',
    icon: AlertCircle,
    iconColor: 'text-teal',
    iconBg:    'bg-teal/10',
  },
]

// Reusable animation for each card as it enters the viewport
const cardVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

function WhyItMatters() {
  return (
    <section className="bg-surface border-t border-b border-edge py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Section heading */}
        <motion.div
          className="max-w-2xl mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl font-semibold text-ink mb-4">
            Career guidance that every student deserves
          </h2>
          <p className="text-muted text-base leading-relaxed font-sans">
            In India, the pressure to pick the "right" stream after Class 10 is enormous —
            yet most students make that decision without data, tools, or trained support.
            PathFinder exists to close that gap.
          </p>
        </motion.div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.number}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: i * 0.1 }}
              className="bg-paper border border-edge rounded-lg p-6 flex flex-col gap-4"
            >
              {/* Icon badge */}
              <span className={`inline-flex w-10 h-10 rounded-lg ${stat.iconBg} items-center justify-center`}>
                <stat.icon size={18} className={stat.iconColor} />
              </span>

              {/* Big stat number */}
              <p className={`font-serif text-4xl font-semibold leading-none ${stat.iconColor}`}>
                {stat.number}
              </p>

              {/* Description */}
              <p className="text-sm text-muted font-sans leading-relaxed">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Disclaimer note */}
        <p className="mt-5 text-xs text-muted font-sans">
          * Figures are illustrative, based on publicly available surveys and reports.
        </p>

      </div>
    </section>
  )
}

export default WhyItMatters
