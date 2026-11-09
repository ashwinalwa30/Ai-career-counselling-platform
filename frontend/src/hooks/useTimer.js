/*
  useTimer — countdown timer for the aptitude test.

  Counts down from 'initialSeconds' (default 30 × 60 = 1 800).
  Fires 'onExpire' exactly once when it reaches zero — the test page uses
  this to trigger auto-submission.

  Colour thresholds returned as a Tailwind class:
    > 5 min   → 'text-ink'        (normal)
    ≤ 5 min   → 'text-marigold'   (caution)
    ≤ 1 min   → 'text-terracotta' (urgent)

  Design notes:
  - The interval is cleared in the useEffect cleanup so no setState calls
    fire after the component unmounts.
  - onExpire is stored in a ref so the caller can pass a fresh function
    reference on each render without restarting the interval.
  - A second effect watches 'remaining' for the zero condition so the
    interval callback stays a pure counter with no side-effects.
*/
import { useState, useEffect, useRef } from 'react'

export function useTimer(initialSeconds = 30 * 60, onExpire) {
  const [remaining, setRemaining] = useState(initialSeconds)

  // Keep the callback in a ref — updating it won't restart the interval
  const callbackRef = useRef(onExpire)
  useEffect(() => { callbackRef.current = onExpire }, [onExpire])

  // Guard so onExpire fires at most once even if 'remaining' hits 0 twice
  const firedRef = useRef(false)

  // ── Start the interval on mount, clear it on unmount ──────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      // Functional update avoids stale closure on 'remaining'
      setRemaining(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(id)
  }, [])  // empty deps: start once, stop on unmount

  // ── Watch for expiry in a separate effect (keeps the setter pure) ─────────
  useEffect(() => {
    if (remaining === 0 && !firedRef.current) {
      firedRef.current = true
      callbackRef.current?.()
    }
  }, [remaining])

  // ── Derived display values ─────────────────────────────────────────────────

  const mins      = Math.floor(remaining / 60)
  const secs      = remaining % 60
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  // The colour class changes automatically as time decreases
  let colourClass = 'text-ink'
  if      (remaining <= 60)  colourClass = 'text-terracotta'
  else if (remaining <= 300) colourClass = 'text-marigold'

  return { remaining, formatted, colourClass }
}
