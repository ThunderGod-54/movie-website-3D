import { useEffect, useRef, useState } from 'react'
import { ApiError, errorMessage, request, showLabel, type Availability, type Booking, type Movie, type Show } from '../lib/api'
import { useApiList } from '../hooks/useApiList'
import { useAuth } from '../lib/auth'
import { SignInModal } from './SignInModal'
import './BookingModal.css'
import Ticket from './Ticket'
import { loadCheckout, pay, type Checkout } from '../lib/payment'

function MoviePicker({ onSelect }: { onSelect: (movie: Movie) => void }) {
  const { items, loading, error, reload } = useApiList<Movie>('/movies?status=NOW_SHOWING')
  const [search, setSearch] = useState('')
  return <>
    <label className="bm-section-label">Search films <input className="bm-filter" value={search} onChange={e => setSearch(e.target.value)} placeholder="Movie title" /></label>
    {loading && <p role="status">Loading films…</p>}
    {error && <p role="alert">{error} <button onClick={reload}>Retry</button></p>}
    {!loading && !error && !items.length && <p>No films are currently showing. Please check back soon.</p>}
    <ul className="bm-movie-list">
      {items.filter(m => m.title.toLowerCase().includes(search.toLowerCase())).map(movie => <li key={movie._id}>
        <button className="bm-movie-card" onClick={() => onSelect(movie)}>
          {movie.posterUrl ? <img className="bm-movie-poster" src={movie.posterUrl} alt="" loading="lazy" /> : <span className="bm-movie-poster bm-movie-poster-fallback" aria-hidden="true">✳</span>}
          <div className="bm-movie-card-inner"><span className="bm-movie-title">{movie.title}</span>
            <div className="bm-movie-meta"><span>{movie.genres.join(' · ')}</span><span>{movie.certificate}</span><span>{movie.duration} min</span></div>
          </div><span>→</span>
        </button>
      </li>)}
    </ul>
  </>
}

