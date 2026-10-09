import { useState, useEffect, useRef } from 'react'

/**
 * Detects the first user scroll / downward wheel / touch gesture to trigger
 * the one-time transition from the initial hero to the full-viewport doodle universe.
 *
 * Characteristics:
 * - Triggers strictly ONCE per page load / reload.
 * - Immediately cleans up all event listeners upon triggering.
 * - Scrolling back up never restores the initial hero or resets the animation.
 * - Clean teardown on unmount.
 */
export function useScrollActivation(): boolean {
  const [isActivated, setIsActivated] = useState(false)
  const activatedRef = useRef(false)

  useEffect(() => {
    // If already activated, no need to attach listeners
    if (activatedRef.current) return

    const activate = () => {
      if (activatedRef.current) return
      activatedRef.current = true
      setIsActivated(true)
      cleanup()
    }

    // Downward wheel or trackpad scroll gesture
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) {
        activate()
      }
    }

    // Downward touch drag gesture on mobile / tablets
    let touchStartY = 0
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartY = e.touches[0].clientY
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const deltaY = touchStartY - e.touches[0].clientY
        // Meaningful downward scroll gesture threshold
        if (deltaY > 10) {
          activate()
        }
      }
    }

    // Downward navigation keys
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ' || e.key === 'Enter') {
        activate()
      }
    }

    // Native scroll event fallback
    const onScroll = () => {
      if (window.scrollY > 0) {
        activate()
      }
    }

    const cleanup = () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onScroll)
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', onScroll, { passive: true })

    return cleanup
  }, [])

  return isActivated
}

/**
 * Backward-compatible stub for useDepthScroll if needed elsewhere.
 */
export function useDepthScroll() {
  // Retained for API compatibility
}
