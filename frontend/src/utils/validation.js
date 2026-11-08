/*
  validation.js — reusable field-level validation rules used across all auth forms.
  Every function returns a string error message, or null when the value is valid.
  Keeping rules here means Login, Register and any future form all use the same logic.
*/

// ── Basic helpers ────────────────────────────────────────────────────────────

export function validateRequired(value, fieldName = 'This field') {
  if (!value || !String(value).trim()) return `${fieldName} is required`
  return null
}

export function validateEmail(email) {
  if (!email || !email.trim()) return 'Email address is required'
  // Standard email pattern — simple and readable
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return 'Enter a valid email address'
  }
  return null
}

export function validatePhone(phone) {
  if (!phone || !phone.trim()) return 'Phone number is required'
  const digits = phone.replace(/[\s\-()]/g, '')
  if (!/^\d{10}$/.test(digits)) return 'Enter a valid 10-digit mobile number'
  return null
}

// ── Password ─────────────────────────────────────────────────────────────────

// Used on the Login page — just checks presence and minimum length
export function validatePassword(password) {
  if (!password) return 'Password is required'
  if (password.length < 6) return 'Password must be at least 6 characters'
  return null
}

// Used on the Register page — stricter (min 8 chars)
export function validateNewPassword(password) {
  if (!password) return 'Password is required'
  if (password.length < 8) return 'Password must be at least 8 characters'
  return null
}

/*
  passwordStrength — returns a score 0–4 used to render the strength meter.
    0 = very weak, 1 = weak, 2 = fair, 3 = strong, 4 = very strong
*/
export function passwordStrength(password) {
  if (!password) return 0
  let score = 0
  if (password.length >= 8)          score++ // decent length
  if (/[A-Z]/.test(password))        score++ // uppercase letter
  if (/[0-9]/.test(password))        score++ // number
  if (/[^A-Za-z0-9]/.test(password)) score++ // special character
  return score
}

// ── Name ─────────────────────────────────────────────────────────────────────

export function validateFullName(name) {
  if (!name || !name.trim()) return 'Full name is required'
  if (name.trim().length < 2) return 'Name must be at least 2 characters'
  if (!/^[a-zA-Z\s.'-]+$/.test(name.trim())) {
    return 'Name can only contain letters, spaces and . \' -'
  }
  return null
}
