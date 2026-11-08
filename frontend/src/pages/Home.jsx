// Placeholder home page shown at "/".
// Includes a theme toggle to verify ThemeContext works.
// Will be replaced with the real landing page in a later step.
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

function Home() {
  const { theme, toggleTheme } = useTheme()

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-extrabold tracking-tight text-gradient">
          PathFinder
        </h1>

        <p className="text-slate-500 dark:text-slate-400 text-lg">
          AI Career Counselling — coming soon
        </p>

        {/* Theme toggle — temporary, here just to verify ThemeContext works */}
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="
            inline-flex items-center gap-2 px-4 py-2 rounded-xl
            bg-white dark:bg-navy-800
            border border-slate-200 dark:border-slate-700
            text-slate-700 dark:text-slate-200
            shadow-sm hover:shadow-md
            transition-all duration-200 cursor-pointer
          "
        >
          {theme === 'dark' ? (
            <Sun size={18} className="text-brand-amber" />
          ) : (
            <Moon size={18} className="text-brand-indigo" />
          )}
          <span className="text-sm font-medium">
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </span>
        </button>

        <p className="text-xs text-slate-400 dark:text-slate-600">
          Current theme: <strong>{theme}</strong> · saved in localStorage
        </p>
      </div>
    </main>
  )
}

export default Home
