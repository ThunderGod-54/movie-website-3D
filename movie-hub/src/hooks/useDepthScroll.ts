import { useLayoutEffect } from 'react'
import type { RefObject } from 'react'

/**
 * Drives the "fly-through" motion on the landing page.
 *
 * It does NOT move anything itself. It only writes two kinds of CSS custom
 * properties, and LandingMotion.css turns them into transform/opacity:
 *
 *   --hero-p   (on the root)       0 → 1  how far the hero has been "passed"
 *   --row-e    (on each .poster-row) 0 → 1  how far that row has emerged from depth
 *
 * The scroll value is damped (exponential smoothing), so layers keep gliding for
 * a moment after the wheel stops and then settle: burst, then hold.
 * Native scrolling is never intercepted.
 */

const SMOOTHING = 5.5 // higher = snappier catch-up (≈95% settled in 0.55s)

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

// Sum of offsetTop up the tree: unlike getBoundingClientRect it ignores CSS
// transforms, so measuring mid-animation never gives a shifted answer.
function absoluteTop(el: HTMLElement): number {
	let y = 0
	let node: HTMLElement | null = el
	while (node) {
		y += node.offsetTop
		node = node.offsetParent as HTMLElement | null
	}
	return y
}

export function useDepthScroll(rootRef: RefObject<HTMLElement | null>) {
	// Layout effect so the first values are written before the first paint
	// (otherwise below-the-fold cards would flash at full opacity, then hide).
	useLayoutEffect(() => {
		const root = rootRef.current
		if (!root) return

		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
		// CSS falls back to the resting state when the variables are absent.
		if (reduceMotion.matches) return

		const hero = root.querySelector<HTMLElement>('.landing-hero')
		const rows = Array.from(root.querySelectorAll<HTMLElement>('.poster-row'))

		let vh = window.innerHeight
		let maxScroll = 0
		let heroSpan = 1
		let rowTops: number[] = []
		const lastRowE: number[] = rows.map(() => -1)
		let lastHeroP = -1

		let current = window.scrollY
		let target = current
		let raf = 0
		let lastTime = 0

		const measure = () => {
			vh = window.innerHeight
			maxScroll = Math.max(0, document.documentElement.scrollHeight - vh)
			rowTops = rows.map(absoluteTop)
			heroSpan = Math.max(1, (hero?.offsetHeight ?? vh) * 0.85)
		}

		const apply = (scroll: number) => {
			const heroP = clamp01(scroll / heroSpan)
			if (Math.abs(heroP - lastHeroP) > 0.0005) {
				lastHeroP = heroP
				root.style.setProperty('--hero-p', heroP.toFixed(4))
			}

			rows.forEach((row, i) => {
				const top = rowTops[i] - scroll // row's top edge in viewport coordinates
				const start = vh * 0.96 // row is just peeking in → e = 0
				// Row is fully "arrived" once it passes the 50% line, or at the very
				// bottom of the page if it can never get that high. This guarantees
				// the resting state at max scroll is always fully visible.
				const end = Math.max(vh * 0.5, rowTops[i] - maxScroll)

				let e: number
				if (rowTops[i] < vh * 0.88) {
					e = 1 // already on screen at load (tall viewports): never hide it
				} else {
					const span = start - end
					const raw = span <= 1 ? (top <= end ? 1 : 0) : clamp01((start - top) / span)
					e = easeOutCubic(raw)
				}

				if (Math.abs(e - lastRowE[i]) > 0.0005) {
					lastRowE[i] = e
					row.style.setProperty('--row-e', e.toFixed(4))
				}
			})
		}

		const tick = (now: number) => {
			const dt = Math.min(0.05, (now - lastTime) / 1000)
			lastTime = now
			current += (target - current) * (1 - Math.exp(-dt * SMOOTHING))
			if (Math.abs(target - current) < 0.1) current = target
			apply(current)
			raf = current === target ? 0 : requestAnimationFrame(tick)
		}

		// The loop only runs while the value is still catching up, then sleeps.
		const wake = () => {
			if (raf) return
			lastTime = performance.now()
			raf = requestAnimationFrame(tick)
		}

		const onScroll = () => {
			target = window.scrollY
			wake()
		}

		const onResize = () => {
			measure()
			target = window.scrollY
			apply(current)
			wake()
		}

		measure()
		apply(current)

		window.addEventListener('scroll', onScroll, { passive: true })
		window.addEventListener('resize', onResize)
		// Fonts loading / layout shifts change page height without a window resize.
		const observer = new ResizeObserver(onResize)
		observer.observe(root)

		return () => {
			window.removeEventListener('scroll', onScroll)
			window.removeEventListener('resize', onResize)
			observer.disconnect()
			if (raf) cancelAnimationFrame(raf)
		}
	}, [rootRef])
}
