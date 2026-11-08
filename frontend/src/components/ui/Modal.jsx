/*
  Modal — a dialog overlay that traps focus and blocks the page behind it.
  Closes when: the X button is clicked, the backdrop is clicked, or Escape is pressed.
  Uses Framer Motion for a smooth fade + scale entrance/exit.
*/
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

/*
  Props:
    isOpen  — boolean: controls visibility
    onClose — function: called when the user wants to close
    title   — string: shown in the header; also used as the aria-label
    children
*/
function Modal({ isOpen, onClose, title, children }) {
  // Close when the user presses Escape
  useEffect(() => {
    if (!isOpen) return
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // Prevent body scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        // Full-screen container: backdrop + centred dialog
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          {/* Backdrop — clicking it closes the modal */}
          <motion.div
            className="absolute inset-0 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Dialog panel */}
          <motion.div
            className="
              relative z-10 w-full max-w-md
              rounded-2xl bg-white dark:bg-navy-800
              shadow-2xl shadow-slate-900/20
              border border-slate-100 dark:border-slate-700/50
            "
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100 dark:border-slate-700/50">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {title}
              </h2>
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="
                  p-1.5 rounded-lg text-slate-400 hover:text-slate-600
                  hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-200
                  transition-colors duration-150 cursor-pointer
                "
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default Modal
