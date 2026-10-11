export interface User { _id: string; name: string; email: string; role: 'USER' | 'ADMIN' }
export interface Movie { _id: string; title: string; description?: string; duration: number; genres: string[]; languages: string[]; certificate: string; posterUrl?: string; trailerUrl?: string }
export interface CloudinaryUploadSignature {
  cloudName: string; apiKey: string; timestamp: number; folder: string; signature: string
}
export interface Show {
  _id: string; movie: Movie; theatre: { name: string; address: { city: string } }; screen: { name: string }
  startTime: string; status: string; language: string; format: string
}
export interface Seat { _id: string; row: string; number: number; label: string; category: string; price: number; status: 'AVAILABLE' | 'BOOKED' | 'HELD' }
export interface Availability { show: Show; seats: Seat[] }
export interface Booking {
  _id: string; bookingReference: string; show: Show | null; status: string; totalAmount: number
  seatDetails: { label: string; category: string; price: number }[]
  paymentStatus?: 'PAID' | 'REFUND_PENDING' | 'REFUNDED'; paymentId?: string; testMode?: boolean; checkedInAt?: string
}
export interface Envelope<T> { data: T; meta?: { page: number; totalPages: number }; message: string; success: boolean; errors?: { field: string; message: string }[] }
export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) { super(message); this.status = status }
}
const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
export async function downloadFile(path: string, filename: string) {
  const response = await fetch(`${base}${path}`, { headers: { Authorization: `Bearer ${getToken() || ''}` } })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.message || 'Could not download the ticket')
  }
  const url = URL.createObjectURL(await response.blob())
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export const tokenKey = 'goodshow.token'
export function getToken() { return localStorage.getItem(tokenKey) || sessionStorage.getItem(tokenKey) }
export async function request<T>(path: string, options: RequestInit = {}): Promise<Envelope<T>> {
  const token = getToken()
  const headers = new Headers(options.headers)
  if (options.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  let response: Response
  try { response = await fetch(`${base}${path}`, { ...options, headers }) }
  catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError('Cannot reach the cinema server. Please try again.', 0)
  }
  let body: Envelope<T>
  try { body = await response.json() }
  catch { throw new ApiError('The server returned an unexpected response. Check the API connection.', response.status) }
  if (!response.ok || !body.success) {
    if (response.status === 401 && token && getToken() === token) {
      localStorage.removeItem(tokenKey); sessionStorage.removeItem(tokenKey)
      window.dispatchEvent(new Event('goodshow:logout'))
    }
    throw new ApiError(body.errors?.map(e => e.message).join(' ') || body.message || 'Request failed', response.status)
  }
  return body
}
export async function uploadMovieAsset(file: File, resourceType: 'image' | 'video'): Promise<string> {
  const maxBytes = resourceType === 'image' ? 10 * 1024 * 1024 : 200 * 1024 * 1024
  if (file.size > maxBytes) throw new ApiError(`${resourceType === 'image' ? 'Poster images' : 'Trailer videos'} must be smaller than ${resourceType === 'image' ? '10 MB' : '200 MB'}.`, 413)
  const { data } = await request<CloudinaryUploadSignature>('/admin/uploads/signature')
  const form = new FormData()
  form.append('file', file)
  form.append('api_key', data.apiKey)
  form.append('timestamp', String(data.timestamp))
  form.append('folder', data.folder)
  form.append('signature', data.signature)
  const response = await fetch(`https://api.cloudinary.com/v1_1/${data.cloudName}/${resourceType}/upload`, { method: 'POST', body: form })
  const body = await response.json().catch(() => ({}))
  if (!response.ok || !body.secure_url) throw new ApiError(body.error?.message || 'Cloudinary upload failed', response.status)
  return body.secure_url
}
export async function listAll<T>(path: string, signal?: AbortSignal): Promise<T[]> {
  const items: T[] = []
  let page = 1
  while (true) {
    const result = await request<T[]>(`${path}${path.includes('?') ? '&' : '?'}limit=100&page=${page}`, { signal })
    items.push(...result.data)
    if (!result.meta || page >= result.meta.totalPages) return items
    page++
  }
}
export const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong. Please try again.'
export const showLabel = (show: Show) => `${new Date(show.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} · ${show.theatre.name}, ${show.theatre.address.city} · ${show.screen.name}`
