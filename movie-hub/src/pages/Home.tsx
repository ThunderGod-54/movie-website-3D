import { Canvas } from '@react-three/fiber'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import LobbyScene from '../components/three/LobbyScene'
import './Home.css'

const stops = [
  { name: 'Welcome',      icon: '✳' },
  { name: 'Now showing',  icon: '🎬' },
  { name: 'Tickets',      icon: '🎟' },
  { name: 'Popcorn',      icon: '🍿' },
  { name: 'Screens',      icon: '🚪' },
]

const nowShowingMovies = [
  { title: 'The Odyssey',              meta: 'Epic · 2h 50m',    color: 'sage'  },
  { title: 'Spider-Man: Brand New Day', meta: 'Action · 2h 15m', color: 'coral' },
  { title: 'F1',                        meta: 'Drama · 2h 10m',  color: 'blue'  },
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
  const [webglAvailable] = useState<boolean>(() => supportsWebGL())
  const [activeStop, setActiveStop]   = useState(0)
  const [drawerOpen, setDrawerOpen]   = useState(false)
  const pointerRef       = useRef({ x: 0, y: 0 })
  const gestureStartRef  = useRef<number | null>(null)
  const wheelCooldownRef = useRef(false)

  function moveStop(direction: number) {
    setActiveStop((current) => (current + direction + stops.length) % stops.length)
  }

  function goToStop(index: number) {
    setActiveStop(index)
    setDrawerOpen(false)
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
    setTimeout(() => { wheelCooldownRef.current = false }, 500)
  }

  return (
    <main
      className="lobby-page"
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
    >
      {/* ── Top header ─────────────────────────────────────────── */}
      <header className="lobby-header">
        <Link className="lobby-home-link" to="/" aria-label="Return to Goodshow home">
          <span aria-hidden="true">←</span> Goodshow
        </Link>
        <p className="lobby-header-note"><span aria-hidden="true">✳</span> THE PICTURE HOUSE</p>
        <button
          className="lobby-menu-btn"
          type="button"
          aria-label={drawerOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen((v) => !v)}
        >
          <span className={`hamburger ${drawerOpen ? 'is-open' : ''}`}>
            <span /><span /><span />
          </span>
        </button>
      </header>

      {/* ── 3-D stage ──────────────────────────────────────────── */}
      <div className="lobby-stage" aria-label="Interactive theatre lobby">
        {webglAvailable && (
          <Canvas
            className="lobby-canvas"
            dpr={[1, 1.5]}
            camera={{ position: [0, 4.2, 12], fov: 42, near: 0.1, far: 100 }}
            gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
            shadows
            frameloop="always"
          >
            <color attach="background" args={['#d7d2c4']} />
            <LobbyScene activeStop={activeStop} pointerRef={pointerRef} />
          </Canvas>
        )}

        {!webglAvailable && (
          <section className="lobby-list-view" aria-labelledby="list-title">
            <div className="list-view-heading">
              <span className="list-view-kicker">AT THE PICTURE HOUSE</span>
              <h1 id="list-title">Now showing</h1>
              <p>Pick a story for tonight.</p>
            </div>
            <div className="fallback-movies">
              {nowShowingMovies.map((movie, index) => (
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
            <p className="webgl-note">The 3D room is unavailable in this browser.</p>
          </section>
        )}

        {/* current stop label — bottom-left */}
        {webglAvailable && (
          <div className="lobby-scene-caption" aria-live="polite">
            <span className="caption-overline">TAKE A LOOK AROUND</span>
            <strong>{stops[activeStop].name}</strong>
          </div>
        )}
      </div>

      {/* ── Side drawer overlay ─────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="drawer-backdrop"
          aria-hidden="true"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <nav
        className={`lobby-drawer ${drawerOpen ? 'is-open' : ''}`}
        aria-label="Theatre navigation"
        aria-hidden={!drawerOpen}
      >
        <p className="drawer-heading">EXPLORE</p>

        <ul className="drawer-stops" role="list">
          {stops.map((stop, index) => (
            <li key={stop.name}>
              <button
                className={`drawer-stop-btn ${index === activeStop ? 'is-active' : ''}`}
                type="button"
                onClick={() => goToStop(index)}
                aria-current={index === activeStop ? 'step' : undefined}
              >
                <span className="drawer-stop-icon" aria-hidden="true">{stop.icon}</span>
                <span className="drawer-stop-name">{stop.name}</span>
                <span className="drawer-stop-arrow" aria-hidden="true">→</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="drawer-movies">
          <p className="drawer-movies-label">NOW SHOWING</p>
          {nowShowingMovies.map((m) => (
            <div className="drawer-movie-row" key={m.title}>
              <span className={`drawer-movie-dot drawer-movie-dot-${m.color}`} aria-hidden="true" />
              <div>
                <p className="drawer-movie-title">{m.title}</p>
                <p className="drawer-movie-meta">{m.meta}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="drawer-hint">Scroll · Swipe · Wander</p>
      </nav>
    </main>
  )
}

export default Home
