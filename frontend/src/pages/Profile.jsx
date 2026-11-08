/*
  Profile — view and edit the student's profile at /dashboard/profile.
  View mode: read-only cards for each section.
  Edit mode: switches each card to a form; Save commits to the API and
  updates AuthContext so the name refreshes in the sidebar and dashboard.
*/
import { useState, useEffect }  from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pencil, CheckCircle }  from 'lucide-react'

import { useAuth }                                        from '../context/AuthContext'
import { getProfile, updateProfile }                      from '../services/api'
import { validateFullName, validateEmail, validatePhone } from '../utils/validation'

// ── Constants ─────────────────────────────────────────────────────────────────

const ALL_INTERESTS = [
  'coding', 'maths', 'biology', 'art', 'design', 'business',
  'writing', 'music', 'sports', 'social-work', 'law', 'teaching',
]
const INTEREST_LABELS = {
  'coding': 'Coding', 'maths': 'Maths', 'biology': 'Biology',
  'art': 'Art', 'design': 'Design', 'business': 'Business',
  'writing': 'Writing', 'music': 'Music', 'sports': 'Sports',
  'social-work': 'Social Work', 'law': 'Law', 'teaching': 'Teaching',
}

// Labels used in both the view table and the edit inputs
const SUBJECT_LABELS = {
  maths:          'Mathematics',
  science:        'Science',
  english:        'English',
  socialScience:  'Social Science',
  secondLanguage: 'Second Language',
  computer:       'Computer Science',
}

const CLASS_OPTIONS = ['8','9','10','11','12'].map(c => ({ value: c, label: `Class ${c}` }))
const BOARD_OPTIONS = ['CBSE','ICSE','State Board','IB','IGCSE','Others'].map(b => ({ value: b, label: b }))
const LANGUAGE_OPTIONS = ['English','Hindi'].map(l => ({ value: l, label: l }))

