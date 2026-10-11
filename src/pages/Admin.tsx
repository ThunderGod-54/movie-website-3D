import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { errorMessage, listAll, request, showLabel, uploadMovieAsset, type Booking } from '../lib/api'
import AccountMenu from '../components/AccountMenu'
import { SignInModal } from '../components/SignInModal'
import type { Checkout } from '../lib/payment'
import './Admin.css'

type Row = Record<string, unknown> & { _id: string }
type Resource = 'movies' | 'theatres' | 'screens' | 'shows'
type Tab = Resource | 'dashboard' | 'bookings' | 'payments' | 'check-in'
type Field = { key: string; label: string; type?: string; required?: boolean; options?: string[]; reference?: Resource; initial?: string; createOnly?: boolean; upload?: 'image' | 'video' }
const fields: Record<Resource, Field[]> = {
  movies: [
    { key: 'title', label: 'Title', required: true }, { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'genres', label: 'Genres (comma separated)', required: true }, { key: 'languages', label: 'Languages (comma separated)', required: true, initial: 'English' },
    { key: 'duration', label: 'Duration (minutes)', type: 'number', required: true, initial: '120' }, { key: 'releaseDate', label: 'Release date', type: 'date', required: true },
    { key: 'status', label: 'Status', options: ['NOW_SHOWING', 'UPCOMING', 'ENDED'], initial: 'NOW_SHOWING' },
    { key: 'certificate', label: 'Certificate', options: ['U', 'UA', 'A', 'S'], initial: 'UA' },
    { key: 'posterUrl', label: 'Poster URL', type: 'url', upload: 'image' }, { key: 'trailerUrl', label: 'Trailer URL', type: 'url', upload: 'video' },
    { key: 'director', label: 'Director' }, { key: 'cast', label: 'Cast (comma separated)' },
  ],
  theatres: [
    { key: 'name', label: 'Theatre name', required: true }, { key: 'address.line1', label: 'Street address', required: true },
    { key: 'address.city', label: 'City', required: true }, { key: 'address.state', label: 'State', required: true },
    { key: 'address.pincode', label: 'PIN code', required: true }, { key: 'facilities', label: 'Facilities (comma separated)' },
    { key: 'phone', label: 'Phone' }, { key: 'isActive', label: 'Active', options: ['true', 'false'], initial: 'true' },
  ],
  screens: [
    { key: 'theatre', label: 'Theatre', reference: 'theatres', required: true, createOnly: true }, { key: 'name', label: 'Screen name', required: true },
    { key: 'screenType', label: 'Screen type', options: ['STANDARD', 'IMAX', '4DX', 'DOLBY_ATMOS'], initial: 'STANDARD' },
    { key: 'isActive', label: 'Active', options: ['true', 'false'], initial: 'true' },
    { key: 'layout', label: 'Seat layout (one row per line: row, count, category)', type: 'textarea', createOnly: true, required: true, initial: 'A, 8, REGULAR\nB, 8, REGULAR\nC, 6, PREMIUM\nD, 4, RECLINER' },
  ],
  shows: [
    { key: 'movie', label: 'Movie', reference: 'movies', required: true }, { key: 'theatre', label: 'Theatre', reference: 'theatres', required: true },
    { key: 'screen', label: 'Screen', reference: 'screens', required: true }, { key: 'startTime', label: 'Start time (your local time)', type: 'datetime-local', required: true },
    { key: 'language', label: 'Language', required: true, initial: 'English' }, { key: 'format', label: 'Format', options: ['2D', '3D', 'IMAX', '4DX'], initial: '2D' },
    { key: 'prices.REGULAR', label: 'Regular price (INR)', type: 'number', required: true, initial: '220' },
    { key: 'prices.PREMIUM', label: 'Premium price (INR)', type: 'number', required: true, initial: '320' },
    { key: 'prices.RECLINER', label: 'Recliner price (INR)', type: 'number', required: true, initial: '450' },
  ],
}
function valueAt(row: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((value, part) => value && typeof value === 'object' ? (value as Record<string, unknown>)[part] : undefined, row)
}
function stringValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ')
  if (value && typeof value === 'object') return String((value as Row)._id || '')
  return value === undefined || value === null ? '' : String(value)
}
function label(row: Row) { return String(row.title || row.name || valueAt(row, 'movie.title') || row.bookingReference || row.orderId || row._id) }
function localInput(value: string, dateOnly = false) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  if (dateOnly) return date.toISOString().slice(0, 10)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
function parseLayout(value: string) {
  return value.trim().split('\n').filter(Boolean).map(line => {
    const [row, count, category = 'REGULAR'] = line.split(',').map(s => s.trim())
    if (!row || !Number.isInteger(Number(count)) || Number(count) < 1) throw new Error('Each row needs a label, seat count and category, e.g. A, 8, REGULAR')
    return { row: row.toUpperCase(), count: Number(count), category: category.toUpperCase() }
  })
}
function Editor({ resource, row, references, onSaved, onClose }: { resource: Resource; row: Row | null; references: Record<Resource, Row[]>; onSaved: () => void; onClose: () => void }) {
  const visibleFields = fields[resource].filter(f => !row || !f.createOnly)
  const [initialValues] = useState<Record<string, string>>(() => Object.fromEntries(visibleFields.map(f => {
    const value = row ? stringValue(valueAt(row, f.key)) : f.initial || ''
    return [f.key, value && f.type?.startsWith('date') ? localInput(value, f.type === 'date') : value]
  })))
  const [values, setValues] = useState(initialValues)
  const [files, setFiles] = useState<Record<string, File | undefined>>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (lock.current) return
    lock.current = true; setBusy(true); setError('')
    try {
      const body: Record<string, unknown> = {}
      for (const field of visibleFields) {
        const value = values[field.key]?.trim()
        if (row && value === initialValues[field.key]?.trim() && !files[field.key]) continue
        if (!value) continue
        let parsed: unknown = value
        if (['genres', 'languages', 'cast', 'facilities'].includes(field.key)) parsed = value.split(',').map(s => s.trim()).filter(Boolean)
        if (field.type === 'number') parsed = Number(value)
        if (field.type === 'datetime-local') parsed = new Date(value).toISOString()
        if (field.key === 'isActive') parsed = value === 'true'
        if (field.key === 'layout') parsed = parseLayout(value)
        if (field.upload && files[field.key]) parsed = await uploadMovieAsset(files[field.key]!, field.upload)
        const [parent, child] = field.key.split('.')
        if (child) body[parent] = { ...(body[parent] as object || {}), [child]: parsed }
        else body[parent] = parsed
      }
      if (Object.keys(body).length) await request(`/${resource}${row ? `/${row._id}` : ''}`, { method: row ? 'PATCH' : 'POST', body: JSON.stringify(body) })
      onSaved()
    } catch (e) { setError(errorMessage(e)) }
    finally { setBusy(false); lock.current = false }
  }
  return <section className="admin-editor">
    <h2>{row ? 'Edit' : 'Add'} {resource.slice(0, -1)}</h2>
    {resource === 'shows' && <p>Create a movie, theatre and screen first. Screens must have seats. Times use your browser timezone.</p>}
    <form onSubmit={save}>
      <div className="admin-fields">{visibleFields.map(field => {
        const choices = field.reference ? references[field.reference].filter(option => field.key !== 'screen' || !values.theatre || stringValue(option.theatre) === values.theatre) : []
        const props = { id: `admin-${field.key}`, 'aria-label': field.label, required: field.required, value: values[field.key] || '', onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setValues(v => ({ ...v, [field.key]: e.target.value, ...(field.key === 'theatre' && resource === 'shows' ? { screen: '' } : {}) })) }
        return <label key={field.key} htmlFor={props.id}>{field.label}
          {field.options || field.reference ? <select {...props}><option value="">Select…</option>{field.options?.map(o => <option key={o}>{o}</option>)}{choices.map(o => <option key={o._id} value={o._id}>{label(o)}</option>)}</select>
            : field.type === 'textarea' ? <textarea {...props} rows={4} /> : <input {...props} type={field.type || 'text'} min={field.type === 'number' ? 0 : undefined} step={field.key.startsWith('prices.') ? '0.01' : '1'} />}
          {field.upload && <><small className="admin-upload-help">Or upload a {field.upload === 'image' ? 'poster image' : 'trailer video'} to Cloudinary.</small><input
            id={`${props.id}-file`} type="file" accept={field.upload === 'image' ? 'image/jpeg,image/png,image/webp' : 'video/mp4,video/webm,video/quicktime'}
            onChange={e => setFiles(current => ({ ...current, [field.key]: e.target.files?.[0] }))} /></>}
        </label>
      })}</div>
      {error && <p role="alert" className="admin-error">{error}</p>}
      <div className="admin-actions"><button disabled={busy} type="submit">{busy ? 'Saving…' : 'Save'}</button><button disabled={busy} type="button" className="secondary" onClick={onClose}>Close</button></div>
    </form>
  </section>
}

