/*
  LanguageContext — provides the active language ('en' | 'hi') and a t() helper
  to every component in the tree. Must be rendered inside AuthProvider so it can
  read the user's registered preferredLanguage to set the initial value.
*/
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth }        from './AuthContext'
import translations       from '../data/translations.js'

const STORAGE_KEY = 'pf-lang'

const LanguageContext = createContext(null)

/*
  useLanguage — returns { lang, toggleLang, t }.
  t(key, vars?) interpolates {placeholder} in the string with the values in vars.
  Example: t('ts_ip_body', { answered: 12, total: 40 })
*/
export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>')
  return ctx
}

export function LanguageProvider({ children }) {
  const { user } = useAuth()

  /*
    Initialise language:
    1. If localStorage has a saved preference, use that (user's explicit choice wins).
    2. Otherwise fall back to the user's registered preferredLanguage field.
    3. Default to 'en'.
  */
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'hi') return saved
    return 'en'   // will be updated below once the user loads
  })

  // When the user object first becomes available (after login/session restore),
  // apply their registered language preference — but only if they haven't
  // manually toggled the language themselves (localStorage takes priority).
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved && user?.preferredLanguage) {
      const initial = user.preferredLanguage.toLowerCase() === 'hindi' ? 'hi' : 'en'
      setLang(initial)
    }
  }, [user?.preferredLanguage])

  function toggleLang() {
    setLang(prev => {
      const next = prev === 'en' ? 'hi' : 'en'
      localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }

  /*
    t — looks up a key in the active locale, falls back to English if missing.
    Interpolates {name} style placeholders with values from the optional vars object.
  */
  const t = useCallback((key, vars) => {
    const locale = translations[lang] || translations.en
    let str = locale[key] ?? translations.en[key] ?? key   // key itself as last resort

    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
      })
    }

    return str
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}
