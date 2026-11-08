/*
  Dashboard — placeholder page shown after login.
  Displays the logged-in user's name, basic info and a logout button.
  Will be replaced with the full dashboard in a later part.
*/
import { useNavigate } from 'react-router-dom'
import { Compass, LogOut, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'

function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Simple top bar */}
      <header className="bg-surface border-b border-edge px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 text-ink">
          <Compass size={20} className="text-teal" strokeWidth={2.5} />
          <span className="font-sans font-extrabold text-base tracking-tight">PathFinder</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut size={15} />
          Logout
        </Button>
      </header>

      {/* Body */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-14">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-ink mb-2">
            Welcome back, {user?.fullName?.split(' ')[0]} 👋
          </h1>
          <p className="text-muted font-sans">
            Your dashboard is being built. For now, here is your profile data.
          </p>
        </div>

        {/* Profile card */}
        <div className="bg-surface border border-edge rounded-lg p-6 max-w-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center">
              <User size={22} className="text-teal" />
            </div>
            <div>
              <p className="font-semibold text-ink">{user?.fullName}</p>
              <p className="text-xs text-muted font-sans">{user?.email}</p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            {[
              ['Class',    user?.class ? `Class ${user.class}` : '—'],
              ['Board',    user?.board             || '—'],
              ['State',    user?.state             || '—'],
              ['Language', user?.preferredLanguage || '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted font-sans uppercase tracking-wide mb-0.5">{label}</dt>
                <dd className="text-ink font-medium font-sans">{value}</dd>
              </div>
            ))}
          </dl>

          {user?.interests?.length > 0 && (
            <div className="mt-5 pt-5 border-t border-edge">
              <p className="text-xs text-muted font-sans uppercase tracking-wide mb-2">Interests</p>
              <div className="flex flex-wrap gap-2">
                {user.interests.map(i => (
                  <span key={i} className="text-xs font-sans font-medium px-2.5 py-1 rounded-full bg-teal/10 text-teal capitalize">
                    {i}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Dashboard
