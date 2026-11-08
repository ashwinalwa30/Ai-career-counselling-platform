/*
  UiShowcase — temporary page at /ui to visually check every reusable component.
  Remove this page (and its route in App.jsx) before shipping the final product.
*/
import { useState } from 'react'
import { Mail, Lock, Search, User } from 'lucide-react'

import Button  from '../components/ui/Button'
import Card    from '../components/ui/Card'
import Badge   from '../components/ui/Badge'
import Input   from '../components/ui/Input'
import Modal   from '../components/ui/Modal'
import Loader  from '../components/ui/Loader'
import Navbar  from '../components/layout/Navbar'

// Groups a set of demos under a labelled section heading
function Section({ title, children }) {
  return (
    <section className="mb-12">
      <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-5">
        {title}
      </h2>
      {children}
    </section>
  )
}

function UiShowcase() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-paper px-4 py-24">
        <div className="max-w-3xl mx-auto">

          <div className="mb-12">
            <h1 className="text-3xl font-semibold text-ink mb-2">UI Components</h1>
            <p className="text-muted font-sans">PathFinder design system — visual check</p>
          </div>

          {/* ── BUTTONS ── */}
          <Section title="Button — variants">
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary (marigold)</Button>
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
              <Badge variant="default">Default (teal)</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning (marigold)</Badge>
              <Badge variant="error">Error</Badge>
              <Badge variant="neutral">Neutral</Badge>
            </div>
          </Section>

          {/* ── CARDS ── */}
          <Section title="Card — solid, glass, hover">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <p className="font-semibold text-ink mb-1">Solid Card</p>
                <p className="text-sm text-muted">Surface + border + shadow. The default.</p>
              </Card>
              <Card glass>
                <p className="font-semibold text-ink mb-1">Glass Card</p>
                <p className="text-sm text-muted">Warm-tinted backdrop blur. Use sparingly.</p>
              </Card>
              <Card hover>
                <p className="font-semibold text-ink mb-1">Hover Card</p>
                <p className="text-sm text-muted">Lifts on hover — good for clickable items.</p>
              </Card>
            </div>
          </Section>

          {/* ── INPUTS ── */}
          <Section title="Input — variants">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input id="demo-email"    label="Email address" type="email"    placeholder="you@example.com" icon={Mail} />
              <Input id="demo-password" label="Password"      type="password" placeholder="••••••••"        icon={Lock} />
              <Input id="demo-search"   label="Search"        type="search"   placeholder="Search careers…"  icon={Search} />
              <Input id="demo-error"    label="Username"                      placeholder="Enter username"   icon={User} error="This username is already taken." />
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
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Example Modal">
              <p className="text-sm text-muted mb-5">
                Closes on <kbd className="px-1.5 py-0.5 rounded bg-edge text-xs font-mono text-ink">Esc</kbd>,
                backdrop click, or the × button.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button size="sm" onClick={() => setModalOpen(false)}>Confirm</Button>
              </div>
            </Modal>
          </Section>

        </div>
      </div>
    </>
  )
}

export default UiShowcase
