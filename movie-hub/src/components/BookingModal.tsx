import { useState, useEffect } from 'react'
import { CINEMA_CATALOGUE as movies } from '../data/movies'
import { useAuthStore } from '../store/authStore'
import { playSelectionTick } from '../utils/selectionSound'
import './BookingModal.css'

const showtimes = ['10:30 AM', '1:15 PM', '4:00 PM', '7:30 PM', '10:45 PM']

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const COLS = 10

function isSold(row: string, col: number): boolean {
  const seed = (row.charCodeAt(0) * 7 + col * 13) % 17
  return seed < 5
}

// ── Success chime via Web Audio API ──────────────────────────────────────────
function playSuccessChime() {
  try {
    const ctx = new AudioContext()
    // Three ascending notes — C5, E5, G5
    const notes = [523.25, 659.25, 783.99]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.13
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.28, t + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55)
      osc.start(t)
      osc.stop(t + 0.56)
    })
    // Close context after last note fades
    setTimeout(() => ctx.close(), 1200)
  } catch {
    // AudioContext blocked or unavailable — fail silently
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return entities[character]
  })
}

type Step = 'movie' | 'showtime' | 'seats' | 'confirm' | 'success'

type BookingState = {
  movie: string | null
  showtime: string | null
  seats: string[]
}

type Props = {
  onClose: () => void
  onGoToFood: () => void
  initialMovieId?: string | null
}

