/*
  PublicOnlyRoute — wraps pages that logged-in users should not see
  (Login, Register, Forgot Password).
  While loading: shows the same full-page spinner as ProtectedRoute.
  Once loaded: logged-in users are redirected to /dashboard; guests see the page.
*/
import { Navigate } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Loader from '../ui/Loader'

function PageLoader() {
  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center gap-4">
      <Compass size={28} className="text-teal" strokeWidth={2.5} />
      <Loader size="md" />
    </div>
  )
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <PageLoader />
  if (user)    return <Navigate to="/dashboard" replace />

  return children
}

export default PublicOnlyRoute
