/*
  ForgotPassword — user enters their email and we "send" a reset link.
  Since the backend is mocked, we always show the success state after submit.
  Two states: 'idle' (the form) and 'sent' (the confirmation message).
*/
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Compass, ArrowLeft, CheckCircle } from 'lucide-react'

import { forgotPassword } from '../services/api'
import { validateEmail } from '../utils/validation'
import Button from '../components/ui/Button'
import Input  from '../components/ui/Input'

// ── Success screen shown after the email is "sent" ───────────────────────────
/*
  SentConfirmation — replaces the form once the request completes.
  Shows a check icon, the email address, and a link back to login.
*/
function SentConfirmation({ email }) {
  return (
    <motion.div
      key="sent"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="text-center"
    >
      {/* Green check circle */}
      <div className="mx-auto mb-5 w-14 h-14 rounded-full bg-success/10 border border-success/20 flex items-center justify-center">
        <CheckCircle size={26} className="text-success" />
      </div>

      <h1 className="text-2xl font-semibold text-ink mb-2">Check your inbox</h1>
      <p className="text-sm text-muted font-sans mb-1">
        We sent a password reset link to
      </p>
      <p className="text-sm font-semibold text-ink font-sans mb-6">{email}</p>

      <p className="text-xs text-muted font-sans mb-8">
        Didn't get it? Check your spam folder or{' '}
        <span className="text-teal font-semibold cursor-pointer hover:underline">
          try again
        </span>
        .
      </p>

      <Link
        to="/login"
        className="inline-flex items-center gap-2 text-sm font-semibold text-teal hover:text-teal-dark no-underline transition-colors"
      >
        <ArrowLeft size={15} />
        Back to sign in
      </Link>
    </motion.div>
  )
}

// ── Main ForgotPassword page ──────────────────────────────────────────────────
function ForgotPassword() {
  const [email,       setEmail]       = useState('')
  const [emailError,  setEmailError]  = useState('')
  const [serverError, setServerError] = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [sent,        setSent]        = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')

    // Validate the email field first
    const err = validateEmail(email)
    if (err) {
      setEmailError(err)
      return
    }

    setSubmitting(true)
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (err) {
      setServerError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-4 py-16">

      {/* Logo at the top */}
      <Link
        to="/"
        className="flex items-center gap-2 mb-10 no-underline hover:opacity-80 transition-opacity"
        aria-label="PathFinder home"
      >
        <Compass size={20} className="text-teal" strokeWidth={2.5} />
        <span className="font-sans font-extrabold text-base tracking-tight text-ink">PathFinder</span>
      </Link>

      {/* Card container */}
      <div className="w-full max-w-sm bg-surface border border-edge rounded-xl shadow-sm p-8">
        <AnimatePresence mode="wait">

          {sent ? (
            <SentConfirmation key="confirmation" email={email} />
          ) : (
            /* The email input form */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Back link */}
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink no-underline transition-colors mb-6"
              >
                <ArrowLeft size={13} />
                Back to sign in
              </Link>

              <h1 className="text-2xl font-semibold text-ink mb-1">Forgot password?</h1>
              <p className="text-sm text-muted font-sans mb-7">
                Enter your email and we will send you a reset link.
              </p>

              {/* Server error banner */}
              {serverError && (
                <div className="mb-5 p-3.5 rounded-lg bg-error/8 border border-error/20" role="alert">
                  <p className="text-xs text-error font-sans">{serverError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                <Input
                  id="forgot-email"
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  icon={Mail}
                  value={email}
                  onChange={e => { setEmail(e.target.value); setEmailError('') }}
                  error={emailError}
                  autoComplete="email"
                />

                <Button
                  type="submit"
                  size="md"
                  className="w-full justify-center"
                  loading={submitting}
                >
                  {submitting ? 'Sending…' : 'Send reset link'}
                </Button>
              </form>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}

export default ForgotPassword
