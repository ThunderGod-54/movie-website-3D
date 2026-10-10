import { Canvas } from '@react-three/fiber'
import { useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import LobbyScene from '../components/three/LobbyScene'
import './Home.css'

const stops = [
  { name: 'Welcome',               icon: '✳',  desc: 'Step inside'           },
  { name: 'Now showing',           icon: '🎬', desc: 'Three films on tonight' },
  { name: 'Tickets',               icon: '🎟', desc: 'Box office is open'     },
  { name: 'Food Court',             icon: '🍔', desc: 'Grab a bite before the show' },
  { name: 'Screens',               icon: '🚪', desc: 'Through the door'       },
]

const nowShowingMovies = [
  { title: 'The Odyssey',               meta: 'Epic · 2h 50m',    color: 'sage'  },
  { title: 'Spider-Man: Brand New Day', meta: 'Action · 2h 15m',  color: 'coral' },
  { title: 'F1',                        meta: 'Drama · 2h 10m',   color: 'blue'  },
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
  const [webglAvailable]            = useState<boolean>(() => supportsWebGL())
  const [activeStop, setActiveStop] = useState(0)
  const [menuOpen,   setMenuOpen]   = useState(false)
  // When menu is open pause the 3-D render loop — saves ~16ms/frame of GPU work
  const frameloop = menuOpen ? 'demand' : 'always'
  const pointerRef                  = useRef({ x: 0, y: 0 })
  const gestureStartRef             = useRef<number | null>(null)
  const wheelCooldownRef            = useRef(false)

  const toggleMenu = useCallback(() => setMenuOpen((v) => !v), [])

  function moveStop(direction: number) {
    setActiveStop((c) => (c + direction + stops.length) % stops.length)
  }

  function goToStop(index: number) {
    setActiveStop(index)
    setMenuOpen(false)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const b = event.currentTarget.getBoundingClientRect()
    pointerRef.current = {
      x: ((event.clientX - b.left) / b.width) * 2 - 1,
      y: 1 - ((event.clientY - b.top) / b.height) * 2,
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
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className={`lobby-header${menuOpen ? ' menu-is-open' : ''}`}>
        <Link className="lobby-home-link" to="/" aria-label="Return to Goodshow home">
          <span aria-hidden="true">←</span> Goodshow
        </Link>
        <p className="lobby-header-note"><span aria-hidden="true">✳</span> THE PICTURE HOUSE</p>
        <button
          className="lobby-menu-btn"
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={toggleMenu}
        >
          <span className={`hamburger ${menuOpen ? 'is-open' : ''}`}>
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
            frameloop={frameloop}
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
                  <div><h2>{movie.title}</h2><p>{movie.meta}</p></div>
                  <span className="fallback-movie-mark" aria-hidden="true">✳</span>
                </article>
              ))}
            </div>
            <p className="webgl-note">The 3D room is unavailable in this browser.</p>
          </section>
        )}

        {webglAvailable && (
          <div className="lobby-scene-caption" aria-live="polite">
            <span className="caption-overline">TAKE A LOOK AROUND</span>
            <strong>{stops[activeStop].name}</strong>
          </div>
        )}
      </div>

      {/* ── Fullscreen menu overlay ─────────────────────────────── */}
      <div className={`fullscreen-menu ${menuOpen ? 'is-open' : ''}`} aria-hidden={!menuOpen}>

        <div className="fsm-left">
          <p className="fsm-label">EXPLORE THE THEATRE</p>
          <nav aria-label="Theatre navigation">
            <ol className="fsm-stops" role="list">
              {stops.map((stop, index) => (
                <li key={stop.name} className="fsm-stop-item">
                  <button
                    className={`fsm-stop-btn ${index === activeStop ? 'is-active' : ''}`}
                    type="button"
                    tabIndex={menuOpen ? 0 : -1}
                    onClick={() => goToStop(index)}
                  >
                    <span className="fsm-stop-num">0{index + 1}</span>
                    <span className="fsm-stop-name">{stop.name}</span>
                    <span className="fsm-stop-desc">{stop.desc}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <div className="fsm-right">
          <p className="fsm-label">NOW SHOWING</p>
          <div className="fsm-movies">
            {nowShowingMovies.map((m, i) => (
              <div className="fsm-movie" key={m.title}>
                <span className="fsm-movie-num">0{i + 1}</span>
                <div>
                  <p className="fsm-movie-title">{m.title}</p>
                  <p className="fsm-movie-meta">{m.meta}</p>
                </div>
                <span className={`fsm-movie-dot fsm-movie-dot-${m.color}`} aria-hidden="true" />
              </div>
            ))}
          </div>
          <p className="fsm-hint">Scroll · Swipe · Wander through the room</p>
        </div>

      </div>
    </main>
  )
}

export default Home
