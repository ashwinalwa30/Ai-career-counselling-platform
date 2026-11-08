/*
  ProtectedRoute — wraps any page that requires the user to be logged in.
  While the session is being restored (loading=true) it shows a full-page
  spinner so there is no flash-redirect to /login on refresh.
  Once loaded: logged-in users see the page; guests are sent to /login.
*/
import { Navigate } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Loader from '../ui/Loader'

// Full-page loading screen shown while the session token is being validated
function PageLoader() {
  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center gap-4">
      <Compass size={28} className="text-teal" strokeWidth={2.5} />
      <Loader size="md" />
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <PageLoader />
  if (!user)   return <Navigate to="/login" replace />

  return children
}

export default ProtectedRoute
