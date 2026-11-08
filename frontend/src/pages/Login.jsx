/*
  Login page — split layout: form on the left, decorative panel on the right.
  The panel is hidden on mobile so the form takes the full screen.
  Handles validation, inline errors, loading state and a demo-login hint box.
*/
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Compass, CheckCircle, Info } from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import { validateEmail, validatePassword } from '../utils/validation'
import Button from '../components/ui/Button'
import Input  from '../components/ui/Input'

// ── Decorative right panel ───────────────────────────────────────────────────
/*
  RightPanel — visible only on lg+ screens.
  Warm teal background with an encouraging quote and trust items.
*/
function RightPanel() {
  const TRUST = [
    'Free for every student across India',
    'Available in Hindi and English',
    '100+ career paths with roadmaps',
  ]

  return (
    <div className="hidden lg:flex flex-col justify-between bg-teal px-12 py-14 relative overflow-hidden">
      {/* Decorative background rings */}
      <div aria-hidden="true" className="absolute -top-24 -right-24 w-96 h-96 rounded-full border border-paper/10" />
      <div aria-hidden="true" className="absolute -bottom-20 -left-16 w-72 h-72 rounded-full border border-marigold/15" />
      <div aria-hidden="true" className="absolute bottom-32 right-8 w-40 h-40 rounded-full bg-marigold/8" />

      {/* Top: logo */}
      <div className="relative z-10 flex items-center gap-2">
        <Compass size={22} className="text-paper" strokeWidth={2.5} />
        <span className="font-sans font-extrabold text-lg tracking-tight text-paper">PathFinder</span>
      </div>

      {/* Middle: quote */}
      <div className="relative z-10">
        <blockquote className="font-serif text-3xl xl:text-4xl font-semibold italic text-paper leading-tight mb-8">
          "Every great career starts with knowing yourself."
        </blockquote>
        <ul className="space-y-3">
          {TRUST.map(item => (
            <li key={item} className="flex items-center gap-3 text-paper/80 font-sans text-sm">
              <CheckCircle size={15} className="text-marigold shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

    </div>
  )
}

// ── Main Login page ──────────────────────────────────────────────────────────
function Login() {
  const { login }  = useAuth()
  const navigate   = useNavigate()

  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe,   setRememberMe]   = useState(false)
  const [errors,       setErrors]       = useState({})
  const [serverError,  setServerError]  = useState('')
  const [submitting,   setSubmitting]   = useState(false)

  // Clear a single field's error when the user starts typing
  function clearError(field) {
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  // Fill the form with demo credentials for quick testing
  function fillDemo() {
    setEmail('demo@pathfinder.in')
    setPassword('demo123')
    setErrors({})
    setServerError('')
  }

  // Validate all fields; returns an errors object (empty = valid)
  function validate() {
    const errs = {}
    const emailErr = validateEmail(email)
    const passErr  = validatePassword(password)
    if (emailErr) errs.email    = emailErr
    if (passErr)  errs.password = passErr
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')

    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }

    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      // loginUser throws with a human-readable message
      setServerError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1fr_440px] xl:grid-cols-[1fr_500px]">

      {/* ── Left: form column ── */}
      <div className="flex items-center justify-center px-4 sm:px-8 py-14 bg-paper">
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Mobile logo — hidden when the right panel shows the logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Compass size={20} className="text-teal" strokeWidth={2.5} />
            <span className="font-sans font-extrabold text-base tracking-tight text-ink">PathFinder</span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-semibold text-ink mb-1">Welcome back</h1>
          <p className="text-sm text-muted font-sans mb-7">
            Sign in to continue your journey.
          </p>

          {/* Demo hint */}
          <div className="mb-6 p-3.5 rounded-lg bg-teal/8 border border-teal/15 flex gap-3">
            <Info size={15} className="text-teal shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-teal font-sans mb-0.5">Demo account</p>
              <p className="text-xs text-muted font-sans mb-2">
                demo@pathfinder.in &nbsp;·&nbsp; demo123
              </p>
              <button
                type="button"
                onClick={fillDemo}
                className="text-xs font-semibold text-teal font-sans hover:underline cursor-pointer"
              >
                Fill in automatically →
              </button>
            </div>
          </div>

          {/* Server-level error (wrong credentials, network, etc.) */}
          {serverError && (
            <div className="mb-5 p-3.5 rounded-lg bg-error/8 border border-error/20" role="alert">
              <p className="text-xs text-error font-sans">{serverError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

            {/* Email */}
            <Input
              id="login-email"
              label="Email address"
              type="email"
              placeholder="you@example.com"
              icon={Mail}
              value={email}
              onChange={e => { setEmail(e.target.value); clearError('email') }}
              error={errors.email}
              autoComplete="email"
            />

            {/* Password — custom field so we can add the show/hide toggle on the right */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-password" className="text-sm font-medium text-ink">
                Password
              </label>
              <div className="relative">
                <span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                  <Lock size={15} />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); clearError('password') }}
                  autoComplete="current-password"
                  className={`
                    w-full rounded-lg border bg-surface text-ink text-sm
                    pl-9 pr-10 py-2.5 placeholder:text-muted
                    transition duration-150 focus:outline-none focus:ring-2
                    ${errors.password
                      ? 'border-error focus:ring-error/20 focus:border-error'
                      : 'border-edge focus:ring-teal/20 focus:border-teal'}
                  `}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'login-password-error' : undefined}
                />
                {/* Show / hide toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p id="login-password-error" role="alert" className="text-xs text-error">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-edge cursor-pointer accent-teal"
                />
                <span className="text-sm text-muted font-sans">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-teal hover:text-teal-dark no-underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              size="md"
              className="w-full justify-center mt-1"
              loading={submitting}
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          {/* Register link */}
          <p className="mt-6 text-center text-sm text-muted font-sans">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-teal hover:text-teal-dark no-underline transition-colors"
            >
              Create one free
            </Link>
          </p>
        </motion.div>
      </div>

      {/* ── Right: illustrated panel ── */}
      <RightPanel />
    </div>
  )
}

export default Login
