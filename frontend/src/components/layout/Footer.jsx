/*
  Footer — site-wide bottom section for public pages.
  Four columns: brand blurb, quick links, resources, contact.
*/
import { Compass, Mail, MapPin } from 'lucide-react'

const QUICK_LINKS = [
  { label: 'Home',         href: '#home' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Careers',      href: '#careers' },
  { label: 'FAQ',          href: '#faq' },
]

const RESOURCES = [
  { label: 'Aptitude Test',   href: '/test' },
  { label: 'Career Explorer', href: '/careers' },
  { label: 'AI Counsellor',   href: '/chat' },
  { label: 'Compare Careers', href: '/compare' },
]

function ColumnHeading({ children }) {
  return (
    <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-4">
      {children}
    </h3>
  )
}

function FooterLink({ href, children }) {
  return (
    <li>
      <a
        href={href}
        className="text-sm text-muted hover:text-teal no-underline transition-colors duration-150"
      >
        {children}
      </a>
    </li>
  )
}

function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-edge bg-surface">
      {/* Main grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Brand column */}
        <div className="sm:col-span-2 lg:col-span-1">
          <a
            href="#home"
            aria-label="PathFinder home"
            className="inline-flex items-center gap-2 no-underline hover:opacity-80 transition-opacity mb-4"
          >
            <Compass size={20} className="text-teal" strokeWidth={2.5} />
            <span className="font-sans font-extrabold text-base tracking-tight text-ink">
              PathFinder
            </span>
          </a>
          <p className="text-sm text-muted leading-relaxed max-w-xs">
            Free AI-powered career counselling for every Indian student in Class 8–12.
            Discover your strengths, explore pathways, and plan your future.
          </p>
        </div>

        {/* Quick links */}
        <div>
          <ColumnHeading>Quick links</ColumnHeading>
          <ul className="space-y-2.5">
            {QUICK_LINKS.map(link => (
              <FooterLink key={link.href} href={link.href}>{link.label}</FooterLink>
            ))}
          </ul>
        </div>

        {/* Resources */}
        <div>
          <ColumnHeading>Resources</ColumnHeading>
          <ul className="space-y-2.5">
            {RESOURCES.map(link => (
              <FooterLink key={link.href} href={link.href}>{link.label}</FooterLink>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <ColumnHeading>Contact</ColumnHeading>
          <ul className="space-y-3">
            <li className="flex items-start gap-2 text-sm text-muted">
              <Mail size={14} className="mt-0.5 shrink-0 text-teal" />
              <a href="mailto:support@pathfinder.edu" className="hover:text-teal no-underline transition-colors duration-150">
                support@pathfinder.edu
              </a>
            </li>
            <li className="flex items-start gap-2 text-sm text-muted">
              <MapPin size={14} className="mt-0.5 shrink-0 text-teal" />
              <span>India</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-edge">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 text-center text-xs text-muted">
          &copy; {year} PathFinder. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

export default Footer
