import { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { CINEMA_CATALOGUE, type Movie } from '../data/movies'
import './SearchModal.css'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectMovie: (movie: Movie) => void
}

const GENRE_FILTERS = ['All', 'Action', 'Sci-Fi', 'Drama', 'Epic', 'Thriller']

export function SearchModal({ isOpen, onClose, onSelectMovie }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('All')
  const inputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    } else {
      setQuery('')
      setSelectedGenre('All')
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const filteredMovies = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CINEMA_CATALOGUE.filter((m) => {
      const matchesGenre = selectedGenre === 'All' || m.genre.toLowerCase().includes(selectedGenre.toLowerCase())
      if (!matchesGenre) return false
      if (!q) return true
      return (
        m.title.toLowerCase().includes(q) ||
        m.genre.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
      )
    })
  }, [query, selectedGenre])

  if (!isOpen) return null

  const handleBookClick = (movie: Movie) => {
    onClose()
    onSelectMovie(movie)
  }

  const modalContent = (
    <div className="search-overlay" onClick={onClose} role="presentation">
      <div
        className="search-card"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
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
            onClick={onClose}
            aria-label="Close search"
          >
            Esc
          </button>
        </div>

        {/* Genre Quick Filter Chips */}
        <div className="search-genre-chips" role="tablist" aria-label="Genre filters">
          {GENRE_FILTERS.map((g) => (
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

        {/* Movie Results */}
        <div className="search-results-list" role="region" aria-live="polite">
          {filteredMovies.length === 0 ? (
            <div className="search-empty-state">
              <span className="empty-emoji" aria-hidden="true">📽</span>
              <h3>No films found for "{query}"</h3>
              <p>Try searching for "Spider-Man", "Odyssey", or tap on "Action" above.</p>
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
          ) : (
            <div className="movies-grid">
              {filteredMovies.map((movie) => (
                <div key={movie.id} className="search-movie-item">
                  <div
                    className="movie-thumb"
                    style={{ backgroundColor: movie.color }}
                  >
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      loading="lazy"
                      onError={(e) => {
                        // Fallback gracefully to color box if remote image fails
                        ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                  <div className="movie-info">
                    <div className="movie-header-row">
                      <h4 className="movie-title">{movie.title}</h4>
                      <span className="movie-rating-badge">{movie.rating}</span>
                    </div>
                    <div className="movie-meta-row">
                      <span className="movie-genre">{movie.genre}</span>
                      <span className="meta-sep">·</span>
                      <span className="movie-duration">{movie.duration}</span>
                    </div>
                    <p className="movie-desc">{movie.description}</p>
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
