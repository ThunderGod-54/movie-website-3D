import { Canvas } from '@react-three/fiber'
import { useRef, useState, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApiList } from '../hooks/useApiList'
import type { Movie } from '../lib/api'
import BookingModal from '../components/BookingModal'
import FoodModal from '../components/FoodModal'
import LobbyScene from '../components/three/LobbyScene'
import { NavbarUserActions } from '../components/NavbarUserActions'
import { SearchModal } from '../components/SearchModal'
import './Home.css'

const stops = [
  { name: 'Welcome',               icon: '✳',  desc: 'Step inside'           },
  { name: 'Now showing',           icon: '🎬', desc: 'Explore current films' },
  { name: 'Tickets',               icon: '🎟', desc: 'Box office is open'     },
  { name: 'Food Court',             icon: '🍔', desc: 'Grab a bite before the show' },
  { name: 'Screens',               icon: '🚪', desc: 'Through the door'       },
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
  const { items: movies, loading: moviesLoading, error: moviesError, reload: reloadMovies } = useApiList<Movie>('/movies?status=NOW_SHOWING')
  const nowShowingMovies = movies.map((m, i) => ({ title: m.title, meta: `${m.genres.join(' · ')} · ${m.duration} min`, color: ['sage', 'coral', 'blue'][i % 3] }))
  const [webglAvailable]              = useState<boolean>(() => supportsWebGL())
  const [activeStop, setActiveStop]   = useState(0)
  const [insideAuditorium, setInsideAuditorium] = useState(false)
  const [menuOpen,   setMenuOpen]     = useState(false)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [foodOpen,    setFoodOpen]    = useState(false)
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [selectedMovieForBooking, setSelectedMovieForBooking] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as any).__openBookingWithId = (id: string) => {
        setSelectedMovieForBooking(id)
        setBookingOpen(true)
      }
    }
  }, [])

  const isAnyModalOpen = menuOpen || bookingOpen || foodOpen || searchOpen
  const frameloop = isAnyModalOpen ? 'demand' : 'always'

  // FOOD_COURT is stop index 3
  function openFoodCourt() {
    setActiveStop(3)
    // slight delay so camera starts moving before modal appears
    setTimeout(() => setFoodOpen(true), 400)
  }
  const pointerRef                  = useRef({ x: 0, y: 0 })
  const gestureStartRef             = useRef<number | null>(null)
  const wheelCooldownRef            = useRef(false)

  const toggleMenu = useCallback(() => setMenuOpen((v) => !v), [])

  function moveStop(direction: number) {
    if (insideAuditorium || isAnyModalOpen) return
    setActiveStop((c) => (c + direction + stops.length) % stops.length)
  }

  function goToStop(index: number) {
    setInsideAuditorium(false)
    setActiveStop(index)
    setMenuOpen(false)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (isAnyModalOpen) return
    const b = event.currentTarget.getBoundingClientRect()
    pointerRef.current = {
      x: ((event.clientX - b.left) / b.width) * 2 - 1,
      y: 1 - ((event.clientY - b.top) / b.height) * 2,
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (isAnyModalOpen) return
    if (event.pointerType === 'touch') gestureStartRef.current = event.clientX
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (isAnyModalOpen || gestureStartRef.current === null) return
    const distance = event.clientX - gestureStartRef.current
    gestureStartRef.current = null
    if (Math.abs(distance) > 55) moveStop(distance < 0 ? 1 : -1)
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    if (isAnyModalOpen || Math.abs(event.deltaY) <= 10 || wheelCooldownRef.current) return
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

        <div className="lobby-header-right">
          <button
            className="lobby-search-btn"
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search movies"
            title="Search movies in catalogue"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className="lobby-search-label">Search</span>
          </button>

          <NavbarUserActions />

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
        </div>
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
            <LobbyScene
              movies={movies}
              activeStop={activeStop}
              pointerRef={pointerRef}
              onTicketClick={() => {
                setSelectedMovieForBooking(null)
                setBookingOpen(true)
              }}
              onFoodClick={() => setFoodOpen(true)}
              onScreensClick={() => setInsideAuditorium(true)}
              insideAuditorium={insideAuditorium}
            />
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
              {moviesLoading && <p role="status">Loading films…</p>}
              {moviesError && <p role="alert">{moviesError} <button onClick={reloadMovies}>Retry</button></p>}
              {!moviesLoading && !moviesError && !movies.length && <p>No films are currently showing.</p>}
              {nowShowingMovies.map((movie, index) => (
                <article
                  className={`fallback-movie fallback-movie-${movie.color}`}
                  key={movie.title}
                  onClick={() => {
                    const matchedMovie = movies[index]
                    setSelectedMovieForBooking(matchedMovie?._id || null)
                    setBookingOpen(true)
                  }}
                  style={{ cursor: 'pointer' }}
                >
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
            <span className="caption-overline">
              {insideAuditorium ? 'WELCOME INSIDE' : activeStop === 4 ? 'CLICK THE DOOR TO ENTER' : 'TAKE A LOOK AROUND'}
            </span>
            <strong>{insideAuditorium ? 'The Auditorium' : stops[activeStop].name}</strong>
          </div>
        )}
        {insideAuditorium && (
          <button className="auditorium-exit-btn" type="button" onClick={() => setInsideAuditorium(false)}>
            ← Back to lobby
          </button>
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
            {moviesLoading && <p role="status">Loading films…</p>}
            {moviesError && <p role="alert">{moviesError} <button onClick={reloadMovies}>Retry</button></p>}
            {!moviesLoading && !moviesError && !movies.length && <p>No films are currently showing.</p>}
            {nowShowingMovies.map((m, i) => (
              <div
                className="fsm-movie"
                key={m.title}
                onClick={() => {
                  const matchedMovie = movies[i]
                  setSelectedMovieForBooking(matchedMovie?._id || null)
                  setBookingOpen(true)
                  setMenuOpen(false)
                }}
                style={{ cursor: 'pointer' }}
              >
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

      {/* ── Search modal ────────────────────────────────────────── */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectMovie={(movie: Movie) => {
          setSelectedMovieForBooking(movie._id)
          setBookingOpen(true)
        }}
      />

      {/* ── Booking modal ───────────────────────────────────────── */}
      {bookingOpen && (
        <BookingModal
          initialMovieId={selectedMovieForBooking || undefined}
          onClose={() => {
            setBookingOpen(false)
            setSelectedMovieForBooking(null)
          }}
          onGoToFood={openFoodCourt}
        />
      )}

      {/* ── Food modal ──────────────────────────────────────────── */}
      {foodOpen && <FoodModal onClose={() => setFoodOpen(false)} />}
    </main>
  )
}

export default Home
