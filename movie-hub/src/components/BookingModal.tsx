import { useState } from 'react'
import './BookingModal.css'

const movies = [
  { id: 'odyssey',  title: 'The Odyssey',               genre: 'Epic',   duration: '2h 50m', rating: 'U/A' },
  { id: 'spidey',   title: 'Spider-Man: Brand New Day',  genre: 'Action', duration: '2h 15m', rating: 'U/A' },
  { id: 'f1',       title: 'F1',                         genre: 'Drama',  duration: '2h 10m', rating: 'U'   },
  { id: 'hailmary', title: 'Project Hail Mary',          genre: 'Sci-Fi', duration: '2h 28m', rating: 'U/A' },
  { id: 'dhura2',   title: 'Dhurandhar 2',               genre: 'Action', duration: '2h 35m', rating: 'UA'  },
  { id: 'obsess',   title: 'Obsession',                  genre: 'Thriller','duration': '1h 58m', rating: 'A' },
]

const showtimes = ['10:30 AM', '1:15 PM', '4:00 PM', '7:30 PM', '10:45 PM']

const ROWS = ['A','B','C','D','E','F','G','H']
const COLS = 10

// Generate a stable pseudo-random sold-out pattern
function isSold(row: string, col: number): boolean {
  const seed = (row.charCodeAt(0) * 7 + col * 13) % 17
  return seed < 5
}

type Step = 'movie' | 'showtime' | 'seats' | 'confirm'

type BookingState = {
  movie: string | null
  showtime: string | null
  seats: string[]
}

export default function BookingModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>('movie')
  const [booking, setBooking] = useState<BookingState>({ movie: null, showtime: null, seats: [] })

  const selectedMovie = movies.find(m => m.id === booking.movie)

  function selectMovie(id: string) {
    setBooking(b => ({ ...b, movie: id }))
    setStep('showtime')
  }

  function selectShowtime(t: string) {
    setBooking(b => ({ ...b, showtime: t }))
    setStep('seats')
  }

  function toggleSeat(seatId: string) {
    setBooking(b => ({
      ...b,
      seats: b.seats.includes(seatId)
        ? b.seats.filter(s => s !== seatId)
        : b.seats.length < 8 ? [...b.seats, seatId] : b.seats,
    }))
  }

  function goBack() {
    if (step === 'showtime') setStep('movie')
    else if (step === 'seats')    setStep('showtime')
    else if (step === 'confirm')  setStep('seats')
  }

  const stepIndex = ['movie', 'showtime', 'seats', 'confirm'].indexOf(step)

  return (
    <div className="bm-backdrop" onClick={onClose}>
      <div className="bm-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Book tickets">

        {/* ── Header ── */}
        <div className="bm-header">
          <div className="bm-header-left">
            {step !== 'movie' && (
              <button className="bm-back-btn" onClick={goBack} aria-label="Go back">
                ← Back
              </button>
            )}
          </div>
          <h2 className="bm-title">
            {step === 'movie'    && 'Select a film'}
            {step === 'showtime' && selectedMovie?.title}
            {step === 'seats'    && 'Pick your seats'}
            {step === 'confirm'  && 'Confirm booking'}
          </h2>
          <button className="bm-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* ── Step indicator ── */}
        <div className="bm-steps" aria-label="Booking progress">
          {['Film', 'Time', 'Seats', 'Confirm'].map((label, i) => (
            <div key={label} className={`bm-step ${i <= stepIndex ? 'is-done' : ''} ${i === stepIndex ? 'is-active' : ''}`}>
              <span className="bm-step-dot">{i < stepIndex ? '✓' : i + 1}</span>
              <span className="bm-step-label">{label}</span>
            </div>
          ))}
        </div>

        {/* ── Step content ── */}
        <div className="bm-body">

          {/* STEP 1 — Movie */}
          {step === 'movie' && (
            <ul className="bm-movie-list" role="list">
              {movies.map(m => (
                <li key={m.id}>
                  <button
                    className={`bm-movie-card ${booking.movie === m.id ? 'is-selected' : ''}`}
                    onClick={() => selectMovie(m.id)}
                  >
                    <div className="bm-movie-card-inner">
                      <span className="bm-movie-title">{m.title}</span>
                      <div className="bm-movie-meta">
                        <span className="bm-badge">{m.genre}</span>
                        <span className="bm-badge bm-badge-outline">{m.rating}</span>
                        <span className="bm-movie-dur">{m.duration}</span>
                      </div>
                    </div>
                    <span className="bm-movie-arrow">→</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* STEP 2 — Showtime */}
          {step === 'showtime' && (
            <div>
              <p className="bm-section-label">TODAY · GOODSHOW CINEMA</p>
              <div className="bm-showtime-grid">
                {showtimes.map(t => (
                  <button
                    key={t}
                    className={`bm-showtime-btn ${booking.showtime === t ? 'is-selected' : ''}`}
                    onClick={() => selectShowtime(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3 — Seat picker */}
          {step === 'seats' && (
            <div className="bm-seat-section">
              <div className="bm-screen-label">SCREEN</div>
              <div className="bm-seat-grid">
                {ROWS.map(row => (
                  <div key={row} className="bm-seat-row">
                    <span className="bm-row-label">{row}</span>
                    {Array.from({ length: COLS }, (_, c) => {
                      const seatId = `${row}${c + 1}`
                      const sold   = isSold(row, c + 1)
                      const picked = booking.seats.includes(seatId)
                      return (
                        <button
                          key={seatId}
                          className={`bm-seat ${sold ? 'is-sold' : ''} ${picked ? 'is-picked' : ''}`}
                          disabled={sold}
                          onClick={() => toggleSeat(seatId)}
                          aria-label={`Seat ${seatId}${sold ? ' (unavailable)' : ''}`}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
              <div className="bm-seat-legend">
                <span><span className="bm-seat-dot available" />Available</span>
                <span><span className="bm-seat-dot picked" />Selected</span>
                <span><span className="bm-seat-dot sold" />Sold</span>
              </div>
              {booking.seats.length > 0 && (
                <div className="bm-seat-footer">
                  <span>{booking.seats.length} seat{booking.seats.length > 1 ? 's' : ''} — {booking.seats.join(', ')}</span>
                  <button className="bm-proceed-btn" onClick={() => setStep('confirm')}>
                    Proceed →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 4 — Confirm */}
          {step === 'confirm' && (
            <div className="bm-confirm">
              <div className="bm-confirm-card">
                <p className="bm-confirm-kicker">✳ GOODSHOW CINEMA</p>
                <h3 className="bm-confirm-movie">{selectedMovie?.title}</h3>
                <div className="bm-confirm-rows">
                  <div className="bm-confirm-row">
                    <span>Date</span><span>Today</span>
                  </div>
                  <div className="bm-confirm-row">
                    <span>Show</span><span>{booking.showtime}</span>
                  </div>
                  <div className="bm-confirm-row">
                    <span>Seats</span><span>{booking.seats.join(', ')}</span>
                  </div>
                  <div className="bm-confirm-row">
                    <span>Total</span>
                    <span className="bm-confirm-price">₹{booking.seats.length * 280}</span>
                  </div>
                </div>
              </div>
              <button
                className="bm-confirm-btn"
                onClick={() => { alert('Booking confirmed! 🎟'); onClose() }}
              >
                Confirm &amp; Pay ₹{booking.seats.length * 280}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
