/*
  Register — 3-step form: Personal → Academic → Interests.
  All form state lives in one object so the Back button preserves entered data.
  Framer Motion slides the step panels left/right depending on direction.
  On completion, registers, logs in and navigates to /dashboard.
*/
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Compass, Eye, EyeOff, Check, Mail, Lock, Phone, User,
  Code2, Calculator, Microscope, Brush, Layers, Briefcase,
  PenLine, Music, Trophy, Heart, Scale, GraduationCap,
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import {
  validateFullName, validateEmail, validateNewPassword,
  validatePhone, passwordStrength,
} from '../utils/validation'
import Button from '../components/ui/Button'
import Input  from '../components/ui/Input'

// ── Static data ──────────────────────────────────────────────────────────────

const CLASSES = ['8', '9', '10', '11', '12']
const BOARDS  = ['CBSE', 'ICSE', 'State Board', 'IB']

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal',
  // Union Territories
  'Andaman and Nicobar Islands','Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu','Delhi',
  'Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
]

const INTERESTS = [
  { id: 'coding',       label: 'Coding',       icon: Code2        },
  { id: 'maths',        label: 'Maths',        icon: Calculator   },
  { id: 'biology',      label: 'Biology',      icon: Microscope   },
  { id: 'art',          label: 'Art',          icon: Brush        },
  { id: 'design',       label: 'Design',       icon: Layers       },
  { id: 'business',     label: 'Business',     icon: Briefcase    },
  { id: 'writing',      label: 'Writing',      icon: PenLine      },
  { id: 'music',        label: 'Music',        icon: Music        },
  { id: 'sports',       label: 'Sports',       icon: Trophy       },
  { id: 'social-work',  label: 'Social Work',  icon: Heart        },
  { id: 'law',          label: 'Law',          icon: Scale        },
  { id: 'teaching',     label: 'Teaching',     icon: GraduationCap},
]

const STEP_LABELS = ['Personal', 'Academic', 'Interests']

// ── Slide animation variants ─────────────────────────────────────────────────
const slideVariants = {
  enter:  dir => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
  center:      ({ x: 0, opacity: 1 }),
  exit:   dir => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
}

// ── Small local components ───────────────────────────────────────────────────

// Step progress bar across the top of the card
function ProgressIndicator({ currentStep }) {
  return (
    <div className="flex items-start mb-8">
      {STEP_LABELS.map((label, i) => {
        const n          = i + 1
        const isComplete = n < currentStep
        const isCurrent  = n === currentStep
        return (
          <div key={label} className="flex-1 flex flex-col items-center">
            <div className="flex items-center w-full">
              {i > 0 && (
                <div className={`flex-1 h-px ${n <= currentStep ? 'bg-teal' : 'bg-edge'}`} />
              )}
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center shrink-0
                text-xs font-bold font-sans
                ${isComplete ? 'bg-teal text-white'
                  : isCurrent ? 'bg-teal text-white'
                  : 'border-2 border-edge text-muted bg-surface'}
              `}>
                {isComplete ? <Check size={13} /> : n}
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className={`flex-1 h-px ${n < currentStep ? 'bg-teal' : 'bg-edge'}`} />
              )}
            </div>
            <p className={`text-xs mt-1.5 font-sans ${
              isCurrent  ? 'text-teal font-semibold'
              : isComplete ? 'text-teal'
              : 'text-muted'
            }`}>
              {label}
            </p>
          </div>
        )
      })}
    </div>
  )
}

// 4-segment bar + label showing password strength
function PasswordStrengthMeter({ password }) {
  if (!password) return null
  const score  = passwordStrength(password)
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['', 'bg-error', 'bg-marigold', 'bg-marigold', 'bg-success']
  const textCl = ['', 'text-error', 'text-marigold', 'text-marigold', 'text-success']
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1,2,3,4].map(i => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full transition-colors duration-200
              ${i <= score ? colors[score] : 'bg-edge'}`}
          />
        ))}
      </div>
      <p className={`text-xs mt-1 font-sans ${textCl[score]}`}>{labels[score]}</p>
    </div>
  )
}

// Styled <select> that matches the Input component style
function SelectField({ label, id, error, value, onChange, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink">{label}</label>
      )}
      <select
        id={id}
        value={value}
        onChange={onChange}
        className={`
          w-full rounded-lg border bg-surface text-ink text-sm
          px-3.5 py-2.5 transition duration-150
          focus:outline-none focus:ring-2
          ${error
            ? 'border-error focus:ring-error/20 focus:border-error'
            : 'border-edge focus:ring-teal/20 focus:border-teal'}
        `}
      >
        {children}
      </select>
      {error && <p role="alert" className="text-xs text-error">{error}</p>}
    </div>
  )
}

// Single interest chip — teal when selected
function InterestChip({ interest, selected, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(interest.id)}
      aria-pressed={selected}
      className={`
        flex items-center gap-1.5 px-3 py-2 rounded-lg border
        text-sm font-medium font-sans
        transition-all duration-150 cursor-pointer
        ${selected
          ? 'bg-teal/10 border-teal text-teal'
          : 'bg-surface border-edge text-muted hover:border-teal/40 hover:text-ink'}
      `}
    >
      <interest.icon size={13} />
      {interest.label}
    </button>
  )
}

