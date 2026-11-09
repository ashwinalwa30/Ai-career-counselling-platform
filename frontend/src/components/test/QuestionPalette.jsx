/*
  QuestionPalette — numbered map of all 36 questions with colour-coded status.
  Desktop: exported as PalettePanel, rendered in a sticky aside by TestPage.
  Mobile: exported as MobilePaletteDrawer — a floating trigger button opens a
  slide-up drawer.
  Clicking any numbered button jumps to that question via TestContext.goToIndex.
*/
import { useState }             from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, LayoutGrid }        from 'lucide-react'

import { useTest } from '../../context/TestContext'

// ── Status → style mapping ────────────────────────────────────────────────────
/*
  Five mutually exclusive visual states in priority order:
    1. current         — teal outline, white bg
    2. answered+marked — teal bg with marigold dot overlay
    3. answered        — solid teal bg
    4. marked only     — marigold bg
    5. not answered    — neutral grey
*/
function buttonStyle(isCurrent, isAnswered, isMarked) {
  if (isCurrent)  return 'bg-surface border-2 border-teal text-teal'
  if (isAnswered) return 'bg-teal text-white'      // dot added separately when also marked
  if (isMarked)   return 'bg-marigold text-ink'
  return 'bg-edge text-muted hover:bg-muted/20'
}

// ── PaletteButton ─────────────────────────────────────────────────────────────
/*
  One numbered button per question. The marigold dot appears on top-right corner
  only when the question is both answered AND marked for review.
*/
function PaletteButton({ number, isCurrent, isAnswered, isMarked, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={`Question ${number}${isCurrent ? ' — current' : ''}`}
      aria-current={isCurrent ? 'true' : undefined}
      className={`
        relative w-8 h-8 rounded-md text-xs font-sans font-bold flex items-center
        justify-center cursor-pointer transition-colors duration-100
        ${buttonStyle(isCurrent, isAnswered, isMarked)}
      `}
    >
      {number}
      {/* Marigold dot: only when answered AND marked */}
      {isAnswered && isMarked && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-marigold border-2 border-surface" />
      )}
    </button>
  )
}

// ── Legend ────────────────────────────────────────────────────────────────────
/*
  Legend — small colour key beneath the question grid explaining each state.
*/
const LEGEND_ITEMS = [
  { label: 'Current',           cls: 'bg-surface border-2 border-teal text-teal', dot: false },
  { label: 'Answered',          cls: 'bg-teal text-white',                        dot: false },
  { label: 'Not answered',      cls: 'bg-edge text-muted',                        dot: false },
  { label: 'Marked for review', cls: 'bg-marigold text-ink',                      dot: false },
  { label: 'Answered + marked', cls: 'bg-teal text-white',                        dot: true  },
]

function Legend() {
  return (
    <div className="pt-3 mt-2 border-t border-edge">
      <p className="text-[9px] font-sans font-semibold text-muted uppercase tracking-wide mb-2.5">
        Legend
      </p>
      <div className="space-y-2">
        {LEGEND_ITEMS.map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <span className={`relative w-5 h-5 rounded text-[8px] font-bold flex items-center justify-center flex-shrink-0 ${item.cls}`}>
              1
              {item.dot && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-marigold border border-surface" />
              )}
            </span>
            <span className="text-[10px] font-sans text-muted">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── PalettePanel ──────────────────────────────────────────────────────────────
/*
  PalettePanel — the shared content used by both the desktop aside and the
  mobile drawer. Groups questions by section with a summary count at the top.
  'onClose' is passed only by the mobile drawer so it can dismiss itself.
*/
export function PalettePanel({ onClose }) {
  const {
    questions, sections, currentIndex, answers, markedForReview,
    answeredCount, goToIndex,
  } = useTest()

  const markedCount = markedForReview.size

  return (
    <div className="bg-surface border border-edge rounded-xl p-4 overflow-y-auto max-h-[calc(100vh-110px)]">

      {/* Header row */}
      <div className="flex items-center justify-between mb-1">
        <p className="font-sans font-semibold text-sm text-ink">Question Palette</p>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close palette"
            className="p-1 rounded-md text-muted hover:text-ink hover:bg-edge transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Quick summary */}
      <p className="text-[10px] font-sans text-muted mb-4">
        {answeredCount}/{questions.length} answered
        {markedCount > 0 && ` · ${markedCount} marked`}
      </p>

      {/* Per-section question grids */}
      {sections.map(section => {
        const sectionQs = questions.filter(q => q.section === section.id)

        return (
          <div key={section.id} className="mb-4 last:mb-2">
            <p className="text-[9px] font-sans font-semibold text-muted uppercase tracking-wide mb-2">
              {section.label}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sectionQs.map(q => {
                const idx = questions.indexOf(q)
                return (
                  <PaletteButton
                    key={q.id}
                    number={idx + 1}
                    isCurrent={idx === currentIndex}
                    isAnswered={answers[q.id] !== null}
                    isMarked={markedForReview.has(q.id)}
                    onClick={() => { goToIndex(idx); onClose?.() }}
                  />
                )
              })}
            </div>
          </div>
        )
      })}

      <Legend />
    </div>
  )
}

// ── MobilePaletteDrawer ───────────────────────────────────────────────────────
/*
  MobilePaletteDrawer — only rendered on screens smaller than lg.
  A floating teal "Palette" button in the bottom-right corner opens a
  slide-up sheet backed by a dimmed overlay.
*/
export function MobilePaletteDrawer() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open question palette"
        className="lg:hidden fixed bottom-28 right-4 z-30 flex items-center gap-1.5 px-3 py-2 bg-teal text-white rounded-lg shadow-lg text-xs font-sans font-semibold hover:bg-teal-dark transition-colors cursor-pointer"
      >
        <LayoutGrid size={13} />
        Palette
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Dimmed backdrop — tapping it closes the drawer */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-ink/50 z-40 lg:hidden"
              onClick={() => setOpen(false)}
            />

            {/* Slide-up drawer */}
            <motion.div
              key="drawer"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-paper rounded-t-2xl max-h-[75vh] overflow-y-auto"
            >
              {/* Drag handle visual */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-edge" />
              </div>
              <PalettePanel onClose={() => setOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
