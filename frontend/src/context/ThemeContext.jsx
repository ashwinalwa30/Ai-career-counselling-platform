/*
  ThemeContext — manages light/dark mode for the whole app.
  Reads the saved preference from localStorage, falls back to the OS setting,
  and toggles the "dark" class on <html> which Tailwind watches.
*/
import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

// Key used in localStorage so the choice survives page refreshes
const STORAGE_KEY = 'pf-theme'

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Priority 1: previously saved choice
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'dark' || saved === 'light') return saved

    // Priority 2: OS / browser preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'

    return 'light'
  })

  useEffect(() => {
    // Add or remove Tailwind's "dark" class on the root <html> element
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    // Persist the choice so the next visit starts with the same theme
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  // Switch between light and dark
  function toggleTheme() {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

/*
  useTheme — custom hook so any component can read and change the theme
  without importing ThemeContext directly.
  Usage: const { theme, toggleTheme } = useTheme()
*/
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used inside <ThemeProvider>')
  }
  return context
}
