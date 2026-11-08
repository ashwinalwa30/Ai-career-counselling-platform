/*
  useCountUp — animates a number from 0 to `target` once the returned `ref`
  is scrolled into view. Uses requestAnimationFrame with an ease-out curve
  so the counter rushes up and settles smoothly at the end.
*/
import { useState, useEffect, useRef } from 'react'
import { useInView } from 'framer-motion'

function useCountUp(target, duration = 1800) {
  const ref     = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return

    let startTime = null

    function step(timestamp) {
      if (!startTime) startTime = timestamp
      const elapsed  = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease-out cubic: fast at start, slows near the target
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))

      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        setCount(target)   // ensure we land exactly on target
      }
    }

    requestAnimationFrame(step)
  }, [isInView, target, duration])

  return { count, ref }
}

export default useCountUp
