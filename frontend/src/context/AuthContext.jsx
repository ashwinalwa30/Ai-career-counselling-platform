/*
  AuthContext — global auth state for the entire app.
  Holds the logged-in user and exposes login, register, logout functions.
  On mount it tries to restore a previous session from localStorage so a
  page refresh does not log the user out.
*/
import { createContext, useContext, useState, useEffect } from 'react'
import {
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUser,
} from '../services/api'

const AuthContext = createContext(null)

// Key used to store the auth token between sessions
const TOKEN_KEY = 'pf-auth-token'

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  // loading is true while we check localStorage on first load
  const [loading, setLoading] = useState(true)

  // ── Restore session on mount ─────────────────────────────────────────────
  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem(TOKEN_KEY)
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const res = await getCurrentUser(token)
        setUser(res.data.user)
      } catch {
        // Token is expired or invalid — clear it silently
        localStorage.removeItem(TOKEN_KEY)
      } finally {
        setLoading(false)
      }
    }
    restoreSession()
  }, [])

  // ── Auth actions ─────────────────────────────────────────────────────────

  // login — calls the API, saves the token, updates user state
  async function login(email, password) {
    const res = await loginUser(email, password)
    localStorage.setItem(TOKEN_KEY, res.data.token)
    setUser(res.data.user)
    return res
  }

  // register — creates account, saves token, updates user state
  async function register(userData) {
    const res = await registerUser(userData)
    localStorage.setItem(TOKEN_KEY, res.data.token)
    setUser(res.data.user)
    return res
  }

  // logout — clears token and user state
  async function logout() {
    await logoutUser()
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }

  // updateUser — called after a profile save to sync the new data everywhere
  function updateUser(updatedUser) {
    setUser(updatedUser)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

/*
  useAuth — custom hook so components access auth state without importing
  AuthContext directly.
  Usage: const { user, login, logout } = useAuth()
*/
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
