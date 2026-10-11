import { request, type Booking, type User } from './api'

export interface Checkout {
  _id: string; orderId?: string; key: string; amount: number; currency: string
  state: string; expiresAt: string; testMode: boolean; booking: Booking | null; failureReason?: string
  refundStatus?: string; seatDetails?: { label: string }[]
}
interface RazorpayResult { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
interface RazorpayOptions {
  key: string; order_id: string; amount: number; currency: string; name: string; description: string
  prefill: { name: string; email: string }; theme: { color: string }; timeout: number
  config: { display: { hide: { method: string }[] } }
  handler: (result: RazorpayResult) => void
  modal: { ondismiss: () => void }
}
declare global {
  interface Window { Razorpay?: new (options: RazorpayOptions) => { open: () => void } }
}
let loader: Promise<void> | undefined
export function loadCheckout() {
  if (window.Razorpay) return Promise.resolve()
  if (!loader) loader = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    const timer = setTimeout(() => { script.remove(); reject(new Error('Payment checkout took too long to load. Please retry.')) }, 15000)
    script.onload = () => { clearTimeout(timer); if (window.Razorpay) resolve(); else reject(new Error('Payment checkout is unavailable')) }
    script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error('Cannot load Razorpay checkout. Check your connection and retry.')) }
    document.body.appendChild(script)
  }).catch(error => { loader = undefined; throw error })
  return loader
}
export async function pay(order: Checkout, user: User): Promise<Checkout> {
  if (order.state === 'PAID' || order.state.startsWith('REFUND')) return order
  if (order.state !== 'PENDING' || !order.orderId || new Date(order.expiresAt) <= new Date()) throw new Error(order.failureReason || 'This checkout expired or is not ready. Check My bookings before starting again.')
  await loadCheckout()
  return new Promise((resolve, reject) => {
    let submitted = false
    const checkout = new window.Razorpay!({
      key: order.key, order_id: order.orderId!, amount: order.amount, currency: order.currency,
      name: 'Goodshow', description: 'Cinema tickets · TEST MODE',
      prefill: { name: user.name, email: user.email }, theme: { color: '#b84b34' },
      // Razorpay test mode does not support real UPI QR/intent scans. Use
      // success@razorpay in the UPI collect field if UPI simulation is needed.
      config: { display: { hide: [{ method: 'upi' }] } },
      timeout: Math.max(1, Math.floor((new Date(order.expiresAt).getTime() - Date.now()) / 1000)),
      handler: result => {
        submitted = true
        request<Checkout>('/payments/verify', { method: 'POST', body: JSON.stringify({ checkoutId: order._id, ...result }) })
          .then(r => resolve(r.data)).catch(() => reject(new Error('Payment verification is pending. Open My bookings and choose Check status; do not pay again.')))
      },
      modal: { ondismiss: () => {
        if (!submitted) request<Checkout>(`/payments/${order._id}/reconcile`, { method: 'POST' }).then(r => resolve(r.data)).catch(reject)
      } },
    })
    checkout.open()
  })
}
