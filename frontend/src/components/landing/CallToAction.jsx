/*
  CallToAction — the final section on the landing page.
  Solid deep-teal background draws attention; marigold button pops against it.
  bg-teal auto-switches: deep teal in light mode, vibrant teal in dark mode.
  text-paper also auto-switches: warm cream in light mode, warm charcoal in dark —
  which keeps readable contrast against teal in both modes.
*/
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'

function CallToAction() {
  return (
    <section className="bg-teal py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          className="max-w-2xl mx-auto text-center flex flex-col items-center gap-6"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Small label */}
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold font-sans tracking-wide text-paper/70 border border-paper/20 px-3 py-1 rounded-md">
            <Sparkles size={12} />
            Free for every student in India
          </span>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-paper leading-tight">
            Your career clarity starts with one test
          </h2>

          {/* Sub-copy */}
          <p className="text-base font-sans text-paper/75 leading-relaxed max-w-lg">
            15 minutes. No sign-up fee. No counsellor appointment needed. Just honest,
            AI-powered insight into what you're good at and where you could go.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {/* Marigold button — high contrast against deep teal */}
            <button className="inline-flex items-center gap-2 bg-marigold text-ink hover:bg-marigold-dk font-semibold px-6 py-2.5 rounded-lg transition-colors duration-150 cursor-pointer text-base">
              Take the free test
              <ArrowRight size={17} />
            </button>

            {/* Ghost button — paper-coloured outline on teal */}
            <button className="inline-flex items-center gap-2 border border-paper/30 text-paper hover:bg-paper/10 font-semibold px-6 py-2.5 rounded-lg transition-colors duration-150 cursor-pointer text-base font-sans">
              Explore careers
            </button>
          </div>

          {/* Trust note */}
          <p className="text-xs font-sans text-paper/50 pt-1">
            Available in Hindi & English · Class 8 to Class 12 · No app download needed
          </p>
        </motion.div>
      </div>
    </section>
  )
}

export default CallToAction
