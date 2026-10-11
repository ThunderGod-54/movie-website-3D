import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { errorMessage, request, showLabel, type Booking } from '../lib/api'
import { useApiList } from '../hooks/useApiList'
import { SignInModal } from './SignInModal'
import './BookingModal.css'
import Ticket from './Ticket'
import { pay, type Checkout } from '../lib/payment'

export function History({ onClose }: { onClose: () => void }) {
  const user = useAuth(s => s.user)!
  const { items, loading, error, reload } = useApiList<Booking>('/bookings')
  const payments = useApiList<Checkout>('/payments')
  const [actionError, setActionError] = useState('')
  const [pending, setPending] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const lock = useRef(false)
  async function checkPayment(id: string, resume = false) {
    if (lock.current) return
    lock.current = true; setPending(id); setActionError('')
    try {
      const { data } = await request<Checkout>(`/payments/${id}/reconcile`, { method: 'POST' })
      const result = resume && data.state === 'PENDING' ? await pay(data, user) : data
      if (result.failureReason) setActionError(result.failureReason)
      else if (result.state === 'PENDING') setActionError('Payment is still pending. You can resume checkout while the reservation is active.')
      reload(); payments.reload()
    } catch (e) { setActionError(errorMessage(e)) }
    finally { setPending(null); lock.current = false }
  }
  async function cancel(id: string) {
    if (lock.current) return
    lock.current = true; setPending(id); setActionError('')
    try {
      await request<Booking>(`/bookings/${id}`, { method: 'DELETE', body: JSON.stringify({ reason: 'Cancelled by customer' }) })
      setConfirmId(null); reload(); payments.reload()
    } catch (e) { setActionError(errorMessage(e)) }
    finally { setPending(null); lock.current = false }
  }
  return createPortal(<div className="bm-backdrop" onClick={() => { if (!pending) onClose() }} onWheel={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()} onPointerUp={e => e.stopPropagation()}>
    <div className="bm-modal" role="dialog" aria-modal="true" aria-label="My bookings" onClick={e => e.stopPropagation()}>
      <div className="bm-header"><h2 className="bm-title">My bookings</h2><button className="bm-close-btn" disabled={!!pending} onClick={onClose} aria-label="Close booking history">✕</button></div>
      <div className="bm-body">
        {loading && <p role="status">Loading your bookings…</p>}
        {error && <p role="alert">{error} <button onClick={reload}>Retry</button></p>}
        {actionError && <p role="alert">{actionError}</p>}
        {!loading && !error && !items.length && <p>Your tickets will appear here after you book.</p>}
        {items.map(booking => <article className="bm-confirm-card" key={booking._id}>
          <h3>{booking.show?.movie?.title || 'Movie unavailable'}</h3><p>{booking.bookingReference}</p>
          <p>{booking.show && showLabel(booking.show)}</p><p>Seats: {booking.seatDetails.map(s => s.label).join(', ')}</p>
          <p>{booking.status} · ₹{booking.totalAmount}</p>
          {booking.paymentStatus && <p>Payment: {booking.paymentStatus.replaceAll('_', ' ')}</p>}
          {booking.status === 'CONFIRMED' && booking.paymentStatus === 'PAID' && <Ticket booking={booking} />}
          {booking.status === 'CONFIRMED' && !booking.checkedInAt && booking.show && new Date(booking.show.startTime) > new Date() && (
            confirmId === booking._id ? <div><p>Cancel this booking and release the seats?</p><button disabled={!!pending} onClick={() => cancel(booking._id)}>{pending ? 'Cancelling…' : 'Yes, cancel booking'}</button> <button disabled={!!pending} onClick={() => setConfirmId(null)}>Keep tickets</button></div>
              : <button disabled={!!pending} onClick={() => setConfirmId(booking._id)}>Cancel booking</button>
          )}
        </article>)}
        <h3>Payment activity</h3>
        {payments.loading && <p>Loading payments…</p>}
        {payments.error && <p role="alert">{payments.error} <button onClick={payments.reload}>Retry</button></p>}
        {payments.items.map(payment => <article className="bm-confirm-card" key={payment._id}>
          <p>{payment.orderId || 'Checkout'} · ₹{(payment.amount / 100).toFixed(2)}</p>
          <p>{payment.state.replaceAll('_', ' ')}{payment.refundStatus ? ` · ${payment.refundStatus}` : ''}</p>
          <p>Seats: {payment.seatDetails?.map(s => s.label).join(', ')}</p>
          {payment.failureReason && <p>{payment.failureReason}</p>}
          {['PENDING', 'EXPIRED', 'REFUND_PENDING'].includes(payment.state) && <button disabled={!!pending} onClick={() => checkPayment(payment._id)}>Check status</button>}
          {payment.state === 'PENDING' && new Date(payment.expiresAt) > new Date() && <button disabled={!!pending} onClick={() => checkPayment(payment._id, true)}>Resume payment</button>}
        </article>)}
      </div>
    </div>
  </div>, document.body)
}
export default function AccountMenu() {
  const { user, ready, logout } = useAuth()
  const [signIn, setSignIn] = useState(false)
  const [history, setHistory] = useState(false)
  return <div className="account-actions" onPointerDown={e => e.stopPropagation()} onPointerUp={e => e.stopPropagation()}>
    {user ? <><span className="account-name">{user.name}</span>{user.role === 'ADMIN' && <Link to="/admin">Admin</Link>}<button onClick={() => setHistory(true)}>My bookings</button><button onClick={() => { logout(); setHistory(false); setSignIn(false) }}>Sign out</button></>
      : <button disabled={!ready} onClick={() => setSignIn(true)}>{ready ? 'Sign in' : 'Loading account…'}</button>}
    <SignInModal isOpen={signIn && !user} onClose={() => setSignIn(false)} originRect={null} />
    {history && user && <History key={user._id} onClose={() => setHistory(false)} />}
  </div>
}
