/*
  HowItWorks — 4 numbered steps showing how PathFinder works.
  Mobile: vertical list with a connecting line running down the left.
  Desktop: 4-column grid with a horizontal line running through the step badges.
  id="how-it-works" so the navbar anchor link scrolls here.
*/
import { motion } from 'framer-motion'
import { UserCircle, ClipboardList, Sparkles, Map } from 'lucide-react'

const STEPS = [
  {
    number: '01',
    icon: UserCircle,
    title: 'Create your profile',
    description: 'Tell us your class, subjects, and interests in under two minutes.',
  },
  {
    number: '02',
    icon: ClipboardList,
    title: 'Take the aptitude test',
    description: 'A 15-minute test covering logical, verbal, numerical, and creative thinking.',
  },
  {
    number: '03',
    icon: Sparkles,
    title: 'Get your AI analysis',
    description: 'Our AI maps your unique profile to 100+ career fields with match scores.',
  },
  {
    number: '04',
    icon: Map,
    title: 'Follow your roadmap',
    description: 'Get a step-by-step guide from your current class to your chosen career.',
  },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-paper py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Section heading */}
        <motion.div
          className="max-w-xl mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl font-semibold text-ink mb-4">
            Four steps to your future
          </h2>
          <p className="text-muted text-base font-sans leading-relaxed">
            PathFinder takes you from "I don't know what to do" to a clear,
            personalised career plan — in one sitting.
          </p>
        </motion.div>

        {/* ── MOBILE layout: vertical list with connecting line ── */}
        <div className="lg:hidden flex flex-col">
          {STEPS.map((step, index) => (
            <motion.div
              key={step.number}
              className="relative flex gap-5 pb-10 last:pb-0"
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
            >
              {/* Vertical connector: runs from below badge to next step */}
              {index < STEPS.length - 1 && (
                <div
                  aria-hidden="true"
                  className="absolute left-6 top-14 bottom-0 w-px bg-edge"
                />
              )}

              {/* Step badge */}
              <div className="relative z-10 shrink-0 w-12 h-12 rounded-full bg-surface border-2 border-teal flex items-center justify-center shadow-sm">
                <span className="font-serif font-semibold text-teal">{step.number}</span>
              </div>

              {/* Step content */}
              <div className="pt-1 flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <step.icon size={15} className="text-teal shrink-0" />
                  <h3 className="font-semibold text-ink text-base">{step.title}</h3>
                </div>
                <p className="text-sm text-muted font-sans leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── DESKTOP layout: 4-column grid with horizontal connector ── */}
        <div className="hidden lg:block">
          <div className="relative">
            {/*
              Horizontal line sits behind the badges.
              top-6 = 24 px = centre of a 48 px (h-12) badge.
              left/right are set to 12.5 % — the centre of the first/last column
              in a 4-column layout (each column is 25 % wide).
            */}
            <div
              aria-hidden="true"
              className="absolute top-6 left-[12.5%] right-[12.5%] h-px bg-edge"
            />

            <div className="grid grid-cols-4 gap-6">
              {STEPS.map((step, index) => (
                <motion.div
                  key={step.number}
                  className="flex flex-col items-center text-center gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  {/* Badge sits on top of the connector line (z-10) */}
                  <div className="relative z-10 w-12 h-12 rounded-full bg-surface border-2 border-teal flex items-center justify-center shadow-sm">
                    <span className="font-serif font-semibold text-teal">{step.number}</span>
                  </div>

                  {/* Content below badge */}
                  <div>
                    <div className="flex items-center justify-center gap-1.5 mb-1.5">
                      <step.icon size={14} className="text-teal shrink-0" />
                      <h3 className="font-semibold text-ink text-base">{step.title}</h3>
                    </div>
                    <p className="text-sm text-muted font-sans leading-relaxed">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

export default HowItWorks
