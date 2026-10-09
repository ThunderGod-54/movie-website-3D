import { useEffect, useRef, useState, useCallback } from 'react'
import './DoodleUniverse.css'

type DoodleItem = {
  id: string
  title: string
  note: string
  kind: string
  color?: string
}

const COLS = 4
const ROWS = 4
const PARTICLE_COUNT = COLS * ROWS

const CINEMA_DOODLES: DoodleItem[] = [
  { id: 'popcorn', title: 'Butter & Light', note: 'A little salty, a little sweet. Popcorn for the plot.', kind: 'popcorn', color: '#d65a3a' },
  { id: 'ticket', title: 'Admit One', note: 'Save your stub. Good stories stay awhile.', kind: 'ticket', color: '#26231f' },
  { id: 'reel', title: 'The 35mm Reel', note: 'Spinning tales at twenty-four frames a second.', kind: 'reel', color: '#d65a3a' },
  { id: 'camera', title: 'Close-Up Club', note: 'Speed, sound, and rolling the big picture camera.', kind: 'camera', color: '#26231f' },
  { id: 'seat', title: 'Soft Landing', note: 'Velvet row 4, seat 12. Your favourite spot is waiting.', kind: 'seat', color: '#d65a3a' },
  { id: 'projector', title: 'Through the Beam', note: 'A dusty silver ray of cinema light across the hall.', kind: 'projector', color: '#26231f' },
  { id: 'clapperboard', title: 'Take One', note: 'Quiet on set. Action in three, two, one.', kind: 'clapperboard', color: '#d65a3a' },
  { id: 'glasses3d', title: 'Extra Dimension', note: 'Put them on and reach out for the floating meteor.', kind: 'glasses3d', color: '#26231f' },
  { id: 'soda', title: 'Fountain Fizz', note: 'Ice-cold cola, paper straw, and theatre whispers.', kind: 'soda', color: '#d65a3a' },
  { id: 'filmstrip', title: 'Frame by Frame', note: 'Celluloid ribbon holding frozen memories.', kind: 'filmstrip', color: '#26231f' },
  { id: 'director-chair', title: 'In the Chair', note: 'Every great evening out needs a director.', kind: 'director-chair', color: '#d65a3a' },
  { id: 'star-award', title: 'Golden Star', note: 'Honouring the late nights worth remembering.', kind: 'star-award', color: '#26231f' },
  { id: 'megaphone', title: 'Call to Action', note: 'From the director with love: that’s a wrap!', kind: 'megaphone', color: '#d65a3a' },
  { id: 'marquee-sign', title: 'Now Showing', note: 'Bright marquee lights guiding you in from the rain.', kind: 'marquee-sign', color: '#26231f' },
]

// Size variation scale multipliers for visual richness and depth rhythm
const SCALE_VARIATIONS = [0.85, 1.15, 0.92, 1.25, 1.0, 0.88, 1.2, 0.95, 1.1, 1.3, 0.9, 1.05, 1.18, 0.82, 1.22, 1.0]

