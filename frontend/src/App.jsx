// App.jsx — root of the app.
// ThemeProvider and AuthProvider wrap everything.
// Route guards (ProtectedRoute / PublicOnlyRoute) control access to each page.
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider }  from './context/AuthContext'

import ProtectedRoute  from './components/layout/ProtectedRoute'
import PublicOnlyRoute from './components/layout/PublicOnlyRoute'
import ErrorBoundary   from './components/ErrorBoundary'

import Home           from './pages/Home'
import Login          from './pages/Login'
import Register       from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import DashboardLayout from './components/layout/DashboardLayout'
import Dashboard        from './pages/Dashboard'
import Profile          from './pages/Profile'
import TestInstructions from './pages/TestInstructions'
import TestPage         from './pages/TestPage'
import Results          from './pages/Results'
import Careers          from './pages/Careers'
import CareerDetail     from './pages/CareerDetail'
import CareerExplore    from './pages/CareerExplore'
import CareerCompare    from './pages/CareerCompare'
import ComingSoon       from './pages/ComingSoon'
import NotFound         from './pages/NotFound'
import UiShowcase     from './pages/UiShowcase'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
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
              <Route path="test"            element={<TestInstructions />} />
              <Route path="results"         element={<Results />} />
              <Route path="careers"         element={<Careers />} />
              <Route path="careers/:id"    element={<CareerDetail />} />
              <Route path="explore"         element={<CareerExplore />} />
              <Route path="compare"         element={<CareerCompare />} />
              <Route path="counsellor"      element={<ComingSoon />} />
              <Route path="profile"         element={<Profile />}   />
            </Route>

            {/* Full-screen test page — lives outside DashboardLayout so it
                has no sidebar or bottom nav, only its own minimal header */}
            <Route path="/dashboard/test/start" element={<ProtectedRoute><TestPage /></ProtectedRoute>} />

            {/* Temporary dev route */}
            <Route path="/ui" element={<UiShowcase />} />

            {/* 404 — catch-all for any unknown path */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
