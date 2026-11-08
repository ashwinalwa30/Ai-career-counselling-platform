/*
  Testimonials — a simple carousel of quotes from a student, parent and teacher.
  Framer Motion AnimatePresence handles the fade-slide transition between slides.
  Dots and arrow buttons allow manual navigation; no auto-advance (user controls).
*/
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const TESTIMONIALS = [
  {
    quote:  "I had no idea what to do after board exams. PathFinder's test showed me I'd actually be great at law. That one result changed everything for me.",
    name:   'Priya Sharma',
    role:   'Class 12 student, Delhi',
    avatar: 'PS',
    color:  'bg-teal/15 text-teal',
  },
  {
    quote:  "As parents, we always worry about pushing our children in the wrong direction. PathFinder gave us a way to have that conversation using data, not assumptions.",
    name:   'Rajesh Mehta',
    role:   'Father of a Class 11 student, Pune',
    avatar: 'RM',
    color:  'bg-marigold/15 text-marigold',
  },
  {
    quote:  "I recommend PathFinder to every student before they come to me for counselling. It saves time and gives students the language to describe what they actually want.",
    name:   'Anitha Krishnan',
    role:   'Career Counsellor, DPS Coimbatore',
    avatar: 'AK',
    color:  'bg-terracotta/15 text-terracotta',
  },
  {
    quote:  "My parents wanted me to take Science. After the test, we all saw I'm more suited for Design. PathFinder helped me convince them, not just argue with them.",
    name:   'Arjun Patel',
    role:   'Class 10 student, Ahmedabad',
    avatar: 'AP',
    color:  'bg-teal/15 text-teal',
  },
]

function Testimonials() {
  const [current, setCurrent] = useState(0)

  function prev() {
    setCurrent(i => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)
  }
  function next() {
    setCurrent(i => (i + 1) % TESTIMONIALS.length)
  }

  const t = TESTIMONIALS[current]

  return (
    <section className="bg-surface border-t border-b border-edge py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Section heading */}
        <motion.div
          className="text-center max-w-xl mx-auto mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl font-semibold text-ink mb-4">
            Heard from real families
          </h2>
          <p className="text-muted font-sans text-base">
            Students, parents and teachers share what changed when they had the right information.
          </p>
        </motion.div>

        {/* Carousel */}
        <div className="max-w-2xl mx-auto">

          {/* Quote card — AnimatePresence fades out old card, fades in new one */}
          <div className="relative min-h-[220px] flex items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0  }}
                exit={{    opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="w-full bg-paper border border-edge rounded-xl p-8 md:p-10"
              >
                {/* Decorative opening quote in marigold */}
                <span
                  aria-hidden="true"
                  className="font-serif text-6xl text-marigold leading-none block -mb-4"
                >
                  &ldquo;
                </span>

                {/* Quote text — Fraunces italic for warmth */}
                <p className="font-serif text-lg sm:text-xl italic text-ink leading-relaxed mb-6">
                  {t.quote}
                </p>

                {/* Author row */}
                <div className="flex items-center gap-3">
                  {/* Initials avatar */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold font-sans shrink-0 ${t.color}`}
                    aria-hidden="true"
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-ink text-sm">{t.name}</p>
                    <p className="text-xs text-muted font-sans">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation: prev arrow · dots · next arrow */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={prev}
              aria-label="Previous testimonial"
              className="w-9 h-9 rounded-full border border-edge flex items-center justify-center text-muted hover:text-ink hover:border-teal hover:text-teal transition-colors duration-150 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Dot indicators */}
            <div className="flex gap-2" role="tablist" aria-label="Testimonial slides">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={i === current}
                  aria-label={`Go to testimonial ${i + 1}`}
                  onClick={() => setCurrent(i)}
                  className={`
                    w-2 h-2 rounded-full transition-all duration-200 cursor-pointer
                    ${i === current ? 'bg-teal w-5' : 'bg-edge hover:bg-muted'}
                  `}
                />
              ))}
            </div>

            <button
              onClick={next}
              aria-label="Next testimonial"
              className="w-9 h-9 rounded-full border border-edge flex items-center justify-center text-muted hover:text-ink hover:border-teal hover:text-teal transition-colors duration-150 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

        </div>
      </div>
    </section>
  )
}

export default Testimonials
