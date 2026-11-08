/*
  Navbar — fixed top bar for all public pages.
  Transparent at the top; switches to a warm glass surface once scrolled.
  Mobile: hamburger reveals an animated slide-down menu.
*/
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Compass, Menu, X, Sun, Moon } from 'lucide-react'

import { useTheme } from '../../context/ThemeContext'
import Button from '../ui/Button'

const NAV_LINKS = [
  { label: 'Home',         href: '#home' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Careers',      href: '#careers' },
  { label: 'FAQ',          href: '#faq' },
]

function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 20) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    function onResize() { if (window.innerWidth >= 768) setMenuOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-40
        transition-all duration-300
        ${scrolled ? 'glass shadow-sm' : 'bg-transparent'}
      `}
    >
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo — font-sans keeps it in Plus Jakarta Sans, not the serif headings */}
        <a
          href="#home"
          aria-label="PathFinder home"
          className="flex items-center gap-2 no-underline hover:opacity-80 transition-opacity"
        >
          <Compass size={22} className="text-teal" strokeWidth={2.5} />
          <span className="font-sans font-extrabold text-lg tracking-tight text-ink">
            PathFinder
          </span>
        </a>

        {/* Desktop nav links */}
        <ul className="hidden md:flex items-center gap-7" role="list">
          {NAV_LINKS.map(link => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm font-medium text-muted hover:text-ink no-underline transition-colors duration-150"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop: theme toggle + auth buttons */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="p-2 rounded-md text-muted hover:text-ink hover:bg-edge transition-colors duration-150 cursor-pointer"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Login</Button>
          <Button size="sm" onClick={() => navigate('/register')}>Get Started</Button>
        </div>

        {/* Mobile: theme toggle + hamburger */}
        <div className="flex md:hidden items-center gap-1">
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="p-2 rounded-md text-muted hover:bg-edge transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            onClick={() => setMenuOpen(prev => !prev)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="p-2 rounded-md text-muted hover:text-ink hover:bg-edge transition-colors cursor-pointer"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile slide-down menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{    opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden glass"
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              {NAV_LINKS.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="py-2.5 px-2 rounded-md text-sm font-medium text-muted hover:text-ink hover:bg-edge no-underline transition-colors duration-150"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-3 pt-3 border-t border-edge flex flex-col gap-2">
                <Button variant="outline" size="md" className="w-full justify-center"
                  onClick={() => { setMenuOpen(false); navigate('/login') }}>Login</Button>
                <Button size="md" className="w-full justify-center"
                  onClick={() => { setMenuOpen(false); navigate('/register') }}>Get Started</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Navbar