export default function BookingModal({ onClose, onGoToFood, initialMovieId }: Props) {
  const {
    isAuthenticated,
    pendingBooking,
    setPendingBooking,
    createBooking,
    openSignInModal,
  } = useAuthStore()

  const [step, setStep] = useState<Step>(() => {
    if (pendingBooking?.seats.length) return 'confirm'
    if (pendingBooking?.showtime) return 'seats'
    if (initialMovieId || pendingBooking?.movieId) return 'showtime'
    return 'movie'
  })

  const [booking, setBooking] = useState<BookingState>(() => {
    if (pendingBooking) {
      return {
        movie: pendingBooking.movieId,
        showtime: pendingBooking.showtime,
        seats: pendingBooking.seats,
      }
    }
    if (initialMovieId) {
      return { movie: initialMovieId, showtime: null, seats: [] }
    }
    return { movie: null, showtime: null, seats: [] }
  })

  const [confirmedReference, setConfirmedReference] = useState<string>('')

  // Resume pending booking automatically upon authentication via external store subscription
  useEffect(() => {
    const unsub = useAuthStore.subscribe((state, prevState) => {
      if (state.pendingBooking && state.pendingBooking !== prevState.pendingBooking) {
        setBooking({
          movie: state.pendingBooking.movieId,
          showtime: state.pendingBooking.showtime,
          seats: state.pendingBooking.seats,
        })
        if (state.pendingBooking.seats.length > 0) {
          setStep('confirm')
        } else if (state.pendingBooking.showtime) {
          setStep('seats')
        }
      }
    })
    return unsub
  }, [])

  const selectedMovie = movies.find((m) => m.id === booking.movie)
  const total = booking.seats.length * 280
  const stepIndex = ['movie', 'showtime', 'seats', 'confirm'].indexOf(step)

  function selectMovie(id: string) {
    playSelectionTick()
    setBooking((b) => ({ ...b, movie: id }))
    setStep('showtime')
  }

  function selectShowtime(t: string) {
    playSelectionTick()
    setBooking((b) => ({ ...b, showtime: t }))
    setStep('seats')
  }

  function toggleSeat(seatId: string) {
    const isSelected = booking.seats.includes(seatId)
    if (isSelected || booking.seats.length < 8) playSelectionTick()
    setBooking((b) => ({
      ...b,
      seats: isSelected
        ? b.seats.filter((s) => s !== seatId)
        : b.seats.length < 8
        ? [...b.seats, seatId]
        : b.seats,
    }))
  }

  function goBack() {
    if (step === 'showtime') setStep('movie')
    else if (step === 'seats') setStep('showtime')
    else if (step === 'confirm') setStep('seats')
  }

  // Enforce authentication before proceeding to confirmation
  function handleProceedToConfirm() {
    if (!isAuthenticated) {
      setPendingBooking({
        movieId: booking.movie || '',
        movieTitle: selectedMovie?.title || '',
        showtime: booking.showtime || '',
        seats: booking.seats,
      })
      openSignInModal('Please sign in to continue with your booking')
      return
    }
    setStep('confirm')
  }

  // Enforce authentication on final confirmation & create persistent booking
  function handleConfirm() {
    if (!isAuthenticated) {
      setPendingBooking({
        movieId: booking.movie || '',
        movieTitle: selectedMovie?.title || '',
        showtime: booking.showtime || '',
        seats: booking.seats,
      })
      openSignInModal('Please sign in to continue with your booking')
      return
    }

    try {
      const record = createBooking({
        movieId: booking.movie || '',
        movieTitle: selectedMovie?.title || '',
        showtime: booking.showtime || '',
        seats: booking.seats,
        totalPrice: total,
      })
      setConfirmedReference(record.id)
      playSuccessChime()
      setStep('success')
    } catch (err) {
      console.error('Failed to create booking:', err)
    }
  }

  function downloadTicketInvoice() {
    const movieTitle = escapeHtml(selectedMovie?.title ?? 'Cinema booking')
    const showtime = escapeHtml(booking.showtime ?? '')
    const seats = escapeHtml(booking.seats.join(', '))
    const bookingReference = confirmedReference || `GS-${Date.now().toString(36).toUpperCase()}`
    const bookingDate = new Intl.DateTimeFormat(undefined, {
      dateStyle: 'long',
    }).format(new Date())

    const ticketHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Goodshow ticket and invoice</title>
  <style>
    body{margin:0;padding:36px;background:#f4efe5;color:#29251f;font:16px/1.5 Arial,sans-serif}
    main{max-width:620px;margin:auto;padding:36px;background:#fffdf8;border:1px solid #ded4c3;border-radius:16px}
    h1{margin:0;color:#c85840;font-size:14px;letter-spacing:.16em}
    h2{margin:28px 0 4px;font-size:30px}
    p{color:#71695e}
    dl{margin:28px 0}
    dl div{display:flex;justify-content:space-between;gap:20px;padding:12px 0;border-bottom:1px solid #eee8dd}
    dt{color:#71695e}dd{margin:0;text-align:right;font-weight:700}
    .total{font-size:20px;color:#c85840}
    .reference{font-size:12px}
    @media print{body{padding:0;background:#fff}main{border:0;box-shadow:none}}
  </style>
</head>
<body>
  <main>
    <h1>GOODSHOW CINEMA</h1>
    <h2>${movieTitle}</h2>
    <p>Your ticket and payment invoice</p>
    <dl>
      <div><dt>Booking reference</dt><dd class="reference">${bookingReference}</dd></div>
      <div><dt>Date</dt><dd>${escapeHtml(bookingDate)}</dd></div>
      <div><dt>Showtime</dt><dd>${showtime}</dd></div>
      <div><dt>Seats</dt><dd>${seats}</dd></div>
      <div><dt>Tickets</dt><dd>${booking.seats.length}</dd></div>
      <div><dt>Paid</dt><dd class="total">₹${total}</dd></div>
    </dl>
    <p>Present this ticket at the cinema. Thank you for choosing Goodshow!</p>
  </main>
</body>
</html>`

    const file = new Blob([ticketHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = `goodshow-ticket-invoice-${bookingReference}.html`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function handleGoFood() {
    onClose()
    onGoToFood()
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div
        className="bm-backdrop"
        onClick={onClose}
        onWheel={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
      >
        <div className="bm-modal bm-modal--success" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
          <button className="bm-close-btn bm-close-btn--abs" onClick={onClose} aria-label="Close">✕</button>

          <div className="bm-success-icon" aria-hidden="true">
            <svg viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="30" stroke="#4caf82" strokeWidth="3" />
              <path d="M18 32l10 10 18-18" stroke="#4caf82" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h2 className="bm-success-title">Booking Confirmed!</h2>
          <p className="bm-success-sub">Your tickets are locked in and saved to your account. See you at the show.</p>

          <div className="bm-success-ticket">
            <p className="bm-confirm-kicker">✳ GOODSHOW CINEMA · {confirmedReference}</p>
            <h3 className="bm-confirm-movie">{selectedMovie?.title}</h3>
            <div className="bm-confirm-rows">
              <div className="bm-confirm-row"><span>Show</span><span>{booking.showtime}</span></div>
              <div className="bm-confirm-row"><span>Seats</span><span>{booking.seats.join(', ')}</span></div>
              <div className="bm-confirm-row"><span>Paid</span><span className="bm-confirm-price">₹{total}</span></div>
            </div>
          </div>

          <button className="bm-download-btn" onClick={downloadTicketInvoice}>
            ↓ Download ticket &amp; invoice
          </button>

          <div className="bm-success-actions">
            <div className="bm-food-prompt">
              <p className="bm-food-prompt-text">🍿 Want to pre-order from the Food Court?</p>
              <button className="bm-food-btn" onClick={handleGoFood}>
                Head to Food Court →
              </button>
            </div>
            <button className="bm-done-btn" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Step screens ────────────────────────────────────────────────────────────
  return (
    <div
      className="bm-backdrop"
      onClick={onClose}
      onWheel={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
    >
      <div className="bm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">

        {/* Header */}
        <div className="bm-header">
          <div className="bm-header-left">
            {step !== 'movie' && (
              <button className="bm-back-btn" onClick={goBack} aria-label="Go back">
                ←
              </button>
            )}
            <div>
              <p className="bm-kicker">BOX OFFICE</p>
              <h2 className="bm-title">
                {step === 'movie'    && 'Select a film'}
                {step === 'showtime' && selectedMovie?.title}
                {step === 'seats'    && 'Pick your seats'}
                {step === 'confirm'  && 'Confirm booking'}
              </h2>
            </div>
          </div>
          <button className="bm-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Step indicator */}
        <div className="bm-steps" aria-hidden="true">
          {['Film', 'Time', 'Seats', 'Pay'].map((label, i) => (
            <div
              key={label}
              className={`bm-step-dot ${i === stepIndex ? 'is-active' : ''} ${i < stepIndex ? 'is-done' : ''}`}
            >
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bm-body">

          {/* 1. Pick Movie */}
          {step === 'movie' && (
            <div className="bm-movies-grid">
              {movies.map((m) => (
                <button
                  key={m.id}
                  className={`bm-movie-card ${booking.movie === m.id ? 'is-selected' : ''}`}
                  onClick={() => selectMovie(m.id)}
                >
                  <span className="bm-movie-genre">{m.genre}</span>
                  <strong className="bm-movie-name">{m.title}</strong>
                  <span className="bm-movie-meta">{m.duration} · {m.rating}</span>
                </button>
              ))}
            </div>
          )}

          {/* 2. Pick Showtime */}
          {step === 'showtime' && (
            <div className="bm-showtimes">
              <p className="bm-section-label">Today's showtimes</p>
              <div className="bm-times-grid">
                {showtimes.map((t) => (
                  <button
                    key={t}
                    className={`bm-time-btn ${booking.showtime === t ? 'is-selected' : ''}`}
                    onClick={() => selectShowtime(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <p className="bm-hint">All screens equipped with Dolby Atmos sound</p>
            </div>
          )}

          {/* 3. Pick Seats */}
          {step === 'seats' && (
            <div className="bm-seats-wrap">
              <div className="bm-screen-bar" aria-label="Screen direction">
                <span>SCREEN THIS WAY</span>
              </div>
              <div className="bm-grid" role="group" aria-label="Seat map">
                {ROWS.map((row) => (
                  <div key={row} className="bm-row">
                    <span className="bm-row-label">{row}</span>
                    {Array.from({ length: COLS }, (_, c) => {
                      const seatId = `${row}${c + 1}`
                      const sold = isSold(row, c + 1)
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
                  <button className="bm-proceed-btn" onClick={handleProceedToConfirm}>Proceed →</button>
                </div>
              )}
            </div>
          )}

          {/* 4. Confirm & Pay */}
          {step === 'confirm' && (
            <div className="bm-confirm">
              <div className="bm-confirm-card">
                <p className="bm-confirm-kicker">✳ GOODSHOW CINEMA</p>
                <h3 className="bm-confirm-movie">{selectedMovie?.title}</h3>
                <div className="bm-confirm-rows">
                  <div className="bm-confirm-row"><span>Date</span><span>Today</span></div>
                  <div className="bm-confirm-row"><span>Show</span><span>{booking.showtime}</span></div>
                  <div className="bm-confirm-row"><span>Seats</span><span>{booking.seats.join(', ')}</span></div>
                  <div className="bm-confirm-row">
                    <span>Total</span>
                    <span className="bm-confirm-price">₹{total}</span>
                  </div>
                </div>
              </div>
              <button className="bm-confirm-btn" onClick={handleConfirm}>
                Confirm &amp; Pay ₹{total}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