function CinemaDoodleSvg({ kind }: { kind: string }) {
  const lineProps = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 3,
  }

  switch (kind) {
    case 'popcorn':
      return (
        <svg viewBox="0 0 180 160" aria-hidden="true" className="doodle-svg">
          <path d="M45 62h91l-12 65H57z" {...lineProps} />
          <path d="M49 62c-8-20 9-32 21-20 1-20 26-24 32-5 12-18 34-8 29 11 19 4 16 26 0 27M61 78l8 40m21-39-1 41m25-40-7 39" {...lineProps} />
          <path d="M70 49c7 4 11 9 12 15m29-23c-8 4-12 11-12 19" {...lineProps} />
        </svg>
      )
    case 'ticket':
      return (
        <svg viewBox="0 0 180 160" aria-hidden="true" className="doodle-svg">
          <path d="M37 48q0-7 8-7h91q8 0 8 7v19a14 14 0 0 0 0 27v17q0 8-8 8H45q-8 0-8-8V94a14 14 0 0 0 0-27z" {...lineProps} />
          <path d="M92 45v13m0 11v11m0 11v11m0 11v8M58 63h19m-19 19h14m-14 20h18" {...lineProps} />
          <path d="m107 81 8 8 15-18" {...lineProps} />
        </svg>
      )
    case 'reel':
      return (
        <svg viewBox="0 0 180 160" aria-hidden="true" className="doodle-svg">
          <circle cx="91" cy="83" r="48" {...lineProps} />
          <circle cx="91" cy="83" r="12" {...lineProps} />
          <circle cx="91" cy="53" r="10" {...lineProps} />
          <circle cx="117" cy="98" r="10" {...lineProps} />
          <circle cx="65" cy="98" r="10" {...lineProps} />
          <path d="M126 48c12 1 20 9 22 21m-1 30c-2 11-9 19-20 22" {...lineProps} />
        </svg>
      )
    case 'camera':
      return (
        <svg viewBox="0 0 180 160" aria-hidden="true" className="doodle-svg">
          <path d="M39 64h27l10-15h34l10 15h20q8 0 8 8v48q0 8-8 8H39q-8 0-8-8V72q0-8 8-8z" {...lineProps} />
          <circle cx="92" cy="94" r="23" {...lineProps} />
          <circle cx="92" cy="94" r="13" {...lineProps} />
          <path d="M129 77h8m-88 0h8" {...lineProps} />
        </svg>
      )
    case 'seat':
      return (
        <svg viewBox="0 0 180 160" aria-hidden="true" className="doodle-svg">
          <path d="M57 67V51q0-9 9-9h47q9 0 9 9v30q0 8-9 8H76q-19 0-19-22zM49 89h75q9 0 9 9v15q0 9-9 9H49q-9 0-9-9V98q0-9 9-9zm7 34-7 13m68-13 8 13" {...lineProps} />
          <path d="M70 59h42M53 102h67" {...lineProps} />
        </svg>
      )
    case 'projector':
      return (
        <svg viewBox="0 0 180 160" aria-hidden="true" className="doodle-svg">
          <path d="M44 70h94q9 0 9 9v39q0 8-9 8H44q-9 0-9-8V79q0-9 9-9z" {...lineProps} />
          <circle cx="69" cy="93" r="13" {...lineProps} />
          <circle cx="111" cy="93" r="13" {...lineProps} />
          <path d="M60 70 53 50h62l-8 20m16-24h20m-10-10v20M64 126l-8 13m59-13 8 13" {...lineProps} />
          <path d="M153 87q22 6 0 12m0 10q35 10 0 20" {...lineProps} />
        </svg>
      )
    case 'clapperboard':
      return (
        <svg viewBox="0 0 180 160" aria-hidden="true" className="doodle-svg">
          <rect x="42" y="66" width="96" height="64" rx="4" {...lineProps} />
          <path d="M39 66 137 43l5 18-97 22z" {...lineProps} />
          <path d="M63 60l11-16m21 12l11-16m-62 38h76M54 94h38m-38 18h24m34-18l14 14m0-14l-14 14" {...lineProps} />
        </svg>
      )
    case 'glasses3d':
      return (
        <svg viewBox="0 0 180 160" aria-hidden="true" className="doodle-svg">
          <path d="M36 72h108l-8 32q-6 10-18 10h-16q-10 0-14-10l-4-9-4 9q-4 10-14 10H48q-12 0-18-10z" {...lineProps} />
          <path d="M48 82h24v18H48zm60 0h24v18h-24z" {...lineProps} />
          <path d="M36 76l-10-14m118 14l10-14" {...lineProps} />
        </svg>
      )
    case 'soda':
      return (
        <svg viewBox="0 0 180 160" aria-hidden="true" className="doodle-svg">
          <path d="M56 60h68l-10 74H66z" {...lineProps} />
          <path d="M52 54h76v6H52z" {...lineProps} />
          <path d="M96 28 86 54m16-16-14 6" {...lineProps} />
          <circle cx="90" cy="94" r="16" {...lineProps} />
          <path d="M84 94h12m-6-6v12" {...lineProps} />
        </svg>
      )
    case 'filmstrip':
      return (
        <svg viewBox="0 0 180 160" aria-hidden="true" className="doodle-svg">
          <path d="M36 50q24-18 54 0t54 0v64q-24-18-54 0t-54 0z" {...lineProps} />
          <path d="M36 64q24-18 54 0t54 0M36 100q24-18 54 0t54 0" {...lineProps} />
          <circle cx="50" cy="56" r="3" fill="currentColor" />
          <circle cx="76" cy="60" r="3" fill="currentColor" />
          <circle cx="104" cy="56" r="3" fill="currentColor" />
          <circle cx="130" cy="60" r="3" fill="currentColor" />
          <circle cx="50" cy="108" r="3" fill="currentColor" />
          <circle cx="76" cy="112" r="3" fill="currentColor" />
          <circle cx="104" cy="108" r="3" fill="currentColor" />
          <circle cx="130" cy="112" r="3" fill="currentColor" />
        </svg>
      )
    case 'director-chair':
      return (
        <svg viewBox="0 0 180 160" aria-hidden="true" className="doodle-svg">
          <path d="M54 44v34m72-34v34M50 48h80M50 78h80" {...lineProps} />
          <path d="M54 82 126 132M126 82 54 132" {...lineProps} />
          <path d="M46 116h88" {...lineProps} />
          <path d="M90 56l3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z" {...lineProps} />
        </svg>
      )
    case 'star-award':
      return (
        <svg viewBox="0 0 180 160" aria-hidden="true" className="doodle-svg">
          <path d="M90 38l12 28 30 3-23 20 7 30-26-15-26 15 7-30-23-20 30-3z" {...lineProps} />
          <circle cx="90" cy="78" r="8" {...lineProps} />
          <path d="M42 46l4 8 8 4-8 4-4 8-4-8-8-4 8-4zm96 60l3 6 6 3-6 3-3 6-3-6-6-3 6-3z" {...lineProps} />
        </svg>
      )
    case 'megaphone':
      return (
        <svg viewBox="0 0 180 160" aria-hidden="true" className="doodle-svg">
          <path d="M52 82 124 54v60L52 86z" {...lineProps} />
          <ellipse cx="52" cy="84" rx="6" ry="12" {...lineProps} />
          <ellipse cx="124" cy="84" rx="10" ry="30" {...lineProps} />
          <path d="M78 86v26h12V82" {...lineProps} />
          <path d="M140 76q12 8 0 16m8-24q20 16 0 32" {...lineProps} />
        </svg>
      )
    case 'marquee-sign':
    default:
      return (
        <svg viewBox="0 0 180 160" aria-hidden="true" className="doodle-svg">
          <path d="M44 64h72l24 20-24 20H44z" {...lineProps} />
          <path d="M54 74h52v20H54z" {...lineProps} />
          <circle cx="50" cy="69" r="2" fill="currentColor" />
          <circle cx="70" cy="69" r="2" fill="currentColor" />
          <circle cx="90" cy="69" r="2" fill="currentColor" />
          <circle cx="110" cy="69" r="2" fill="currentColor" />
          <circle cx="128" cy="84" r="2" fill="currentColor" />
          <circle cx="110" cy="99" r="2" fill="currentColor" />
          <circle cx="90" cy="99" r="2" fill="currentColor" />
          <circle cx="70" cy="99" r="2" fill="currentColor" />
          <circle cx="50" cy="99" r="2" fill="currentColor" />
        </svg>
      )
  }
}

