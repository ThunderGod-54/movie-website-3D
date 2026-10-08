import { Canvas } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import LobbyScene from '../components/three/LobbyScene'
import './Home.css'

const stops = [
  { name: 'Entrance', short: '01' },
  { name: 'Now showing', short: '02' },
  { name: 'Screening room', short: '03' },
]

const fallbackMovies = [
  { title: 'The Moonlit Garden', meta: 'Fantasy · 1h 48m', color: 'sage' },
  { title: 'A Very Good Heist', meta: 'Comedy · 2h 04m', color: 'coral' },
  { title: 'Paper Planets', meta: 'Adventure · 1h 56m', color: 'blue' },
]

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

function Home() {
  const [webglAvailable, setWebglAvailable] = useState<boolean | null>(null)
  const [activeStop, setActiveStop] = useState(0)
  const [showList, setShowList] = useState(false)
  const pointerRef = useRef({ x: 0, y: 0 })
  const gestureStartRef = useRef<number | null>(null)
  // Debounce wheel so rapid scrolls don't skip multiple stops at once
  const wheelCooldownRef = useRef(false)

  useEffect(() => {
    setWebglAvailable(supportsWebGL())
  }, [])

  function moveStop(direction: number) {
    setActiveStop((current) => (current + direction + stops.length) % stops.length)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    pointerRef.current = {
      x: ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      y: 1 - ((event.clientY - bounds.top) / bounds.height) * 2,
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'touch') gestureStartRef.current = event.clientX
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (gestureStartRef.current === null) return
    const distance = event.clientX - gestureStartRef.current
    gestureStartRef.current = null
    if (Math.abs(distance) > 55) moveStop(distance < 0 ? 1 : -1)
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    if (Math.abs(event.deltaY) <= 10 || wheelCooldownRef.current) return
    wheelCooldownRef.current = true
    moveStop(event.deltaY > 0 ? 1 : -1)
    // 500ms cooldown prevents blasting through all stops on a trackpad flick
    setTimeout(() => { wheelCooldownRef.current = false }, 500)
  }

  const canRender = webglAvailable === true && !showList

  return (
    <main
      className="lobby-page"
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
    >
      <header className="lobby-header">
        <Link className="lobby-home-link" to="/" aria-label="Return to Goodshow home">
          <span aria-hidden="true">←</span> Goodshow
        </Link>
        <p className="lobby-header-note"><span aria-hidden="true">✳</span> THE PICTURE HOUSE</p>
        <button className="lobby-list-toggle" type="button" onClick={() => setShowList((value) => !value)}>
          {showList ? 'Return to room' : 'Skip to list'}
        </button>
      </header>

      <div className="lobby-stage" aria-label="Interactive theatre lobby">
        {canRender && (
          <Canvas
            className="lobby-canvas"
            // Cap DPR at 1.5 — 2× is expensive on mobile with negligible visual gain
            dpr={[1, 1.5]}
            camera={{ position: [0, 4.2, 12], fov: 42, near: 0.1, far: 100 }}
            gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
            shadows
            // frameloop="demand" would save power but camera rig needs continuous updates
            frameloop="always"
          >
            <color attach="background" args={['#d7d2c4']} />
            <LobbyScene activeStop={activeStop} pointerRef={pointerRef} />
          </Canvas>
        )}

        {webglAvailable === null && !showList && (
          <div className="lobby-loading" role="status"><span>✳</span> Turning on the lights...</div>
        )}

        {(!webglAvailable || showList) && (
          <section className="lobby-list-view" aria-labelledby="list-title">
            <div className="list-view-heading">
              <span className="list-view-kicker">AT THE PICTURE HOUSE</span>
              <h1 id="list-title">Now showing</h1>
              <p>Pick a story for tonight.</p>
            </div>
            <div className="fallback-movies">
              {fallbackMovies.map((movie, index) => (
                <article className={`fallback-movie fallback-movie-${movie.color}`} key={movie.title}>
                  <span className="fallback-movie-number">0{index + 1}</span>
                  <div>
                    <h2>{movie.title}</h2>
                    <p>{movie.meta}</p>
                  </div>
                  <span className="fallback-movie-mark" aria-hidden="true">✳</span>
                </article>
              ))}
            </div>
            {!webglAvailable && <p className="webgl-note">The 3D room is unavailable in this browser, so here is the movie list instead.</p>}
          </section>
        )}

        {webglAvailable && !showList && (
          <>
            <div className="lobby-scene-caption" aria-live="polite">
              <span className="caption-overline">TAKE A LOOK AROUND</span>
              <strong>{stops[activeStop].name}</strong>
            </div>
            <nav className="lobby-stop-nav" aria-label="Lobby viewpoints">
              <button type="button" className="stop-arrow" onClick={() => moveStop(-1)} aria-label="Previous viewpoint">←</button>
              {stops.map((stop, index) => (
                <button
                  className={`stop-dot ${index === activeStop ? 'is-active' : ''}`}
                  type="button"
                  key={stop.name}
                  onClick={() => setActiveStop(index)}
                  aria-label={`View ${stop.name}`}
                  aria-current={index === activeStop ? 'step' : undefined}
                >
                  <span>{stop.short}</span>
                </button>
              ))}
              <button type="button" className="stop-arrow" onClick={() => moveStop(1)} aria-label="Next viewpoint">→</button>
            </nav>
            <p className="lobby-hint">Scroll or swipe to wander</p>
          </>
        )}
      </div>
    </main>
  )
}

export default Home
