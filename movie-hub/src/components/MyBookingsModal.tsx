import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAuthStore } from '../store/authStore'
import type { BookingRecord } from '../services/authService'
import './MyBookingsModal.css'

interface MyBookingsModalProps {
  isOpen: boolean
  onClose: () => void
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

function downloadTicketInvoice(booking: BookingRecord) {
  const movieTitle = escapeHtml(booking.movieTitle)
  const showtime = escapeHtml(booking.showtime)
  const seats = escapeHtml(booking.seats.join(', '))
  const bookingReference = escapeHtml(booking.id)
  const bookingDate = escapeHtml(booking.bookingDate)
  const total = booking.totalPrice

  const ticketHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Goodshow Ticket & Invoice — ${bookingReference}</title>
  <style>
    body{margin:0;padding:36px;background:#f4efe5;color:#29251f;font:16px/1.5 Arial,sans-serif}
    main{max-width:620px;margin:auto;padding:36px;background:#fffdf8;border:1px solid #ded4c3;border-radius:16px;box-shadow:0 12px 30px rgba(0,0,0,0.06)}
    h1{margin:0;color:#c85840;font-size:14px;letter-spacing:.16em}
    h2{margin:24px 0 4px;font-size:30px}
    p{color:#71695e}
    dl{margin:28px 0}
    dl div{display:flex;justify-content:space-between;gap:20px;padding:12px 0;border-bottom:1px solid #eee8dd}
    dt{color:#71695e}dd{margin:0;text-align:right;font-weight:700}
    .total{font-size:20px;color:#c85840}
    .reference{font-size:13px;letter-spacing:1px}
    @media print{body{padding:0;background:#fff}main{border:0;box-shadow:none}}
  </style>
</head>
<body>
  <main>
    <h1>GOODSHOW CINEMA · VELVET PASS</h1>
    <h2>${movieTitle}</h2>
    <p>Your official ticket reservation and payment receipt</p>
    <dl>
      <div><dt>Booking Reference</dt><dd class="reference">${bookingReference}</dd></div>
      <div><dt>Date Booked</dt><dd>${bookingDate}</dd></div>
      <div><dt>Showtime</dt><dd>${showtime}</dd></div>
      <div><dt>Seats</dt><dd>${seats}</dd></div>
      <div><dt>Admit Quantity</dt><dd>${booking.seats.length} Tickets</dd></div>
      <div><dt>Total Amount</dt><dd class="total">₹${total}</dd></div>
      <div><dt>Attendee</dt><dd>${escapeHtml(booking.userEmail)}</dd></div>
    </dl>
    <p>Please present this digital pass or printed copy at the auditorium entrance. Enjoy the screening!</p>
  </main>
</body>
</html>`

  const file = new Blob([ticketHtml], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = `goodshow-ticket-${booking.id}.html`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function MyBookingsModal({ isOpen, onClose }: MyBookingsModalProps) {
  const { user, userBookings, loadUserBookings } = useAuthStore()
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      loadUserBookings()
    }
  }, [isOpen, loadUserBookings])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const modalContent = (
    <div
      className="bookings-overlay"
      onClick={onClose}
      onWheel={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      role="presentation"
    >
      <div
        className="bookings-card"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bookings-modal-title"
      >
        <button
          type="button"
          className="bookings-close-btn"
          onClick={onClose}
          aria-label="Close My Bookings"
        >
          ✕
        </button>

        <div className="bookings-header">
          <div className="bookings-kicker">
            <span aria-hidden="true">🎟</span>
            <span>GOODSHOW CINEMA CLUB · VELVET ARCHIVE</span>
          </div>
          <h2 id="bookings-modal-title" className="bookings-title">
            My Ticket Reservations
          </h2>
          <p className="bookings-subtitle">
            {user ? `Showing bookings for ${user.name} (${user.email})` : 'Your cinema booking history'}
          </p>
        </div>

        <div className="bookings-list-container">
          {userBookings.length === 0 ? (
            <div className="bookings-empty-state">
              <div className="empty-icon" aria-hidden="true">🎬</div>
              <h3>No bookings found yet</h3>
              <p>You haven't booked any film tickets yet. Step into the theatre to explore tonight's lineup.</p>
            </div>
          ) : (
            <div className="bookings-list">
              {userBookings.map((b) => (
                <article key={b.id} className="booking-item">
                  <div className="booking-top-row">
                    <span className="booking-ref">{b.id}</span>
                    <span className="booking-date">{b.bookingDate}</span>
                  </div>
                  <h3 className="booking-movie-title">{b.movieTitle}</h3>
                  <div className="booking-details-grid">
                    <div className="booking-detail">
                      <span className="detail-label">Showtime</span>
                      <span className="detail-value">{b.showtime}</span>
                    </div>
                    <div className="booking-detail">
                      <span className="detail-label">Seats ({b.seats.length})</span>
                      <span className="detail-value seats-highlight">{b.seats.join(', ')}</span>
                    </div>
                    <div className="booking-detail">
                      <span className="detail-label">Total Paid</span>
                      <span className="detail-value price-highlight">₹{b.totalPrice}</span>
                    </div>
                  </div>
                  <div className="booking-item-footer">
                    <button
                      type="button"
                      className="booking-download-btn"
                      onClick={() => downloadTicketInvoice(b)}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      <span>Download Ticket &amp; Invoice</span>
                    </button>
                  </div>
                </article>
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