type ParticleState = {
  el: HTMLDivElement | null
  baseX: number
  baseY: number
  baseScale: number
  phase: number
  rot: number
  driftAmpX: number
  driftAmpY: number
  driftFreqX: number
  driftFreqY: number
  driftPhase: number
  baseIndex: number
  cycleCount: number
  lastWrapped: number | null
  doodle: DoodleItem
}

interface DoodleUniverseProps {
  isActivated: boolean
  isModalOpen?: boolean
}

export function DoodleUniverse({ isActivated, isModalOpen = false }: DoodleUniverseProps) {
  const sceneRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const particleRefs = useRef<(HTMLDivElement | null)[]>([])
  const [selectedDoodle, setSelectedDoodle] = useState<DoodleItem | null>(null)

  // Configuration tuned for full-screen edge-to-edge depth flight
  const config = useRef({
    perspective: 840,
    depth: 2600,
    speed: 1.6,
    autoSpeed: 110, // constant forward cruising speed (units/s)
    smoothing: 0.08,
    cols: COLS,
    rows: ROWS,
    spreadX: 1200,
    spreadY: 700,
    deadZone: 0.18, // wrap region where opacity is 0
    fadeIn: 0.18,   // fade in from far plane
    fadeOut: 0.10,  // fade out before passing camera
  })

  const targetZRef = useRef(0)
  const currentZRef = useRef(0)
  const particlesRef = useRef<ParticleState[]>([])
  const isHoveredRef = useRef(false)
  const isReducedMotionRef = useRef(false)

  // Close modal with escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedDoodle(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const buildParticles = useCallback(() => {
    const C = config.current
    const COUNT = PARTICLE_COUNT
    const cellW = (C.spreadX * 2) / C.cols
    const cellH = (C.spreadY * 2) / C.rows
    const pool = CINEMA_DOODLES

    const list: ParticleState[] = []
    for (let i = 0; i < COUNT; i++) {
      const col = i % C.cols
      const row = Math.floor(i / C.cols)
      
      // Organic pseudo-random offset within each cell to avoid rigid lines
      const jitterX = Math.sin(i * 47 + 1.2) * (cellW * 0.22)
      const jitterY = Math.cos(i * 73 + 2.1) * (cellH * 0.22)
      
      const baseX = -C.spreadX + cellW * (col + 0.5) + jitterX
      const baseY = -C.spreadY + cellH * (row + 0.5) + jitterY
      const baseIndex = i % pool.length
      const rot = Math.sin(i * 99 + 1) * 9 // seed rotation between -9deg and +9deg
      const baseScale = SCALE_VARIATIONS[i % SCALE_VARIATIONS.length]

      // Varied lateral and vertical drift amplitudes and frequencies for organic movement directions
      const driftAmpX = 14 + (Math.abs(Math.sin(i * 31 + 4)) * 22)
      const driftAmpY = 10 + (Math.abs(Math.cos(i * 59 + 7)) * 16)
      const driftFreqX = 1.1 + (i % 3) * 0.35
      const driftFreqY = 0.9 + (i % 4) * 0.3
      const driftPhase = (i * 1.618033) % (Math.PI * 2)

      list.push({
        el: particleRefs.current[i] || null,
        baseX,
        baseY,
        baseScale,
        phase: i / COUNT,
        rot,
        driftAmpX,
        driftAmpY,
        driftFreqX,
        driftFreqY,
        driftPhase,
        baseIndex,
        cycleCount: 0,
        lastWrapped: null,
        doodle: pool[baseIndex],
      })
    }
    particlesRef.current = list
  }, [])

  useEffect(() => {
    // Check reduced motion
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    isReducedMotionRef.current = mq.matches
    const handleMotionChange = (e: MediaQueryListEvent) => {
      isReducedMotionRef.current = e.matches
    }
    mq.addEventListener('change', handleMotionChange)

    // Full viewport edge-to-edge spread calculation
    const updateSpread = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      config.current.spreadX = Math.max(w * 0.54, 580)
      config.current.spreadY = Math.max(h * 0.46, 380)
      config.current.perspective = w <= 768 ? 680 : 840
      
      if (sceneRef.current) {
        sceneRef.current.style.perspective = `${config.current.perspective}px`
      }
      buildParticles()
    }
    updateSpread()
    window.addEventListener('resize', updateSpread)

    // Continuous 3D animation loop
    let rafId = 0
    let lastTime = performance.now()

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000)
      lastTime = now

      // If not activated yet, pause the flight and don't advance
      if (!isActivated) {
        rafId = requestAnimationFrame(tick)
        return
      }

      const C = config.current

      // Continuous autonomous cruise forward (uninterrupted during sign-in modal)
      if ((isModalOpen || (!isHoveredRef.current && !selectedDoodle)) && !isReducedMotionRef.current) {
        targetZRef.current += C.autoSpeed * dt
      }

      // Smooth exponential catch-up
      currentZRef.current += (targetZRef.current - currentZRef.current) * C.smoothing

      const currentZ = currentZRef.current
      const particles = particlesRef.current
      const pool = CINEMA_DOODLES

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        const el = particleRefs.current[i]
        if (!el) continue

        const raw = p.phase * C.depth + currentZ
        const wrapped = ((raw % C.depth) + C.depth) % C.depth
        const z = wrapped - C.depth
        const t = (z + C.depth) / C.depth

        // Deterministic doodle cycling within the dead zone
        if (p.lastWrapped !== null) {
          if (wrapped < p.lastWrapped - C.depth * 0.5) {
            p.cycleCount++
            const nextIdx = ((p.baseIndex + p.cycleCount) % pool.length + pool.length) % pool.length
            p.doodle = pool[nextIdx]
            const titleEl = el.querySelector<HTMLElement>('.doodle-title')
            if (titleEl) titleEl.textContent = p.doodle.title
            el.dataset.kind = p.doodle.kind
          } else if (wrapped > p.lastWrapped + C.depth * 0.5) {
            p.cycleCount--
            const nextIdx = ((p.baseIndex + p.cycleCount) % pool.length + pool.length) % pool.length
            p.doodle = pool[nextIdx]
            const titleEl = el.querySelector<HTMLElement>('.doodle-title')
            if (titleEl) titleEl.textContent = p.doodle.title
            el.dataset.kind = p.doodle.kind
          }
        }
        p.lastWrapped = wrapped

        // Seamless opacity curve: zero jumps or blank gaps
        let opacity = 1
        if (t < C.deadZone) {
          opacity = 0
        } else if (C.fadeIn > 0 && t < C.deadZone + C.fadeIn) {
          opacity = (t - C.deadZone) / C.fadeIn
        }
        if (C.fadeOut > 0 && t > 1 - C.fadeOut) {
          opacity = Math.min(opacity, (1 - t) / C.fadeOut)
        }

        // Varied organic drift direction across X and Y based on depth progress
        const curX = p.baseX + Math.sin(t * Math.PI * p.driftFreqX + p.driftPhase) * p.driftAmpX
        const curY = p.baseY + Math.cos(t * Math.PI * p.driftFreqY + p.driftPhase) * p.driftAmpY
        const curRot = p.rot + Math.sin(t * Math.PI * 2 + p.driftPhase) * 5

        // GPU composite layer transform with varied scale multiplier
        el.style.transform = `translate3d(${curX.toFixed(1)}px, ${curY.toFixed(1)}px, ${z.toFixed(1)}px) scale(${p.baseScale}) rotate(${curRot.toFixed(1)}deg)`
        el.style.opacity = opacity.toFixed(3)
        el.style.pointerEvents = opacity > 0.08 ? 'auto' : 'none'
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', updateSpread)
      mq.removeEventListener('change', handleMotionChange)
    }
  }, [buildParticles, isActivated, isModalOpen, selectedDoodle])

  // Passive wheel gliding across depth (works for scrolling up and down smoothly)
  useEffect(() => {
    if (!isActivated) return

    const handleWindowWheel = (e: WheelEvent) => {
      if (selectedDoodle || isModalOpen) return
      // Glides through depth without triggering browser page layout shifts
      targetZRef.current += e.deltaY * config.current.speed
    }

    let touchStartY = 0
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) touchStartY = e.touches[0].clientY
    }
    const handleTouchMove = (e: TouchEvent) => {
      if (selectedDoodle || isModalOpen || e.touches.length === 0) return
      const currentY = e.touches[0].clientY
      const delta = touchStartY - currentY
      touchStartY = currentY
      targetZRef.current += delta * config.current.speed * 1.5
    }

    window.addEventListener('wheel', handleWindowWheel, { passive: true })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })

    return () => {
      window.removeEventListener('wheel', handleWindowWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [isActivated, isModalOpen, selectedDoodle])

  return (
    <div
      className={`doodle-universe-layer ${isActivated ? 'is-active' : 'is-paused'}`}
      aria-hidden={!isActivated}
    >
      <div
        className="doodle-scene"
        ref={sceneRef}
        onMouseEnter={() => {
          isHoveredRef.current = true
        }}
        onMouseLeave={() => {
          isHoveredRef.current = false
        }}
        role="region"
        aria-label="3D cinema doodle infinite universe"
      >
        <div className="doodle-world" ref={worldRef}>
          {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
            const doodle = CINEMA_DOODLES[i % CINEMA_DOODLES.length]
            return (
              <div
                key={i}
                ref={(el) => {
                  particleRefs.current[i] = el
                }}
                className={`doodle-particle doodle-particle-${doodle.color === '#d65a3a' ? 'accent' : 'ink'}`}
                data-kind={doodle.kind}
                onClick={() => {
                  const currentDoodle = particlesRef.current[i]?.doodle || doodle
                  setSelectedDoodle(currentDoodle)
                }}
                title={`Inspect: ${doodle.title}`}
                tabIndex={isActivated ? 0 : -1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    const currentDoodle = particlesRef.current[i]?.doodle || doodle
                    setSelectedDoodle(currentDoodle)
                  }
                }}
              >
                <div className="doodle-art-wrapper">
                  <CinemaDoodleSvg kind={doodle.kind} />
                </div>
                <span className="doodle-title">{doodle.title}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Inspect Doodle Modal Dialog */}
      {selectedDoodle && (
        <div className="doodle-modal-backdrop" onClick={() => setSelectedDoodle(null)}>
          <div
            className="doodle-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-doodle-title"
          >
            <button
              type="button"
              className="doodle-modal-close"
              onClick={() => setSelectedDoodle(null)}
              aria-label="Close doodle details"
            >
              ✕
            </button>
            <span className="modal-kicker">CINEMA DOODLE</span>
            <div className={`modal-art-box ${selectedDoodle.color === '#d65a3a' ? 'is-accent' : 'is-ink'}`}>
              <CinemaDoodleSvg kind={selectedDoodle.kind} />
            </div>
            <h3 id="modal-doodle-title" className="modal-title">{selectedDoodle.title}</h3>
            <p className="modal-note">{selectedDoodle.note}</p>
            <button
              type="button"
              className="modal-action-btn"
              onClick={() => setSelectedDoodle(null)}
            >
              Back to the flight ↗
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
