/*
  NotFound — 404 page shown when no route matches.
  Friendly message with a large "404" display and a link back to the home page.
*/
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Compass, ArrowLeft } from 'lucide-react'
import usePageTitle from '../hooks/usePageTitle'

function NotFound() {
  usePageTitle('Page Not Found')
  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-4 py-16 text-center">

      {/* Logo */}
      <Link
        to="/"
        className="flex items-center gap-2 mb-12 no-underline hover:opacity-80 transition-opacity"
        aria-label="PathFinder home"
      >
        <Compass size={20} className="text-teal" strokeWidth={2.5} />
        <span className="font-sans font-extrabold text-base tracking-tight text-ink">PathFinder</span>
      </Link>

      {/* Large 404 number */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="font-serif text-[9rem] leading-none font-semibold text-edge select-none">
          404
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="text-2xl font-semibold text-ink mt-2 mb-3">
          Page not found
        </h1>
        <p className="text-sm text-muted font-sans max-w-xs mx-auto mb-8">
          Looks like this path doesn't exist. It may have moved or been removed.
        </p>

        {/* Back home link styled as a button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal text-white font-sans text-sm font-semibold hover:bg-teal-dark transition-colors no-underline"
        >
          <ArrowLeft size={15} />
          Back to home
        </Link>
      </motion.div>
    </div>
  )
}

export default NotFound
