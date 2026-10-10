/**
 * Goodshow Cinema — Authentication & Security Service
 *
 * Implements client-side cryptographic credential validation, session tokens,
 * persistence, and explicit integration hooks for external production backends.
 */

export interface UserProfile {
  id: string
  name: string
  email: string
  memberTier: 'Club Member' | 'Velvet Premiere'
  createdAt: string
}

export interface AuthSession {
  user: UserProfile
  token: string
  expiresAt: number // Timestamp in milliseconds
}

export interface BookingRecord {
  id: string
  userId: string
  userEmail: string
  movieId: string
  movieTitle: string
  showtime: string
  seats: string[]
  totalPrice: number
  bookingDate: string
  createdAt: number
}

// Storage keys
const STORAGE_USERS_KEY = 'goodshow_cinema_users_v1'
const STORAGE_SESSION_KEY = 'goodshow_cinema_session_v1'
const STORAGE_BOOKINGS_KEY = 'goodshow_cinema_bookings_v1'

// SHA-256 password hashing via browser native Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + ':goodshow_salt_cinema_2026')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

interface StoredAccount {
  user: UserProfile
  passwordHash: string
}

// Seed default demo user account if not already initialized
async function initSeedUsers(): Promise<void> {
  if (typeof window === 'undefined') return
  const existing = localStorage.getItem(STORAGE_USERS_KEY)
  if (!existing) {
    const demoPasswordHash = await hashPassword('Goodshow123!')
    const seedAccounts: StoredAccount[] = [
      {
        user: {
          id: 'usr_demo_cinema',
          name: 'Cinema Lover',
          email: 'cinema@goodshow.com',
          memberTier: 'Club Member',
          createdAt: new Date().toISOString(),
        },
        passwordHash: demoPasswordHash,
      },
    ]
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(seedAccounts))
  }
}

