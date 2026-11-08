/*
  UiShowcase — temporary page at /ui to visually check every reusable component.
  Remove this page (and its route) before shipping the final product.
*/
import { useState } from 'react'
import { Mail, Lock, Search, User } from 'lucide-react'

import Button  from '../components/ui/Button'
import Card    from '../components/ui/Card'
import Badge   from '../components/ui/Badge'
import Input   from '../components/ui/Input'
import Modal   from '../components/ui/Modal'
import Loader  from '../components/ui/Loader'
import { useTheme } from '../context/ThemeContext'

// A small section wrapper to visually group component demos
function Section({ title, children }) {
  return (
    <section className="mb-12">
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
        {title}
      </h2>
      {children}
    </section>
  )
}

function UiShowcase() {
  const { theme, toggleTheme } = useTheme()
  const [modalOpen, setModalOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto">

        {/* Page header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-gradient">UI Components</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              PathFinder design system — visual check
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={toggleTheme}>
            {theme === 'dark' ? '☀ Light' : '☽ Dark'}
          </Button>
        </div>

        {/* ── BUTTONS ── */}
        <Section title="Button — variants">
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </Section>

        <Section title="Button — sizes">
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </Section>

        <Section title="Button — states">
          <div className="flex flex-wrap items-center gap-3">
            <Button loading>Saving…</Button>
            <Button loading variant="outline">Loading outline</Button>
            <Button disabled>Disabled</Button>
            <Button variant="secondary" loading>Secondary load</Button>
          </div>
        </Section>

        {/* ── BADGES ── */}
        <Section title="Badge — variants">
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">Default</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="neutral">Neutral</Badge>
          </div>
        </Section>

        {/* ── CARDS ── */}
        <Section title="Card — solid, glass, hover">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Solid Card</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Default surface with border and soft shadow.</p>
            </Card>
            <Card glass>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Glass Card</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Backdrop-blur with translucent background.</p>
            </Card>
            <Card hover>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Hover Card</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Lifts on hover — good for clickable items.</p>
            </Card>
          </div>
        </Section>

        {/* ── INPUTS ── */}
        <Section title="Input — variants">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              id="demo-email"
              label="Email address"
              type="email"
              placeholder="you@example.com"
              icon={Mail}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
            />
            <Input
              id="demo-password"
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
            />
            <Input
              id="demo-search"
              label="Search"
              type="search"
              placeholder="Search careers…"
              icon={Search}
            />
            <Input
              id="demo-error"
              label="Username"
              placeholder="Enter username"
              icon={User}
              error="This username is already taken."
            />
          </div>
        </Section>

        {/* ── LOADER ── */}
        <Section title="Loader — sizes">
          <div className="flex items-center gap-6">
            <Loader size="sm" />
            <Loader size="md" />
            <Loader size="lg" />
          </div>
        </Section>

        {/* ── MODAL ── */}
        <Section title="Modal">
          <Button onClick={() => setModalOpen(true)}>Open Modal</Button>

          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Example Modal"
          >
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
              This modal closes when you press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-xs font-mono">Esc</kbd>,
              click the backdrop, or press the × button.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => setModalOpen(false)}>
                Confirm
              </Button>
            </div>
          </Modal>
        </Section>

      </div>
    </div>
  )
}

export default UiShowcase
