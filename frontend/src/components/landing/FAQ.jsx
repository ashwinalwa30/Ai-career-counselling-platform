/*
  FAQ — six common questions in a single-open accordion.
  Framer Motion animates the answer panel height and rotates the chevron.
  id="faq" so the navbar anchor scrolls here.
*/
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  {
    question: 'Is PathFinder completely free?',
    answer:   'Yes — 100 % free for every Class 8–12 student across India. We believe career guidance should not depend on a family\'s income. The aptitude test, AI analysis, career roadmaps and counsellor chat are all free, with no hidden fees.',
  },
  {
    question: 'How long does the aptitude test take?',
    answer:   'About 15 minutes. The test has 60 adaptive questions covering logical reasoning, verbal ability, numerical aptitude and spatial thinking. You can pause and come back — your progress is saved.',
  },
  {
    question: 'Is my data safe and private?',
    answer:   'Yes. Your test results and profile are stored securely and are only visible to you. We do not sell data to third parties. You control what, if anything, is shared with your parents or school.',
  },
  {
    question: 'Can my parents see my results?',
    answer:   'Only if you choose to share them. After completing the test you can generate a "Parent Report" — a plain-language PDF designed to help parents understand and support your choices. Nothing is shared without your explicit action.',
  },
  {
    question: 'Does the test and guidance work in Hindi?',
    answer:   'Fully. The aptitude test, all results, career roadmaps, and the AI counsellor are available in both Hindi and English. You can switch language at any point from your dashboard.',
  },
  {
    question: 'How accurate are the career recommendations?',
    answer:   'Our AI is trained on thousands of career outcome profiles and validated against established psychometric frameworks like RIASEC and Holland Codes. No test is a crystal ball, but most students tell us the top results match what they already felt — PathFinder just gives them the words and confidence to act on it.',
  },
]

function FAQItem({ item, index, isOpen, onToggle }) {
  return (
    <div className="border-b border-edge last:border-0">
      {/* Question row — full-width click target */}
      <button
        onClick={() => onToggle(index)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-4 py-5 text-left cursor-pointer group"
      >
        <span className="font-semibold text-ink text-base group-hover:text-teal transition-colors duration-150">
          {item.question}
        </span>

        {/* Chevron rotates 180° when open */}
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
          className="shrink-0 text-muted group-hover:text-teal transition-colors duration-150"
          aria-hidden="true"
        >
          <ChevronDown size={18} />
        </motion.span>
      </button>

      {/* Answer panel — height animates from 0 to auto */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{    height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pb-5 pr-8 text-sm text-muted font-sans leading-relaxed">
              {item.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FAQ() {
  // Track which item is open; null means all closed
  const [openIndex, setOpenIndex] = useState(null)

  function toggle(index) {
    setOpenIndex(prev => (prev === index ? null : index))
  }

  return (
    <section id="faq" className="bg-paper py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Two-column layout on large screens: heading left, accordion right */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-12 lg:gap-20">

          {/* Left: heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5 }}
            className="lg:sticky lg:top-24 lg:self-start"
          >
            <h2 className="text-3xl sm:text-4xl font-semibold text-ink mb-4">
              Questions we get asked
            </h2>
            <p className="text-muted text-base font-sans leading-relaxed">
              Anything else on your mind? Chat with our AI counsellor or write to
              us at support@pathfinder.edu.
            </p>
          </motion.div>

          {/* Right: accordion list */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {FAQS.map((item, i) => (
              <FAQItem
                key={item.question}
                item={item}
                index={i}
                isOpen={openIndex === i}
                onToggle={toggle}
              />
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  )
}

export default FAQ