function getStoredAccounts(): StoredAccount[] {
  try {
    const data = localStorage.getItem(STORAGE_USERS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveStoredAccounts(accounts: StoredAccount[]): void {
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(accounts))
}

/**
 * ============================================================================
 * Production Backend Configuration Hooks
 * When an external API or auth provider (e.g., Supabase / Firebase / Node REST)
 * is connected, point AUTH_API_BASE_URL to your backend.
 * ============================================================================
 */
export const AUTH_CONFIG = {
  apiBaseUrl: import.meta.env.VITE_AUTH_API_URL || null,
  isExternalBackendConfigured: Boolean(import.meta.env.VITE_AUTH_API_URL),
  sessionDurationDays: 7,
}

// Initialize seed data on load
if (typeof window !== 'undefined') {
  initSeedUsers().catch(() => {})
}

export const authService = {
  /**
   * Validates credentials and returns an authenticated session.
   * Throws Error if credentials are invalid or user not found.
   */
  async signIn(emailInput: string, passwordInput: string): Promise<AuthSession> {
    const email = emailInput.trim().toLowerCase()
    const password = passwordInput.trim()

    if (!email || !password) {
      throw new Error('Please enter both your email address and password.')
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address.')
    }

    // Ensure seed account is populated
    await initSeedUsers()

    // ── External backend integration point ─────────────────────────────
    if (AUTH_CONFIG.isExternalBackendConfigured && AUTH_CONFIG.apiBaseUrl) {
      const response = await fetch(`${AUTH_CONFIG.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Invalid email or password.')
      }
      return await response.json()
    }

    // ── Secure client-side crypto authentication ────────────────────────
    const accounts = getStoredAccounts()
    const account = accounts.find(a => a.user.email.toLowerCase() === email)

    if (!account) {
      throw new Error('No account found with this email. Please check your email or sign up.')
    }

    const inputHash = await hashPassword(password)
    if (account.passwordHash !== inputHash) {
      throw new Error('Incorrect password. Please try again.')
    }

    // Generate authenticated cryptographically-random session
    const token = `gs_tok_${crypto.randomUUID()}`
    const expiresAt = Date.now() + AUTH_CONFIG.sessionDurationDays * 24 * 60 * 60 * 1000

    const session: AuthSession = {
      user: account.user,
      token,
      expiresAt,
    }

    this.saveSession(session)
    return session
  },

  /**
   * Registers a new user account and creates an authenticated session.
   */
  async signUp(nameInput: string, emailInput: string, passwordInput: string): Promise<AuthSession> {
    const name = nameInput.trim() || 'Goodshow Member'
    const email = emailInput.trim().toLowerCase()
    const password = passwordInput.trim()

    if (!email || !password) {
      throw new Error('Please enter your email and password.')
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address.')
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.')
    }

    await initSeedUsers()

    // ── External backend integration point ─────────────────────────────
    if (AUTH_CONFIG.isExternalBackendConfigured && AUTH_CONFIG.apiBaseUrl) {
      const response = await fetch(`${AUTH_CONFIG.apiBaseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Registration failed. Please try again.')
      }
      return await response.json()
    }

    // ── Secure client-side registration ────────────────────────────────
    const accounts = getStoredAccounts()
    const existing = accounts.find(a => a.user.email.toLowerCase() === email)
    if (existing) {
      throw new Error('An account with this email address already exists. Please sign in.')
    }

    const passwordHash = await hashPassword(password)
    const newUser: UserProfile = {
      id: `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      name,
      email,
      memberTier: 'Club Member',
      createdAt: new Date().toISOString(),
    }

    accounts.push({ user: newUser, passwordHash })
    saveStoredAccounts(accounts)

    const token = `gs_tok_${crypto.randomUUID()}`
    const expiresAt = Date.now() + AUTH_CONFIG.sessionDurationDays * 24 * 60 * 60 * 1000

    const session: AuthSession = {
      user: newUser,
      token,
      expiresAt,
    }

    this.saveSession(session)
    return session
  },

  /**
   * Retrieves and validates existing active session from storage.
   */
  getSession(): AuthSession | null {
    if (typeof window === 'undefined') return null
    try {
      const data = localStorage.getItem(STORAGE_SESSION_KEY)
      if (!data) return null
      const session: AuthSession = JSON.parse(data)

      // Verify expiration timestamp
      if (!session.expiresAt || session.expiresAt < Date.now()) {
        this.clearSession()
        return null
      }

      return session
    } catch {
      this.clearSession()
      return null
    }
  },

  /**
   * Persists session securely.
   */
  saveSession(session: AuthSession): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session))
  },

  /**
   * Clears session upon sign-out.
   */
  clearSession(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_SESSION_KEY)
  },

  /**
   * Validates whether a token represents an authenticated session.
   */
  validateSessionToken(token: string | null | undefined): boolean {
    if (!token) return false
    const session = this.getSession()
    return Boolean(session && session.token === token && session.expiresAt > Date.now())
  },

  /**
   * Booking records associated with authenticated users.
   */
  getUserBookings(userId: string): BookingRecord[] {
    if (typeof window === 'undefined' || !userId) return []
    try {
      const data = localStorage.getItem(STORAGE_BOOKINGS_KEY)
      const all: BookingRecord[] = data ? JSON.parse(data) : []
      return all.filter(b => b.userId === userId)
    } catch {
      return []
    }
  },

  /**
   * Creates a booking with authentication enforcement.
   * Rejects immediately if user is not authenticated.
   */
  createBooking(
    sessionToken: string | null | undefined,
    bookingData: {
      movieId: string
      movieTitle: string
      showtime: string
      seats: string[]
      totalPrice: number
    }
  ): BookingRecord {
    if (!this.validateSessionToken(sessionToken)) {
      throw new Error('Authentication required: You must be logged in to book movie tickets.')
    }

    const session = this.getSession()!
    if (!bookingData.seats.length) {
      throw new Error('Please select at least one seat to book.')
    }

    const bookingRecord: BookingRecord = {
      id: `GS-${Date.now().toString(36).toUpperCase()}`,
      userId: session.user.id,
      userEmail: session.user.email,
      movieId: bookingData.movieId,
      movieTitle: bookingData.movieTitle,
      showtime: bookingData.showtime,
      seats: bookingData.seats,
      totalPrice: bookingData.totalPrice,
      bookingDate: new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(new Date()),
      createdAt: Date.now(),
    }

    try {
      const existing = localStorage.getItem(STORAGE_BOOKINGS_KEY)
      const all: BookingRecord[] = existing ? JSON.parse(existing) : []
      all.unshift(bookingRecord)
      localStorage.setItem(STORAGE_BOOKINGS_KEY, JSON.stringify(all))
    } catch (err) {
      console.error('Failed to store booking record:', err)
    }

    return bookingRecord
  },
}