function CheckIn() {
  const location = useLocation()
  const [token, setToken] = useState(() => new URLSearchParams(location.search).get('ticket') || '')
  const [ticket, setTicket] = useState<Booking | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(checkIn: boolean) {
    setBusy(true); setError('')
    try {
      const { data } = await request<Booking>(`/tickets/${checkIn ? 'check-in' : 'validate'}`, { method: 'POST', body: JSON.stringify({ token }) })
      setTicket(data)
    } catch (e) { setTicket(null); setError(errorMessage(e)) }
    finally { setBusy(false) }
  }
  return <section className="admin-editor"><h2>Ticket check-in</h2><p>Scan a ticket with your phone camera to open this page, or paste the scanned ticket link below. Sign in as an admin to validate it. Entry opens two hours before the show.</p>
    <label>Ticket QR link or token<textarea rows={4} value={token} onChange={e => { setToken(e.target.value); setTicket(null) }} /></label>
    <button disabled={busy || !token.trim()} onClick={() => submit(false)}>Validate ticket</button>
    {error && <p role="alert" className="admin-error">{error}</p>}
    {ticket && <article className="admin-ticket"><h3>{ticket.show?.movie.title}</h3><p>{ticket.show && showLabel(ticket.show)}</p><p>{ticket.bookingReference}</p><p>Seats: {ticket.seatDetails.map(s => s.label).join(', ')}</p><p>TEST MODE · {ticket.paymentStatus}</p>
      {ticket.checkedInAt ? <strong>Already checked in: {new Date(ticket.checkedInAt).toLocaleString()}</strong> : <button disabled={busy} onClick={() => submit(true)}>Admit all {ticket.seatDetails.length} guests</button>}
    </article>}
  </section>
}