// ── Step form panels ─────────────────────────────────────────────────────────

function Step1Form({ data, errors, onChange, onClearError }) {
  const [showPass, setShowPass] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <Input
        id="reg-name"
        label="Full name"
        placeholder="Priya Sharma"
        icon={User}
        value={data.fullName}
        onChange={e => onChange('fullName', e.target.value)}
        error={errors.fullName}
        autoComplete="name"
      />
      <Input
        id="reg-email"
        label="Email address"
        type="email"
        placeholder="you@example.com"
        icon={Mail}
        value={data.email}
        onChange={e => onChange('email', e.target.value)}
        error={errors.email}
        autoComplete="email"
      />

      {/* Password with show/hide + strength meter */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="reg-password" className="text-sm font-medium text-ink">
          Password
        </label>
        <div className="relative">
          <span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <Lock size={15} />
          </span>
          <input
            id="reg-password"
            type={showPass ? 'text' : 'password'}
            placeholder="Min. 8 characters"
            value={data.password}
            onChange={e => onChange('password', e.target.value)}
            autoComplete="new-password"
            className={`
              w-full rounded-lg border bg-surface text-ink text-sm
              pl-9 pr-10 py-2.5 placeholder:text-muted
              transition duration-150 focus:outline-none focus:ring-2
              ${errors.password
                ? 'border-error focus:ring-error/20 focus:border-error'
                : 'border-edge focus:ring-teal/20 focus:border-teal'}
            `}
            aria-invalid={!!errors.password}
          />
          <button
            type="button"
            onClick={() => setShowPass(p => !p)}
            aria-label={showPass ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors cursor-pointer"
          >
            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {errors.password
          ? <p role="alert" className="text-xs text-error">{errors.password}</p>
          : <PasswordStrengthMeter password={data.password} />
        }
      </div>

      <Input
        id="reg-phone"
        label="Mobile number"
        type="tel"
        placeholder="10-digit number"
        icon={Phone}
        value={data.phone}
        onChange={e => onChange('phone', e.target.value)}
        error={errors.phone}
        autoComplete="tel"
      />
    </div>
  )
}

function Step2Form({ data, errors, onChange }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          id="reg-class"
          label="Class"
          value={data.class}
          onChange={e => onChange('class', e.target.value)}
          error={errors.class}
        >
          <option value="">Select class</option>
          {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
        </SelectField>

        <SelectField
          id="reg-board"
          label="Board"
          value={data.board}
          onChange={e => onChange('board', e.target.value)}
          error={errors.board}
        >
          <option value="">Select board</option>
          {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
        </SelectField>
      </div>

      <Input
        id="reg-school"
        label="School name"
        placeholder="Your school's full name"
        value={data.schoolName}
        onChange={e => onChange('schoolName', e.target.value)}
        error={errors.schoolName}
      />

      <SelectField
        id="reg-state"
        label="State / Union Territory"
        value={data.state}
        onChange={e => onChange('state', e.target.value)}
        error={errors.state}
      >
        <option value="">Select state or UT</option>
        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
      </SelectField>

      {/* Preferred language — pill toggle, cleaner than a select for 2 options */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Preferred language</span>
        <div className="flex gap-2">
          {['English', 'Hindi'].map(lang => (
            <button
              key={lang}
              type="button"
              onClick={() => onChange('preferredLanguage', lang)}
              className={`
                flex-1 py-2.5 rounded-lg border text-sm font-medium font-sans
                transition-colors duration-150 cursor-pointer
                ${data.preferredLanguage === lang
                  ? 'bg-teal/10 border-teal text-teal'
                  : 'bg-surface border-edge text-muted hover:border-teal/40 hover:text-ink'}
              `}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Step3Form({ data, errors, onToggle }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted font-sans">
        Select at least <span className="font-semibold text-ink">3 interests</span> that excite you.
        Your choices help us match you with the right careers.
      </p>

      {/* Chip grid */}
      <div className="flex flex-wrap gap-2">
        {INTERESTS.map(interest => (
          <InterestChip
            key={interest.id}
            interest={interest}
            selected={data.interests.includes(interest.id)}
            onToggle={onToggle}
          />
        ))}
      </div>

      {errors.interests && (
        <p role="alert" className="text-xs text-error">{errors.interests}</p>
      )}

      {/* Count badge */}
      {data.interests.length > 0 && (
        <p className="text-xs text-muted font-sans">
          {data.interests.length} selected
          {data.interests.length >= 3 && (
            <span className="ml-1.5 text-success font-semibold">✓ Enough to continue</span>
          )}
        </p>
      )}
    </div>
  )
}

// ── Main Register component ──────────────────────────────────────────────────
function Register() {
  const { register } = useAuth()
  const navigate     = useNavigate()

  const [step,        setStep]        = useState(1)
  const [direction,   setDirection]   = useState(1)   // 1 = forward, -1 = backward
  const [submitting,  setSubmitting]  = useState(false)
  const [serverError, setServerError] = useState('')

  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', phone: '',
    class: '', board: '', schoolName: '', state: '',
    preferredLanguage: 'English',
    interests: [],
  })
  const [errors, setErrors] = useState({})

  // Update a single field and clear its error
  function updateField(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev  => ({ ...prev, [field]: '' }))
  }

  // Toggle an interest chip on/off
  function toggleInterest(id) {
    setFormData(prev => {
      const list    = prev.interests
      const updated = list.includes(id) ? list.filter(i => i !== id) : [...list, id]
      return { ...prev, interests: updated }
    })
    setErrors(prev => ({ ...prev, interests: '' }))
  }

  // Per-step validation
  function validateStep(n) {
    if (n === 1) {
      const e = {}
      const r1 = validateFullName(formData.fullName)
      const r2 = validateEmail(formData.email)
      const r3 = validateNewPassword(formData.password)
      const r4 = validatePhone(formData.phone)
      if (r1) e.fullName = r1
      if (r2) e.email    = r2
      if (r3) e.password = r3
      if (r4) e.phone    = r4
      return e
    }
    if (n === 2) {
      const e = {}
      if (!formData.class)           e.class      = 'Please select your class'
      if (!formData.board)           e.board      = 'Please select your board'
      if (!formData.schoolName.trim()) e.schoolName = 'School name is required'
      if (!formData.state)           e.state      = 'Please select your state'
      return e
    }
    if (n === 3) {
      const e = {}
      if (formData.interests.length < 3) e.interests = 'Please select at least 3 interests'
      return e
    }
    return {}
  }

  function goNext() {
    const errs = validateStep(step)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setDirection(1)
    setStep(s => s + 1)
    setErrors({})
  }

  function goBack() {
    setDirection(-1)
    setStep(s => s - 1)
    setErrors({})
  }

  async function handleSubmit() {
    const errs = validateStep(3)
    if (Object.keys(errs).length) { setErrors(errs); return }

    setServerError('')
    setSubmitting(true)
    try {
      await register(formData)
      navigate('/dashboard')
    } catch (err) {
      setServerError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const STEP_HEADINGS = [
    { title: 'Create your account',       sub: "Start your PathFinder journey — it's free." },
    { title: 'Tell us about your studies', sub: 'We use this to personalise your recommendations.' },
    { title: 'What interests you?',        sub: 'Pick what genuinely excites you — be honest!' },
  ]
  const { title, sub } = STEP_HEADINGS[step - 1]

  return (
    <div className="min-h-screen bg-paper flex flex-col">

      {/* Top bar */}
      <div className="max-w-lg w-full mx-auto px-4 pt-8 pb-4 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 no-underline hover:opacity-75 transition-opacity"
        >
          <Compass size={20} className="text-teal" strokeWidth={2.5} />
          <span className="font-sans font-extrabold text-base tracking-tight text-ink">PathFinder</span>
        </Link>
        <span className="text-xs text-muted font-sans">Step {step} of 3</span>
      </div>

      {/* Form card */}
      <div className="max-w-lg w-full mx-auto px-4 pb-12 flex-1">
        <motion.div
          className="bg-surface border border-edge rounded-xl shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="px-6 pt-7 sm:px-8 sm:pt-8">
            <ProgressIndicator currentStep={step} />
            <h1 className="text-xl font-semibold text-ink mb-1">{title}</h1>
            <p className="text-sm text-muted font-sans mb-6">{sub}</p>
          </div>

          <div className="px-6 pb-7 sm:px-8 sm:pb-8 overflow-hidden">
            {/* Server error shown on step 3 */}
            {serverError && step === 3 && (
              <div className="mb-4 p-3.5 rounded-lg bg-error/8 border border-error/20" role="alert">
                <p className="text-xs text-error font-sans">{serverError}</p>
              </div>
            )}

            {/* Animated step panel */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: 'easeInOut' }}
              >
                {step === 1 && (
                  <Step1Form
                    data={formData}
                    errors={errors}
                    onChange={updateField}
                  />
                )}
                {step === 2 && (
                  <Step2Form
                    data={formData}
                    errors={errors}
                    onChange={updateField}
                  />
                )}
                {step === 3 && (
                  <Step3Form
                    data={formData}
                    errors={errors}
                    onToggle={toggleInterest}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className={`flex gap-3 mt-6 ${step > 1 ? 'justify-between' : 'justify-end'}`}>
              {step > 1 && (
                <Button variant="ghost" size="md" onClick={goBack}>
                  ← Back
                </Button>
              )}
              {step < 3 ? (
                <Button size="md" onClick={goNext}>
                  Next →
                </Button>
              ) : (
                <Button size="md" loading={submitting} onClick={handleSubmit}>
                  {submitting ? 'Creating account…' : 'Create account'}
                </Button>
              )}
            </div>

            {/* Login link — only on step 1 */}
            {step === 1 && (
              <p className="mt-5 text-center text-sm text-muted font-sans">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-teal hover:text-teal-dark no-underline"
                >
                  Sign in
                </Link>
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Register
