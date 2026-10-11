import { useEffect, useState } from 'react'
import { downloadFile, errorMessage, request, type Booking } from '../lib/api'

export default function Ticket({ booking }: { booking: Booking }) {
  const [qr, setQr] = useState('')
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)
  const [downloading, setDownloading] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    request<{ qrDataUrl: string }>(`/tickets/${booking._id}`, { signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setQr(data.qrDataUrl) })
      .catch(e => { if (!controller.signal.aborted) setError(errorMessage(e)) })
    return () => controller.abort()
  }, [booking._id, version])
  async function download() {
    setDownloading(true); setError('')
    try { await downloadFile(`/tickets/${booking._id}/pdf`, `${booking.bookingReference}.pdf`) }
    catch (e) { setError(errorMessage(e)) }
    finally { setDownloading(false) }
  }
  return <div className="ticket-view">
    <p><strong>TEST MODE</strong> · No real money charged</p>
    {qr ? <img src={qr} width={230} height={230} alt={`Entry QR code for booking ${booking.bookingReference}`} /> : !error && <p role="status">Generating your QR ticket…</p>}
    <p>Show this QR at entry. Keep it private. One scan admits all seats on this booking.</p>
    {booking.checkedInAt && <p>Checked in: {new Date(booking.checkedInAt).toLocaleString()}</p>}
    {error && <p role="alert">{error} <button onClick={() => { setError(''); setVersion(v => v + 1) }}>Retry</button></p>}
    <button className="bm-download-btn" disabled={downloading} onClick={download}>{downloading ? 'Downloading…' : 'Download PDF ticket'}</button>
  </div>
}