function AdminWorkspace() {
  const location = useLocation()
  const [tab, setTab] = useState<Tab>(location.pathname.endsWith('/check-in') ? 'check-in' : 'dashboard')
  const [rows, setRows] = useState<Row[]>([])
  const [stats, setStats] = useState<Record<string, unknown>>({})
  const [references, setReferences] = useState<Record<Resource, Row[]>>({ movies: [], theatres: [], screens: [], shows: [] })
  const [editing, setEditing] = useState<Row | null | undefined>()
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [version, setVersion] = useState(0)
  const resource = ['movies', 'theatres', 'screens', 'shows'].includes(tab) ? tab as Resource : null
  const refresh = useCallback(() => setVersion(v => v + 1), [])
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      const [movieRows, theatreRows, screenRows] = await Promise.all(['movies', 'theatres', 'screens'].map(r => listAll<Row>(`/${r}`, controller.signal)))
      if (controller.signal.aborted) return
      setReferences({ movies: movieRows, theatres: theatreRows, screens: screenRows, shows: [] })
      if (tab === 'dashboard') {
        const { data } = await request<Record<string, unknown>>('/admin/stats', { signal: controller.signal })
        if (!controller.signal.aborted) setStats(data)
      } else if (tab !== 'check-in') {
        const path = resource ? `/${resource}` : `/admin/${tab}`
        const result = tab === 'shows' ? (await Promise.all(['SCHEDULED', 'CANCELLED'].map(status => listAll<Row>(`/shows?status=${status}`, controller.signal)))).flat() : await listAll<Row>(path, controller.signal)
        if (!controller.signal.aborted) setRows(result)
      }
    }
    load().catch(e => { if (!controller.signal.aborted) setError(errorMessage(e)) }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [tab, version, resource])
  function reload() { setLoading(true); setError(''); refresh() }
  async function action(row: Row, kind: 'delete' | 'cancel' | 'reconcile') {
    if (busy) return
    if (kind !== 'reconcile' && !window.confirm(`${kind === 'delete' ? 'Delete' : 'Cancel'} ${label(row)}?${kind === 'cancel' ? ' Paid bookings will receive full test refunds.' : ''}`)) return
    setBusy(true); setError(''); setNotice('')
    try {
      if (kind === 'reconcile') {
        const { data } = await request<Checkout>(`/payments/${row._id}/reconcile`, { method: 'POST' }); setNotice(`Payment status: ${data.state}${data.refundStatus ? ` (${data.refundStatus})` : ''}`)
      } else if (tab === 'shows' && kind === 'cancel') await request(`/shows/${row._id}`, { method: 'PATCH', body: JSON.stringify({ status: 'CANCELLED' }) })
      else await request(`${tab === 'bookings' ? '/admin/bookings' : `/${tab}`}/${row._id}`, { method: 'DELETE', body: JSON.stringify({}) })
      reload()
    } catch (e) { setError(errorMessage(e)) }
    finally { setBusy(false) }
  }
  return <>
    <nav className="admin-tabs" aria-label="Admin sections">{(['dashboard', 'movies', 'theatres', 'screens', 'shows', 'bookings', 'payments', 'check-in'] as Tab[]).map(t => <button key={t} className={tab === t ? 'active' : ''} onClick={() => { setTab(t); setEditing(undefined); setRows([]); setLoading(true); setError(''); setNotice('') }}>{t.replace('-', ' ')}</button>)}</nav>
    <div className="admin-toolbar"><h1>{tab.replace('-', ' ')}</h1><div className="admin-actions"><button className="secondary" onClick={reload} disabled={loading}>Refresh</button>{resource && <button onClick={() => setEditing(null)}>Add {resource.slice(0, -1)}</button>}</div></div>
    {error && <p role="alert" className="admin-error">{error}</p>}{notice && <p role="status">{notice}</p>}
    {loading && <p role="status">Loading…</p>}
    {editing !== undefined && resource && <Editor key={`${resource}:${editing?._id || 'new'}`} resource={resource} row={editing} references={references} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); setNotice('Saved successfully.'); reload() }} />}
    {tab === 'dashboard' && !loading && <><div className="admin-stats">{['movies', 'theatres', 'screens', 'scheduledShows', 'users'].map(key => <article key={key}><span>{key.replace('scheduledShows', 'Scheduled shows')}</span><strong>{String(stats[key] ?? 0)}</strong></article>)}<article><span>Confirmed bookings</span><strong>{String(valueAt(stats, 'bookings.confirmed') ?? 0)}</strong></article><article><span>Booked value (INR)</span><strong>{String(stats.revenue ?? 0)}</strong></article></div><p>Start with Movies → Theatres → Screens → Shows. The customer lobby displays NOW_SHOWING movies with future shows. Razorpay runs in test mode.</p></>}
    {tab === 'check-in' && <CheckIn />}
    {!loading && !['dashboard', 'check-in'].includes(tab) && <div className="admin-table-wrap"><table><thead><tr><th>Name / reference</th><th>Details</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      {!rows.length && <tr><td colSpan={4}>No records yet.</td></tr>}
      {rows.map(row => <tr key={row._id}><td><strong>{label(row)}</strong><small>{row._id}</small></td><td>
        {tab === 'movies' && `${row.duration} min · ${stringValue(row.languages)}`}
        {tab === 'theatres' && stringValue(valueAt(row, 'address.city'))}
        {tab === 'screens' && `${row.totalSeats || 0} seats · ${stringValue(row.screenType)}`}
        {tab === 'shows' && `${new Date(String(row.startTime)).toLocaleString()} · ${stringValue(valueAt(row, 'theatre.name'))} · ${stringValue(valueAt(row, 'screen.name'))}`}
        {tab === 'bookings' && `${stringValue(valueAt(row, 'show.movie.title'))} · INR ${row.totalAmount} · ${stringValue(valueAt(row, 'user.email'))}`}
        {tab === 'payments' && `INR ${(Number(row.amount) / 100).toFixed(2)} · ${stringValue(row.refundStatus)}`}
      </td><td>{stringValue(row.status || row.state || (row.isActive === false ? 'Inactive' : 'Active'))}<small>{stringValue(row.paymentStatus)}</small></td><td><div className="admin-actions">
        {resource && row.status !== 'CANCELLED' && <button className="secondary" disabled={busy} onClick={() => setEditing(row)}>Edit</button>}
        {resource && <button className="danger" disabled={busy} onClick={() => action(row, 'delete')}>Delete</button>}
        {((tab === 'shows' && row.status === 'SCHEDULED') || (tab === 'bookings' && row.status === 'CONFIRMED')) && <button className="danger" disabled={busy} onClick={() => action(row, 'cancel')}>Cancel</button>}
        {tab === 'payments' && <button disabled={busy} onClick={() => action(row, 'reconcile')}>Check / retry refund</button>}
      </div></td></tr>)}
    </tbody></table></div>}
  </>
}
export default function Admin() {
  const { user, ready } = useAuth()
  const [login, setLogin] = useState(false)
  return <main className="admin-page"><header className="admin-header"><Link to="/lobby">← Goodshow lobby</Link><span>THE PICTURE HOUSE / ADMIN</span><AccountMenu /></header>
    {!ready ? <p>Loading account…</p> : !user ? <section className="admin-editor"><h1>Admin sign in</h1><p>Use an account with the ADMIN role to manage the cinema.</p><button onClick={() => setLogin(true)}>Sign in as admin</button></section> : user.role !== 'ADMIN' ? <section className="admin-editor"><h1>Admin access required</h1><p>Your account has no admin permissions. Sign out and use an admin account.</p></section> : <AdminWorkspace />}
    <SignInModal isOpen={login && !user} onClose={() => setLogin(false)} originRect={null} />
  </main>
}