function ShowPicker({ movie, onSelect }: { movie: Movie; onSelect: (show: Show) => void }) {
  const { items, loading, error, reload } = useApiList<Show>(`/shows?movie=${movie._id}&upcoming=true`)
  const [city, setCity] = useState('')
  const [date, setDate] = useState('')
  const visible = items.filter(s => (!city || s.theatre.address.city === city) && (!date || localDate(s.startTime) === date))
  return <>
    <div className="bm-movie-preview">
      {movie.posterUrl && <img src={movie.posterUrl} alt={`${movie.title} poster`} loading="lazy" />}
      <div>
        <h3>{movie.title}</h3>
        <p>{movie.description || `${movie.genres.join(' · ')} · ${movie.duration} min`}</p>
        {movie.trailerUrl && (movie.trailerUrl.includes('youtube.com') || movie.trailerUrl.includes('youtu.be')
          ? <a href={movie.trailerUrl} target="_blank" rel="noreferrer">Watch trailer ↗</a>
          : <video controls preload="metadata" src={movie.trailerUrl} aria-label={`${movie.title} trailer`} />)}
      </div>
    </div>
    <div className="bm-filters">
      <label>City<select className="bm-filter" value={city} onChange={e => setCity(e.target.value)}><option value="">All cities</option>{[...new Set(items.map(s => s.theatre.address.city))].map(c => <option key={c}>{c}</option>)}</select></label>
      <label>Date (your local time)<input className="bm-filter" type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
    </div>
    {loading && <p role="status">Loading upcoming shows…</p>}
    {error && <p role="alert">{error} <button onClick={reload}>Retry</button></p>}
    {!loading && !error && !visible.length && <p>No upcoming shows match this selection.</p>}
    <div className="bm-showtime-grid">{visible.map(show => <button key={show._id} className="bm-showtime-btn" onClick={() => onSelect(show)}>
      {showLabel(show)}<br /><small>{show.language} · {show.format}</small>
    </button>)}</div>
  </>
}
function localDate(value: string) {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function SeatPicker({ showId, movieId, onConfirmed, onBusy }: { showId: string; movieId: string; onConfirmed: (booking: Booking) => void; onBusy: (busy: boolean) => void }) {
  const user = useAuth(s => s.user)
  const ready = useAuth(s => s.ready)
  const [availability, setAvailability] = useState<Availability | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [review, setReview] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [version, setVersion] = useState(0)
  const lock = useRef(false)
  const attempt = useRef({ seats: '', requestId: '' })
  useEffect(() => {
    const controller = new AbortController()
    request<Availability>(`/shows/${showId}/seats`, { signal: controller.signal }).then(({ data }) => {
      if (controller.signal.aborted) return
      if (data.show.movie._id !== movieId) throw new Error('This show does not belong to the selected movie.')
      setAvailability(data)
      setSelected(current => current.filter(id => data.seats.some(s => s._id === id && s.status === 'AVAILABLE')))
      setLoading(false)
    }).catch(e => { if (!controller.signal.aborted) { setError(errorMessage(e)); setLoading(false) } })
    return () => controller.abort()
  }, [showId, movieId, version])
  const seats = availability?.seats || []
  const picked = seats.filter(s => selected.includes(s._id))
  const total = picked.reduce((sum, seat) => sum + seat.price, 0)
  const closed = availability && (availability.show.status !== 'SCHEDULED' || new Date(availability.show.startTime) <= new Date())
  function refresh() { setLoading(true); setVersion(v => v + 1) }
  async function confirm() {
    if (lock.current || !picked.length || closed || loading) return
    if (!user) { setAuthOpen(true); return }
    lock.current = true; setBusy(true); onBusy(true); setError('')
    try {
      await loadCheckout()
      const key = `${user._id}:${selected.slice().sort().join(',')}`
      if (attempt.current.seats !== key) attempt.current = { seats: key, requestId: crypto.randomUUID() }
      const { data } = await request<Checkout>('/payments/orders', { method: 'POST', body: JSON.stringify({ showId, seatIds: selected, requestId: attempt.current.requestId }) })
      if (['EXPIRED', 'FAILED'].includes(data.state)) {
        attempt.current.seats = ''
        throw new Error('This reservation expired or failed. Check My bookings if you attempted payment. Click Pay again to start a new reservation.')
      }
      const result = await pay(data, user)
      if (result.state === 'PAID' && result.booking) onConfirmed(result.booking)
      else setError(result.failureReason || 'Checkout was not completed. Your seats are held for up to 10 minutes. Resume payment here or check its status in My bookings.')
    } catch (e) {
      setError(errorMessage(e))
      if (e instanceof ApiError && e.status === 401) setAuthOpen(true)
      if (e instanceof ApiError && (e.status === 409 || e.status === 400)) { attempt.current.seats = ''; setReview(false); setSelected([]); refresh() }
      if (e instanceof ApiError && (e.status === 0 || e.status >= 500)) {
        setError(`${errorMessage(e)} The booking may have reached the server. Check My bookings before trying again.`)
        setReview(false); setSelected([]); refresh()
      }
    } finally { lock.current = false; setBusy(false); onBusy(false) }
  }
  return <>
    {loading && <p role="status">Loading seat availability…</p>}
    {error && <p role="alert">{error} {!busy && <button onClick={() => { setError(''); refresh() }}>Refresh availability</button>}</p>}
    {closed && <p role="alert">Booking is closed for this show. Please choose another show.</p>}
    {availability && <><p>{availability.show.movie.title}</p><p>{showLabel(availability.show)}</p></>}
    {!loading && !closed && availability && <>
      {!review ? <div className="bm-seat-section">
        <div className="bm-screen-label">SCREEN</div>
        <p>Choose up to 10 seats. Availability is checked again when you confirm.</p>
        <div className="bm-seat-grid">{[...new Set(seats.map(s => s.row))].map(row => <div key={row} className="bm-seat-row">
          <span className="bm-row-label">{row}</span>{seats.filter(s => s.row === row).map(seat => <button
            key={seat._id} className={`bm-seat ${seat.status !== 'AVAILABLE' ? 'is-sold' : ''} ${selected.includes(seat._id) ? 'is-picked' : ''}`}
            disabled={seat.status !== 'AVAILABLE' || (selected.length >= 10 && !selected.includes(seat._id))}
            aria-label={`${seat.label}, ${seat.category}, ₹${seat.price}, ${seat.status}`} aria-pressed={selected.includes(seat._id)} title={`${seat.label} · ${seat.category} · ₹${seat.price}`}
            onClick={() => setSelected(ids => ids.includes(seat._id) ? ids.filter(id => id !== seat._id) : [...ids, seat._id])}>{seat.number}</button>)}
        </div>)}</div>
        {!seats.length && <p>No seats are configured for this show.</p>}
        <div className="bm-seat-legend"><span><span className="bm-seat-dot available" />Available</span><span><span className="bm-seat-dot picked" />Selected</span><span><span className="bm-seat-dot sold" />Booked / held</span></div>
        <div className="bm-seat-footer"><span>{picked.map(s => s.label).join(', ')} · ₹{total.toFixed(2)}</span><button className="bm-proceed-btn" disabled={!picked.length} onClick={() => setReview(true)}>Review →</button></div>
      </div> : <div className="bm-confirm">
        <div className="bm-confirm-card">{picked.map(s => <p key={s._id}>{s.label} · {s.category} · ₹{s.price}</p>)}<strong>Total: ₹{total.toFixed(2)}</strong><p>Pay securely with Razorpay. Seats are held for 10 minutes. Your QR ticket is issued after payment verification.</p><p>Test mode · No real money is charged. Cancellations before the show receive a full test refund.</p></div>
        <button disabled={busy} className="bm-back-btn" onClick={() => setReview(false)}>Change seats</button>
        <button disabled={busy || !ready} className="bm-confirm-btn" onClick={confirm}>{busy ? 'Processing payment…' : user ? `Pay ₹${total.toFixed(2)}` : 'Sign in to pay'}</button>
      </div>}
    </>}
    <SignInModal isOpen={authOpen && !user} onClose={() => setAuthOpen(false)} originRect={null} />
  </>
}

type Props = { onClose: () => void; onGoToFood: () => void; initialMovieId?: string; initialShowId?: string }
export default function BookingModal({ onClose, onGoToFood, initialMovieId, initialShowId }: Props) {
  const [movie, setMovie] = useState<Movie | null>(null)
  const [show, setShow] = useState<Show | null>(null)
  const [receipt, setReceipt] = useState<Booking | null>(null)
  const [busy, setBusy] = useState(false)
  const [direct, setDirect] = useState(Boolean(initialMovieId && initialShowId))
  const close = () => { if (!busy) onClose() }
  useEffect(() => {
    const handler = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy && !document.querySelector('.signin-overlay')) onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [busy, onClose])
  return <div className="bm-backdrop" onClick={close} onWheel={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()} onPointerUp={e => e.stopPropagation()}>
    <div className="bm-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Book tickets">
      <div className="bm-header">
        <button disabled={busy} className="bm-back-btn" onClick={() => { setDirect(false); if (show) setShow(null); else setMovie(null) }} hidden={!!receipt || (!movie && !direct)}>← Back</button>
        <h2 className="bm-title">{receipt ? 'Booking confirmed!' : show || direct ? 'Your seats' : movie ? movie.title : 'Select a film'}</h2>
        <button disabled={busy} className="bm-close-btn" onClick={close} aria-label="Close booking">✕</button>
      </div>
      <div className="bm-body">
        {receipt ? <div className="bm-confirm">
          <div className="bm-confirm-card"><h3>{receipt.show?.movie.title}</h3><p>{receipt.bookingReference}</p><p>{receipt.show && showLabel(receipt.show)}</p><p>Seats: {receipt.seatDetails.map(s => s.label).join(', ')}</p><strong>Paid: ₹{receipt.totalAmount}</strong><p>{receipt.status} · {receipt.paymentStatus}</p></div>
          <Ticket booking={receipt} />
          <button className="bm-done-btn" onClick={onClose}>Done</button>
          <button className="bm-food-btn" onClick={() => { onClose(); onGoToFood() }}>Browse food menu</button>
        </div> : show || direct ? <SeatPicker key={show?._id || initialShowId} showId={show?._id || initialShowId!} movieId={movie?._id || initialMovieId!} onConfirmed={setReceipt} onBusy={setBusy} />
          : movie ? <ShowPicker key={movie._id} movie={movie} onSelect={setShow} /> : <MoviePicker onSelect={setMovie} />}
      </div>
    </div>
  </div>
}
