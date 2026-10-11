import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { listAll, errorMessage, type Movie } from '../lib/api'
import './SearchModal.css'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectMovie: (movie: Movie) => void
}

export function SearchModal({ isOpen, onClose, onSelectMovie }: SearchModalProps) {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('All')
  const inputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const resultsListRef = useRef<HTMLDivElement>(null)

  const fetchMovies = useCallback(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    listAll<Movie>('/movies?status=NOW_SHOWING', controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) {
          setMovies(items)
          setLoading(false)
          setError('')
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setMovies([])
          setLoading(false)
          setError(errorMessage(err))
        }
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (isOpen) {
      const abort = fetchMovies()
      return abort
    }
  }, [isOpen, fetchMovies])

  const handleClose = useCallback(() => {
    setQuery('')
    setSelectedGenre('All')
    onClose()
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

  // Prevent background scroll leaking and isolate native pointer/wheel events
  useEffect(() => {
    if (!isOpen) return

    const originalOverflow = document.body.style.overflow
    const originalTouchAction = document.body.style.touchAction
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'

    const overlay = overlayRef.current
    const stopPropagation = (e: Event) => {
      e.stopPropagation()
    }

    if (overlay) {
      overlay.addEventListener('wheel', stopPropagation, { passive: true })
      overlay.addEventListener('touchstart', stopPropagation, { passive: true })
      overlay.addEventListener('touchmove', stopPropagation, { passive: true })
      overlay.addEventListener('touchend', stopPropagation, { passive: true })
      overlay.addEventListener('pointerdown', stopPropagation)
      overlay.addEventListener('pointermove', stopPropagation)
      overlay.addEventListener('pointerup', stopPropagation)
    }

    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.touchAction = originalTouchAction

      if (overlay) {
        overlay.removeEventListener('wheel', stopPropagation)
        overlay.removeEventListener('touchstart', stopPropagation)
        overlay.removeEventListener('touchmove', stopPropagation)
        overlay.removeEventListener('touchend', stopPropagation)
        overlay.removeEventListener('pointerdown', stopPropagation)
        overlay.removeEventListener('pointermove', stopPropagation)
        overlay.removeEventListener('pointerup', stopPropagation)
      }
    }
  }, [isOpen])

  const genreChips = useMemo(() => {
    const set = new Set<string>()
    movies.forEach((m) => {
      m.genres?.forEach((g) => {
        const trimmed = g.trim()
        if (trimmed) set.add(trimmed)
      })
    })
    return ['All', ...Array.from(set).sort()]
  }, [movies])

  useEffect(() => {
    if (selectedGenre !== 'All' && !genreChips.includes(selectedGenre)) {
      setSelectedGenre('All')
    }
  }, [genreChips, selectedGenre])

  const filteredMovies = useMemo(() => {
    const q = query.trim().toLowerCase()
    return movies.filter((m) => {
      const matchesGenre =
        selectedGenre === 'All' ||
        (m.genres && m.genres.some((g) => g.toLowerCase().includes(selectedGenre.toLowerCase())))
      if (!matchesGenre) return false
      if (!q) return true
      const inTitle = m.title.toLowerCase().includes(q)
      const inGenres = m.genres?.some((g) => g.toLowerCase().includes(q)) ?? false
      const inDesc = m.description ? m.description.toLowerCase().includes(q) : false
      const inLangs = m.languages?.some((l) => l.toLowerCase().includes(q)) ?? false
      return inTitle || inGenres || inDesc || inLangs
    })
  }, [movies, query, selectedGenre])

  if (!isOpen) return null

  const handleBookClick = (movie: Movie) => {
    handleClose()
    onSelectMovie(movie)
  }

  const stopReactProp = (e: React.SyntheticEvent) => {
    e.stopPropagation()
  }

  const modalContent = (
    <div
      ref={overlayRef}
      className="search-overlay"
      onClick={handleClose}
      onWheel={stopReactProp}
      onTouchStart={stopReactProp}
      onTouchMove={stopReactProp}
      onTouchEnd={stopReactProp}
      onPointerDown={stopReactProp}
      onPointerMove={stopReactProp}
      onPointerUp={stopReactProp}
      role="presentation"
    >
      <div
        className="search-card"
        ref={modalRef}
        onClick={stopReactProp}
        onWheel={stopReactProp}
        onTouchStart={stopReactProp}
        onTouchMove={stopReactProp}
        onTouchEnd={stopReactProp}
        onPointerDown={stopReactProp}
        onPointerMove={stopReactProp}
        onPointerUp={stopReactProp}
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-modal-title"
      >
        <div className="search-top-bar">
          <div className="search-input-wrapper">
            <span className="search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              ref={inputRef}
              id="search-modal-title"
              type="text"
              className="search-input"
              placeholder="Search films, genres, stories..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search movies in catalogue"
            />
            {query && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setQuery('')}
                aria-label="Clear search query"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="button"
            className="search-close-btn"
            onClick={handleClose}
            aria-label="Close search"
          >
            Esc
          </button>
        </div>

        {/* Genre Quick Filter Chips (derived dynamically from server movies) */}
        {genreChips.length > 1 && (
          <div className="search-genre-chips" role="tablist" aria-label="Genre filters">
            {genreChips.map((g) => (
              <button
                key={g}
                type="button"
                className={`genre-chip ${selectedGenre === g ? 'is-active' : ''}`}
                onClick={() => setSelectedGenre(g)}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        {/* Movie Results */}
        <div
          ref={resultsListRef}
          className="search-results-list"
          onWheel={stopReactProp}
          onTouchStart={stopReactProp}
          onTouchMove={stopReactProp}
          onTouchEnd={stopReactProp}
          role="region"
          aria-live="polite"
        >
          {/* Loading state */}
          {loading && (
            <div className="search-loading-state" role="status" aria-label="Loading movies from cinema server">
              <div className="search-loading-bar">
                <div className="search-spinner" aria-hidden="true" />
                <span>Loading available films from box office…</span>
              </div>
              <div className="search-skeleton-list" aria-hidden="true">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="search-skeleton-item">
                    <div className="skeleton-thumb" />
                    <div className="skeleton-info">
                      <div className="skeleton-line skeleton-title" />
                      <div className="skeleton-line skeleton-meta" />
                      <div className="skeleton-line skeleton-desc" />
                    </div>
                    <div className="skeleton-btn" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error state with Retry action - strictly no mock fallback */}
          {!loading && error && (
            <div className="search-error-state" role="alert">
              <span className="search-error-icon" aria-hidden="true">⚠️</span>
              <h3 className="search-error-title">Unable to reach cinema server</h3>
              <p className="search-error-message">{error}</p>
              <button
                type="button"
                className="search-retry-btn"
                onClick={fetchMovies}
              >
                <span className="search-retry-icon" aria-hidden="true">↻</span>
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Empty state: No server movies at all */}
          {!loading && !error && movies.length === 0 && (
            <div className="search-empty-state">
              <span className="empty-emoji" aria-hidden="true">📽</span>
              <h3>No films currently showing</h3>
              <p>There are no active screenings in the schedule right now. Please check back later.</p>
              <button
                type="button"
                className="empty-reset-btn"
                onClick={fetchMovies}
              >
                ↻ Refresh schedule
              </button>
            </div>
          )}

          {/* Empty state: Query or genre produced no matches */}
          {!loading && !error && movies.length > 0 && filteredMovies.length === 0 && (
            <div className="search-empty-state">
              <span className="empty-emoji" aria-hidden="true">🔍</span>
              <h3>No films found for "{query || selectedGenre}"</h3>
              <p>Try adjusting your search query or selecting a different genre.</p>
              <button
                type="button"
                className="empty-reset-btn"
                onClick={() => {
                  setQuery('')
                  setSelectedGenre('All')
                }}
              >
                Clear search filters
              </button>
            </div>
          )}

          {/* Success state: Server-fetched movies list */}
          {!loading && !error && filteredMovies.length > 0 && (
            <div className="movies-grid">
              {filteredMovies.map((movie) => (
                <div key={movie._id} className="search-movie-item">
                  <div className="movie-thumb">
                    {movie.posterUrl ? (
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        loading="lazy"
                        onError={(e) => {
                          ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <span className="movie-thumb-fallback" aria-hidden="true">🎬</span>
                    )}
                  </div>
                  <div className="movie-info">
                    <div className="movie-header-row">
                      <h4 className="movie-title">{movie.title}</h4>
                      {movie.certificate && (
                        <span className="movie-rating-badge">{movie.certificate}</span>
                      )}
                    </div>
                    <div className="movie-meta-row">
                      <span className="movie-genre">
                        {movie.genres?.length ? movie.genres.join(' · ') : 'Cinema'}
                      </span>
                      <span className="meta-sep">·</span>
                      <span className="movie-duration">
                        {movie.duration ? `${movie.duration} min` : 'Feature film'}
                      </span>
                      {movie.languages?.length ? (
                        <>
                          <span className="meta-sep">·</span>
                          <span className="movie-lang">{movie.languages.join(', ')}</span>
                        </>
                      ) : null}
                    </div>
                    <p className="movie-desc">
                      {movie.description || 'Now showing at Goodshow Cinema.'}
                    </p>
                  </div>
                  <div className="movie-action">
                    <button
                      type="button"
                      className="search-book-btn"
                      onClick={() => handleBookClick(movie)}
                    >
                      <span>Book</span>
                      <span aria-hidden="true">🎟</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null
}