const INDIA_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
]
const STATE_OPTIONS = INDIA_STATES.map(s => ({ value: s, label: s }))

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatDob(isoDate) {
  if (!isoDate) return '—'
  return new Date(isoDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

/*
  validateDraft — validates all editable fields and returns an errors object.
  Empty object means everything is valid.
*/
function validateDraft(draft) {
  const errs = {}

  const nameErr  = validateFullName(draft.fullName)
  const emailErr = validateEmail(draft.email)
  const phoneErr = validatePhone(draft.phone)
  if (nameErr)  errs.fullName = nameErr
  if (emailErr) errs.email    = emailErr
  if (phoneErr) errs.phone    = phoneErr

  if (!draft.interests || draft.interests.length === 0) {
    errs.interests = 'Select at least one interest'
  }

  // Each subject mark must be a whole number between 0 and 100
  const markErrs = {}
  if (draft.subjectMarks) {
    Object.entries(draft.subjectMarks).forEach(([key, val]) => {
      const num = Number(val)
      if (val === '' || val === null || val === undefined) {
        markErrs[key] = 'Required'
      } else if (isNaN(num) || num < 0 || num > 100 || !Number.isInteger(num)) {
        markErrs[key] = '0–100'
      }
    })
  }
  if (Object.keys(markErrs).length) errs.marks = markErrs

  return errs
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-edge ${className}`} />
}

// ── Toast ─────────────────────────────────────────────────────────────────────
/*
  Toast — green success banner fixed to the bottom-right corner.
  Auto-dismissed by the parent after 3 seconds.
*/
function Toast({ visible, message }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-24 md:bottom-6 right-4 z-50 flex items-center gap-2 bg-surface border border-success/30 shadow-lg rounded-lg px-4 py-3"
          role="status"
          aria-live="polite"
        >
          <CheckCircle size={15} className="text-success flex-shrink-0" />
          <p className="text-sm font-sans font-medium text-ink">{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Shared card wrapper ───────────────────────────────────────────────────────
function SectionCard({ title, children }) {
  return (
    <div className="bg-surface border border-edge rounded-lg overflow-hidden">
      <div className="px-5 py-3.5 border-b border-edge">
        <h2 className="font-sans font-semibold text-sm text-ink">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// ── View-mode components ──────────────────────────────────────────────────────

/*
  DetailGrid — responsive grid of label/value pairs for view mode.
*/
function DetailGrid({ rows }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-[10px] font-sans font-semibold text-muted uppercase tracking-wide mb-0.5">
            {label}
          </dt>
          <dd className="text-sm font-sans text-ink font-medium">{value || '—'}</dd>
        </div>
      ))}
    </dl>
  )
}

/*
  InterestChips — read-only display of interest tags.
*/
function InterestChips({ interests }) {
  if (!interests || interests.length === 0) {
    return <p className="text-sm text-muted font-sans">No interests added yet.</p>
  }
  return (
    <div className="flex flex-wrap gap-2">
      {interests.map(i => (
        <span
          key={i}
          className="px-3 py-1 rounded-full text-sm font-sans font-medium bg-teal/10 text-teal border border-teal/20 capitalize"
        >
          {INTEREST_LABELS[i] || i}
        </span>
      ))}
    </div>
  )
}

/*
  SubjectMarks — read-only view with coloured progress bars.
*/
function SubjectMarks({ marks }) {
  if (!marks) return <p className="text-sm text-muted font-sans">No marks added yet.</p>
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {Object.entries(marks).map(([key, mark]) => {
        const colour    = mark >= 75 ? 'text-success'  : mark >= 50 ? 'text-marigold'  : 'text-error'
        const barColour = mark >= 75 ? 'bg-success'    : mark >= 50 ? 'bg-marigold'    : 'bg-error'
        return (
          <div key={key} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans text-ink">{SUBJECT_LABELS[key]}</span>
              <span className={`text-xs font-sans font-bold ${colour}`}>{mark}/100</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-edge overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${barColour}`}
                style={{ width: `${mark}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Edit-mode form components ─────────────────────────────────────────────────

/*
  EditField — labeled text / number input styled to match the design system.
*/
function EditField({ label, id, error, ...inputProps }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[10px] font-sans font-semibold text-muted uppercase tracking-wide">
        {label}
      </label>
      <input
        id={id}
        className={`
          w-full rounded-lg border bg-surface text-ink text-sm font-sans
          px-3 py-2.5 placeholder:text-muted
          transition duration-150 focus:outline-none focus:ring-2
          ${error
            ? 'border-error focus:ring-error/20 focus:border-error'
            : 'border-edge focus:ring-teal/20 focus:border-teal'}
        `}
        aria-invalid={!!error}
        {...inputProps}
      />
      {error && <p className="text-xs text-error font-sans">{error}</p>}
    </div>
  )
}

/*
  EditSelect — labeled <select> styled to match EditField.
*/
function EditSelect({ label, id, value, onChange, options, error }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[10px] font-sans font-semibold text-muted uppercase tracking-wide">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        className={`
          w-full rounded-lg border bg-surface text-ink text-sm font-sans
          px-3 py-2.5
          transition duration-150 focus:outline-none focus:ring-2
          ${error
            ? 'border-error focus:ring-error/20 focus:border-error'
            : 'border-edge focus:ring-teal/20 focus:border-teal'}
        `}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-error font-sans">{error}</p>}
    </div>
  )
}

/*
  InterestEditor — chip grid where selected chips are teal; click to toggle.
  Shows an error message when nothing is selected.
*/
function InterestEditor({ selected, onChange, error }) {
  function toggle(interest) {
    if (selected.includes(interest)) {
      onChange(selected.filter(i => i !== interest))
    } else {
      onChange([...selected, interest])
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {ALL_INTERESTS.map(interest => {
          const on = selected.includes(interest)
          return (
            <button
              key={interest}
              type="button"
              onClick={() => toggle(interest)}
              aria-pressed={on}
              className={`
                px-3 py-1.5 rounded-full text-sm font-sans font-medium border
                transition-colors duration-150 cursor-pointer
                ${on
                  ? 'bg-teal/10 text-teal border-teal/30'
                  : 'bg-surface text-muted border-edge hover:border-teal/30 hover:text-teal'}
              `}
            >
              {INTEREST_LABELS[interest]}
            </button>
          )
        })}
      </div>
      {error && <p className="text-xs text-error font-sans mt-2">{error}</p>}
    </div>
  )
}

/*
  EditMarksSection — six number inputs in a 2-column grid, each validated 0–100.
*/
function EditMarksSection({ marks, markErrors, onChange }) {
  function handleChange(key, val) {
    // Store as string while typing so the input stays responsive; validation converts to Number
    onChange({ ...marks, [key]: val })
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Object.entries(SUBJECT_LABELS).map(([key, label]) => (
        <EditField
          key={key}
          id={`mark-${key}`}
          label={label}
          type="number"
          min="0"
          max="100"
          step="1"
          value={marks[key]}
          onChange={e => handleChange(key, e.target.value)}
          error={markErrors?.[key]}
        />
      ))}
    </div>
  )
}

// ── Profile header card ───────────────────────────────────────────────────────
/*
  ProfileHeader — avatar + name/school line.
  In view mode shows an Edit button; in edit mode shows Cancel + Save.
*/
function ProfileHeader({ profile, mode, onEdit, onSave, onCancel, saving, hasErrors }) {
  return (
    <div className="bg-surface border border-edge rounded-lg p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">

        {/* Avatar + name */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-16 h-16 rounded-full bg-teal/15 flex items-center justify-center flex-shrink-0">
            <span className="font-sans font-bold text-xl text-teal">
              {getInitials(profile.fullName)}
            </span>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-ink leading-tight truncate">
              {profile.fullName}
            </h1>
            <p className="text-sm text-muted font-sans mt-0.5">
              Class {profile.class} · {profile.board}
            </p>
            <p className="text-xs text-muted font-sans mt-0.5 truncate">
              {profile.schoolName}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        {mode === 'view' ? (
          <button
            onClick={onEdit}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-edge text-xs font-sans font-semibold text-muted hover:text-ink hover:border-ink transition-colors cursor-pointer"
          >
            <Pencil size={12} />
            Edit profile
          </button>
        ) : (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 rounded-lg border border-edge text-xs font-sans font-semibold text-muted hover:text-ink hover:border-ink transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving || hasErrors}
              className="px-4 py-1.5 rounded-lg bg-teal text-white text-xs font-sans font-semibold hover:bg-teal-dark transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-4">
      <div className="bg-surface border border-edge rounded-lg p-5 sm:p-6 flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-56" />
        </div>
      </div>
      {[1,2,3,4].map(i => (
        <div key={i} className="bg-surface border border-edge rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-edge"><Skeleton className="h-4 w-32" /></div>
          <div className="p-5 grid grid-cols-2 gap-4">
            <Skeleton className="h-10" /><Skeleton className="h-10" />
            <Skeleton className="h-10" /><Skeleton className="h-10" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
function Profile() {
  const { user, updateUser }             = useAuth()
  const [profile,  setProfile]           = useState(null)
  const [loading,  setLoading]           = useState(true)
  const [mode,     setMode]              = useState('view')  // 'view' | 'edit'
  const [draft,    setDraft]             = useState(null)    // editable copy
  const [saving,   setSaving]            = useState(false)
  const [serverErr, setServerErr]        = useState('')
  const [toastVisible, setToastVisible]  = useState(false)

  useEffect(() => {
    getProfile(user?.id).then(res => {
      setProfile(res.data.profile)
      setLoading(false)
    })
  }, [user?.id])

  // ── Mode switching ──────────────────────────────────────────────────────────

  function handleEdit() {
    // Deep-copy the profile so draft changes don't mutate the view data
    setDraft({
      ...profile,
      subjectMarks: { ...profile.subjectMarks },
      interests:    [...profile.interests],
    })
    setServerErr('')
    setMode('edit')
  }

  function handleCancel() {
    setDraft(null)
    setServerErr('')
    setMode('view')
  }

  // ── Draft helpers ───────────────────────────────────────────────────────────

  // Update a single top-level field in the draft
  function setField(key, value) {
    setDraft(prev => ({ ...prev, [key]: value }))
  }

  // Update a nested subjectMarks field
  function setMark(key, value) {
    setDraft(prev => ({
      ...prev,
      subjectMarks: { ...prev.subjectMarks, [key]: value },
    }))
  }

  // ── Computed validation ─────────────────────────────────────────────────────
  // Computed live from draft so Save disables the moment a field becomes invalid
  const errors   = draft ? validateDraft(draft) : {}
  const hasErrors = Object.keys(errors).length > 0

  // ── Save ────────────────────────────────────────────────────────────────────
  async function handleSave() {
    // Convert mark strings to integers before saving
    const cleanedMarks = {}
    Object.entries(draft.subjectMarks).forEach(([k, v]) => {
      cleanedMarks[k] = Number(v)
    })
    const payload = { ...draft, subjectMarks: cleanedMarks }

    setSaving(true)
    setServerErr('')
    try {
      const res = await updateProfile(user.id, payload)
      setProfile(res.data.user)
      updateUser(res.data.user)   // refresh name in sidebar + dashboard
      setMode('view')
      setDraft(null)
      // Show and auto-dismiss the success toast
      setToastVisible(true)
      setTimeout(() => setToastVisible(false), 3000)
    } catch (err) {
      setServerErr(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) return <ProfileSkeleton />

  const data = mode === 'edit' ? draft : profile

  return (
    <>
      <Toast visible={toastVisible} message="Profile updated successfully." />

      <motion.div
        className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <ProfileHeader
          profile={data}
          mode={mode}
          onEdit={handleEdit}
          onSave={handleSave}
          onCancel={handleCancel}
          saving={saving}
          hasErrors={hasErrors}
        />

        {/* Server error */}
        {serverErr && (
          <div className="p-3.5 rounded-lg bg-error/8 border border-error/20" role="alert">
            <p className="text-xs text-error font-sans">{serverErr}</p>
          </div>
        )}

        {/* ── Personal details ── */}
        <SectionCard title="Personal details">
          {mode === 'view' ? (
            <DetailGrid
              rows={[
                ['Full name',          profile.fullName],
                ['Email address',      profile.email],
                ['Phone number',       profile.phone],
                ['Date of birth',      formatDob(profile.dob)],
                ['State',              profile.state],
                ['Preferred language', profile.preferredLanguage],
              ]}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <EditField
                id="fullName" label="Full name"
                value={draft.fullName}
                onChange={e => setField('fullName', e.target.value)}
                error={errors.fullName}
                autoComplete="name"
              />
              <EditField
                id="email" label="Email address" type="email"
                value={draft.email}
                onChange={e => setField('email', e.target.value)}
                error={errors.email}
                autoComplete="email"
              />
              <EditField
                id="phone" label="Phone number" type="tel"
                value={draft.phone}
                onChange={e => setField('phone', e.target.value)}
                error={errors.phone}
                autoComplete="tel"
              />
              <EditField
                id="dob" label="Date of birth" type="date"
                value={draft.dob || ''}
                onChange={e => setField('dob', e.target.value)}
              />
              <EditSelect
                id="state" label="State"
                value={draft.state}
                onChange={e => setField('state', e.target.value)}
                options={STATE_OPTIONS}
              />
              <EditSelect
                id="language" label="Preferred language"
                value={draft.preferredLanguage}
                onChange={e => setField('preferredLanguage', e.target.value)}
                options={LANGUAGE_OPTIONS}
              />
            </div>
          )}
        </SectionCard>

        {/* ── Academic details ── */}
        <SectionCard title="Academic details">
          {mode === 'view' ? (
            <DetailGrid
              rows={[
                ['Class',       `Class ${profile.class}`],
                ['Board',        profile.board],
                ['School name',  profile.schoolName],
              ]}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <EditSelect
                id="class" label="Class"
                value={draft.class}
                onChange={e => setField('class', e.target.value)}
                options={CLASS_OPTIONS}
              />
              <EditSelect
                id="board" label="Board"
                value={draft.board}
                onChange={e => setField('board', e.target.value)}
                options={BOARD_OPTIONS}
              />
              <div className="sm:col-span-2">
                <EditField
                  id="schoolName" label="School name"
                  value={draft.schoolName}
                  onChange={e => setField('schoolName', e.target.value)}
                />
              </div>
            </div>
          )}
        </SectionCard>

        {/* ── Interests ── */}
        <SectionCard title="Interests">
          {mode === 'view' ? (
            <InterestChips interests={profile.interests} />
          ) : (
            <InterestEditor
              selected={draft.interests}
              onChange={val => setField('interests', val)}
              error={errors.interests}
            />
          )}
        </SectionCard>

        {/* ── Subject marks ── */}
        <SectionCard title="Subject marks">
          {mode === 'view' ? (
            <SubjectMarks marks={profile.subjectMarks} />
          ) : (
            <EditMarksSection
              marks={draft.subjectMarks}
              markErrors={errors.marks}
              onChange={val => setField('subjectMarks', val)}
            />
          )}
        </SectionCard>

        {/* Repeat Save/Cancel at the bottom so the user doesn't have to scroll up */}
        {mode === 'edit' && (
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg border border-edge text-sm font-sans font-semibold text-muted hover:text-ink hover:border-ink transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || hasErrors}
              className="px-5 py-2 rounded-lg bg-teal text-white text-sm font-sans font-semibold hover:bg-teal-dark transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        )}
      </motion.div>
    </>
  )
}

export default Profile
