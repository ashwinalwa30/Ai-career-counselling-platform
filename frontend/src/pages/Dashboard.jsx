/*
  Dashboard — the main content panel shown at /dashboard.
  The outer page shell (sidebar, top bar, bottom nav) is provided by DashboardLayout.
  This file will be replaced with the full dashboard in Step 3.
*/
import { useAuth } from '../context/AuthContext'
import { User }    from 'lucide-react'

function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-semibold text-ink mb-1">
        Welcome, {user?.fullName?.split(' ')[0]}
      </h1>
      <p className="text-sm text-muted font-sans mb-8">
        Your full dashboard is coming in the next step.
      </p>

      {/* Basic profile card — temporary */}
      <div className="bg-surface border border-edge rounded-lg p-6 max-w-md">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center">
            <User size={18} className="text-teal" />
          </div>
          <div>
            <p className="font-semibold text-ink text-sm">{user?.fullName}</p>
            <p className="text-xs text-muted font-sans">{user?.email}</p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {[
            ['Class',    user?.class ? `Class ${user.class}` : '—'],
            ['Board',    user?.board             || '—'],
            ['State',    user?.state             || '—'],
            ['Language', user?.preferredLanguage || '—'],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[10px] text-muted font-sans uppercase tracking-wide mb-0.5">{label}</dt>
              <dd className="text-ink font-medium font-sans text-sm">{value}</dd>
            </div>
          ))}
        </dl>

        {user?.interests?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-edge">
            <p className="text-[10px] text-muted font-sans uppercase tracking-wide mb-2">Interests</p>
            <div className="flex flex-wrap gap-2">
              {user.interests.map(i => (
                <span
                  key={i}
                  className="text-xs font-sans font-medium px-2.5 py-1 rounded-full bg-teal/10 text-teal capitalize"
                >
                  {i}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
