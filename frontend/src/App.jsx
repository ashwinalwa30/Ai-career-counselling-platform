// App.jsx — root of the app.
// ThemeProvider and AuthProvider wrap everything.
// Route guards (ProtectedRoute / PublicOnlyRoute) control access to each page.
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider }  from './context/AuthContext'

import ProtectedRoute  from './components/layout/ProtectedRoute'
import PublicOnlyRoute from './components/layout/PublicOnlyRoute'

import Home       from './pages/Home'
import Login      from './pages/Login'
import Register   from './pages/Register'
import Dashboard  from './pages/Dashboard'
import UiShowcase from './pages/UiShowcase'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public pages */}
            <Route path="/" element={<Home />} />

            {/* Auth pages — redirect to /dashboard if already logged in */}
            <Route path="/login"    element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
            <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

            {/* Protected pages — redirect to /login if not logged in */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

            {/* Temporary dev route */}
            <Route path="/ui" element={<UiShowcase />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
