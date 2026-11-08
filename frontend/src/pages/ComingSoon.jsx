/*
  ComingSoon — temporary placeholder for pages not yet built.
  Reads the current path and shows the matching section name.
  When a section is built, this file is replaced with the real implementation.
*/
import { useLocation } from 'react-router-dom'
import { Compass } from 'lucide-react'

// Maps each unbuilt route to a human-readable section name
const PATH_LABELS = {
  '/dashboard/test':       'Aptitude Test',
  '/dashboard/results':    'Results',
  '/dashboard/careers':    'Career Explorer',
  '/dashboard/counsellor': 'AI Counsellor',
  '/dashboard/profile':    'Profile',
}

function ComingSoon() {
  const { pathname } = useLocation()
  const title = PATH_LABELS[pathname] || 'Page'

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-14 h-14 rounded-full bg-teal/10 border border-teal/20 flex items-center justify-center mb-5">
        <Compass size={22} className="text-teal" strokeWidth={1.75} />
      </div>
      <h2 className="text-xl font-semibold text-ink mb-2">{title}</h2>
      <p className="text-sm text-muted font-sans max-w-xs">
        This section is coming soon and will be built in the next steps.
      </p>
    </div>
  )
}

export default ComingSoon
