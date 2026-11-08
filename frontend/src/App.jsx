// App.jsx — root of the app.
// ThemeProvider and AuthProvider wrap everything.
// Route guards (ProtectedRoute / PublicOnlyRoute) control access to each page.
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider }  from './context/AuthContext'

import ProtectedRoute  from './components/layout/ProtectedRoute'
import PublicOnlyRoute from './components/layout/PublicOnlyRoute'

import Home           from './pages/Home'
import Login          from './pages/Login'
import Register       from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import DashboardLayout from './components/layout/DashboardLayout'
import Dashboard      from './pages/Dashboard'
import ComingSoon     from './pages/ComingSoon'
import NotFound       from './pages/NotFound'
import UiShowcase     from './pages/UiShowcase'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public pages */}
            <Route path="/" element={<Home />} />

            {/* Auth pages — redirect to /dashboard if already logged in */}
            <Route path="/login"           element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
            <Route path="/register"        element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
            <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />

            {/* Protected pages — DashboardLayout wraps all /dashboard/* routes */}
            <Route
              path="/dashboard"
              element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}
            >
              <Route index                  element={<Dashboard />}  />
              <Route path="test"            element={<ComingSoon />} />
              <Route path="results"         element={<ComingSoon />} />
              <Route path="careers"         element={<ComingSoon />} />
              <Route path="counsellor"      element={<ComingSoon />} />
              <Route path="profile"         element={<ComingSoon />} />
            </Route>

            {/* Temporary dev route */}
            <Route path="/ui" element={<UiShowcase />} />

            {/* 404 — catch-all for any unknown path */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
