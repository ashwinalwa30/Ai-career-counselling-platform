/*
  DashboardLayout — persistent shell for every logged-in page.
  Desktop: collapsible sidebar on the left, scrollable content on the right.
  Mobile: full-width content + a fixed bottom navigation bar (no sidebar).
  Child pages plug in via React Router's <Outlet />.
*/
import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, ClipboardList, BarChart2, Compass,
  MessageSquare, User, LogOut, Sun, Moon, ChevronLeft, ChevronRight,
} from 'lucide-react'

import { useAuth }  from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

// ── Shared nav data ──────────────────────────────────────────────────────────

/*
  NAV_ITEMS — single source of truth for sidebar and bottom nav.
  'end: true' on the index route prevents it matching every sub-path.
*/
const NAV_ITEMS = [
  { path: '/dashboard',            label: 'Dashboard',       icon: LayoutDashboard, end: true  },
  { path: '/dashboard/test',       label: 'Aptitude Test',   icon: ClipboardList,   end: false },
  { path: '/dashboard/results',    label: 'Results',         icon: BarChart2,       end: false },
  { path: '/dashboard/careers',    label: 'Career Explorer', icon: Compass,         end: false },
  { path: '/dashboard/counsellor', label: 'AI Counsellor',   icon: MessageSquare,   end: false },
  { path: '/dashboard/profile',    label: 'Profile',         icon: User,            end: false },
]

// Mobile bottom bar shows 5 items — Results is reachable from the Test section
const MOBILE_NAV = NAV_ITEMS.filter(item => item.path !== '/dashboard/results')

// ── Helpers ──────────────────────────────────────────────────────────────────

// Converts "Swayam Kothari" → "SK" for the compact avatar circle
function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Shared active-link logic used for the dot indicator and bottom nav icon weight
function checkActive(itemPath, itemEnd, pathname) {
  if (itemEnd) return pathname === itemPath
  return pathname.startsWith(itemPath)
}

// ── Sidebar (desktop only) ───────────────────────────────────────────────────

/*
  Sidebar — vertical navigation column visible on md+ screens.
  Collapses to icon-only width; state is persisted in localStorage so it
  survives page navigations.
*/
function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const { pathname }     = useLocation()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 224 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="hidden md:flex flex-col h-screen bg-surface border-r border-edge flex-shrink-0 overflow-hidden"
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-edge flex-shrink-0">
        <Compass size={20} className="text-teal flex-shrink-0" strokeWidth={2.5} />
        {!collapsed && (
          <span className="ml-2 font-sans font-extrabold text-sm tracking-tight text-ink whitespace-nowrap">
            PathFinder
          </span>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden" aria-label="Main navigation">
        {NAV_ITEMS.map(item => {
          const active = checkActive(item.path, item.end, pathname)
          const Icon   = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              title={collapsed ? item.label : undefined}
              className={`
                flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg mb-0.5
                font-sans text-sm font-medium no-underline transition-colors duration-150
                ${active ? 'bg-teal/10 text-teal' : 'text-muted hover:bg-edge hover:text-ink'}
              `}
            >
              <Icon size={17} className="flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis flex-1">
                    {item.label}
                  </span>
                  {/* Active indicator dot */}
                  {active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-teal flex-shrink-0" />
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom: user card + logout + collapse toggle */}
      <div className="border-t border-edge p-3 flex-shrink-0 space-y-1">

        {/* User card */}
        <div className={`flex items-center gap-2.5 px-1 py-1 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-teal/15 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-teal font-sans">
              {getInitials(user?.fullName)}
            </span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink font-sans truncate leading-tight">
                {user?.fullName}
              </p>
              <p className="text-[10px] text-muted font-sans truncate leading-tight">
                Class {user?.class} · {user?.board}
              </p>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Logout"
          className={`
            w-full flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer
            text-sm font-sans text-muted hover:bg-edge hover:text-ink
            transition-colors duration-150
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          <LogOut size={15} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>

        {/* Collapse / expand */}
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`
            w-full flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer
            text-xs font-sans text-muted hover:bg-edge hover:text-ink
            transition-colors duration-150
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          {collapsed
            ? <ChevronRight size={14} />
            : <><ChevronLeft size={14} /><span>Collapse</span></>
          }
        </button>
      </div>
    </motion.aside>
  )
}

// ── Top bar ──────────────────────────────────────────────────────────────────

/*
  TopBar — fixed header above the page content area.
  Shows the current page title, a theme toggle, and an initials avatar.
*/
function TopBar() {
  const { user }         = useAuth()
  const navigate         = useNavigate()
  const { pathname }     = useLocation()
  const { theme, toggleTheme } = useTheme()

  // Derive the page title from the current route
  const currentItem = NAV_ITEMS.find(item => checkActive(item.path, item.end, pathname))
  const pageTitle   = currentItem?.label || 'Dashboard'

  return (
    <header className="h-14 bg-surface border-b border-edge flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
      <p className="font-sans font-semibold text-sm text-ink">{pageTitle}</p>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="p-2 rounded-md text-muted hover:text-ink hover:bg-edge transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Avatar — tapping navigates to profile */}
        <button
          onClick={() => navigate('/dashboard/profile')}
          aria-label="Go to profile"
          className="w-8 h-8 rounded-full bg-teal/15 hover:bg-teal/25 flex items-center justify-center transition-colors cursor-pointer"
        >
          <span className="text-xs font-bold text-teal font-sans">
            {getInitials(user?.fullName)}
          </span>
        </button>
      </div>
    </header>
  )
}

// ── Mobile bottom navigation ─────────────────────────────────────────────────

/*
  BottomNav — visible only on mobile, replaces the sidebar.
  Fixed to the bottom of the viewport so it stays in place while the page scrolls.
*/
function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-edge z-30"
      aria-label="Mobile navigation"
    >
      <div className="flex">
        {MOBILE_NAV.map(item => {
          const active = checkActive(item.path, item.end, pathname)
          const Icon   = item.icon
          // Show only the first word of the label to fit on small screens
          const shortLabel = item.label.split(' ')[0]
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              aria-label={item.label}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 no-underline"
            >
              <Icon
                size={19}
                className={active ? 'text-teal' : 'text-muted'}
                strokeWidth={active ? 2.5 : 1.75}
              />
              <span className={`text-[9px] font-sans font-medium ${active ? 'text-teal' : 'text-muted'}`}>
                {shortLabel}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

// ── Root layout component ────────────────────────────────────────────────────

function DashboardLayout() {
  // Persist collapsed state across navigations
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('pf-sidebar-collapsed') === 'true'
  )

  function toggleSidebar() {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem('pf-sidebar-collapsed', String(next))
      return next
    })
  }

  return (
    <div className="flex h-screen bg-paper overflow-hidden">

      <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />

      {/* Right column: top bar + scrollable content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />

        {/* pb-20 on mobile so content clears the fixed bottom nav bar */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  )
}

export default DashboardLayout
