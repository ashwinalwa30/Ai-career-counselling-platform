/*
  Hero — the first section visitors see on the landing page.
  Left: Fraunces serif headline, sub-copy, two CTAs, trust chips.
  Right: three floating solid-surface cards (radar chart, match card, roadmap).
  Staggered Framer Motion entrance on the left; continuous float on the right.
*/
import { motion } from 'framer-motion'
import { CheckCircle, Clock, BookOpen, Globe, ArrowRight, TrendingUp, MapPin } from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts'

import Button          from '../ui/Button'
import { useLanguage } from '../../context/LanguageContext'

// Mock aptitude scores for the decorative radar chart
const APTITUDE_DATA = [
  { subject: 'Logic',    score: 88 },
  { subject: 'Creative', score: 65 },
  { subject: 'Social',   score: 54 },
  { subject: 'Tech',     score: 93 },
  { subject: 'Verbal',   score: 72 },
]

const ROADMAP_STEPS = [
  { label: 'Maths & Science focus',   done: true  },
  { label: 'JEE / CUET entrance',     done: false },
  { label: 'B.Tech Computer Science', done: false },
]

// Stagger parent: each child fades up one after another
const containerVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.11, delayChildren: 0.1 } },
}

const itemVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}

const illustrationVariants = {
  hidden:  { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0,  transition: { duration: 0.65, delay: 0.25, ease: [0.22, 1, 0.36, 1] } },
}

/*
  FloatingCard — solid surface card that gently bobs up and down.
  amplitude controls travel distance; delay staggers the phase.
*/
function FloatingCard({ children, className = '', delay = 0, amplitude = 9, duration = 4 }) {
  return (
    <motion.div
      className={`bg-surface border border-edge rounded-lg shadow-md ${className}`}
      animate={{ y: [0, -amplitude, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  )
}

function Hero() {
  const { t } = useLanguage()

  const TRUST_CHIPS = [
    { icon: CheckCircle, label: t('hero_chip_free')    },
    { icon: Clock,       label: t('hero_chip_time')    },
    { icon: BookOpen,    label: t('hero_chip_careers') },
    { icon: Globe,       label: t('hero_chip_lang')    },
  ]

  return (
    <section id="home" className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">

        {/* ── LEFT: text content ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-start gap-6"
        >
          {/* Simple category label — not a glowing badge, just a small tag */}
          <motion.div variants={itemVariants}>
            <span className="inline-block text-xs font-semibold tracking-wide text-teal border border-teal/25 bg-teal/5 px-3 py-1 rounded-md font-sans">
              {t('hero_label')}
            </span>
          </motion.div>

          {/* Headline in Fraunces serif — h1 inherits font-serif from base styles */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold text-ink leading-tight"
          >
            {t('hero_headline')}{' '}
            <span className="relative inline whitespace-nowrap">
              {t('hero_highlight')}
              {/*
                Hand-drawn SVG underline in marigold.
                preserveAspectRatio="none" stretches it to match text width.
              */}
              <svg
                aria-hidden="true"
                className="absolute -bottom-2 left-0 w-full overflow-visible"
                height="10"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
              >
                <path
                  d="M1 7 C18 3, 36 9, 54 5 C72 1, 86 7, 99 5"
                  stroke="var(--marigold)"
                  strokeWidth="2.8"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </motion.h1>

          {/* Sub-copy */}
          <motion.p variants={itemVariants} className="text-base text-muted leading-relaxed max-w-lg font-sans">
            {t('hero_subtext')}
          </motion.p>

          {/* CTA buttons */}
          <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
            <Button size="lg">
              {t('hero_cta_primary')}
              <ArrowRight size={17} />
            </Button>
            <Button variant="outline" size="lg">
              {t('hero_cta_outline')}
            </Button>
          </motion.div>

          {/* Trust chips */}
          <motion.ul variants={itemVariants} className="flex flex-wrap gap-x-5 gap-y-2" role="list">
            {TRUST_CHIPS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-1.5 text-sm text-muted font-sans">
                <Icon size={13} className="text-success shrink-0" />
                {label}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        {/* ── RIGHT: floating illustration ── */}
        <motion.div
          variants={illustrationVariants}
          initial="hidden"
          animate="visible"
          className="relative h-[420px] md:h-[480px] w-full max-w-[460px] mx-auto lg:mx-0 lg:ml-auto"
        >
          {/* Subtle warm tint behind the cards */}
          <div
            aria-hidden="true"
            className="absolute inset-10 rounded-full bg-marigold/5 blur-3xl"
          />

          {/* Card 1: Aptitude radar chart — top-left */}
          <FloatingCard delay={0} duration={4.2} className="absolute top-4 left-0 p-4 w-52">
            <p className="text-xs font-semibold text-ink font-sans mb-1 flex items-center gap-1.5">
              <TrendingUp size={12} className="text-teal" />
              Aptitude Profile
            </p>
            {/* Fixed-size chart — decorative, not interactive */}
            <RadarChart
              width={176}
              height={148}
              data={APTITUDE_DATA}
              margin={{ top: 4, right: 8, bottom: 4, left: 8 }}
            >
              {/* Grid and axis colours reference CSS vars for dark mode */}
              <PolarGrid stroke="var(--edge)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fontSize: 9, fill: 'var(--muted)', fontFamily: 'var(--font-sans)' }}
              />
              <Radar
                dataKey="score"
                stroke="var(--teal)"
                fill="var(--teal)"
                fillOpacity={0.2}
                strokeWidth={1.5}
              />
            </RadarChart>
          </FloatingCard>

          {/* Card 2: Top career match — top-right */}
          <FloatingCard delay={0.9} duration={3.7} amplitude={7} className="absolute top-10 right-0 p-4 w-48">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-terracotta uppercase tracking-wide font-sans">
                Top Match
              </span>
              <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full font-sans">
                92%
              </span>
            </div>
            <p className="font-semibold text-ink text-base leading-tight mb-0.5 font-serif">
              Data Scientist
            </p>
            <p className="text-xs text-muted font-sans mb-3">Technology · High demand</p>
            {/* Compatibility progress bar */}
            <div className="w-full h-1.5 rounded-full bg-edge overflow-hidden">
              <div className="h-full rounded-full bg-teal" style={{ width: '92%' }} />
            </div>
          </FloatingCard>

          {/* Card 3: Roadmap steps — bottom centre */}
          <FloatingCard delay={1.5} duration={4.9} amplitude={6} className="absolute bottom-4 left-8 right-8 p-4">
            <p className="text-xs font-semibold text-ink font-sans mb-3 flex items-center gap-1.5">
              <MapPin size={12} className="text-marigold" />
              Your Roadmap · Data Science
            </p>
            <ol className="flex flex-col gap-2.5">
              {ROADMAP_STEPS.map((step, index) => (
                <li key={step.label} className="flex items-center gap-2.5">
                  <span
                    className={`
                      shrink-0 w-5 h-5 rounded-full flex items-center justify-center
                      text-xs font-bold font-sans
                      ${step.done
                        ? 'bg-teal text-white'
                        : 'border border-edge text-muted'}
                    `}
                  >
                    {step.done ? '✓' : index + 1}
                  </span>
                  <span
                    className={`text-xs font-sans ${step.done
                      ? 'text-muted line-through'
                      : 'text-ink font-medium'
                    }`}
                  >
                    {step.label}
                  </span>
                </li>
              ))}
            </ol>
          </FloatingCard>
        </motion.div>

      </div>
    </section>
  )
}

export default Hero
