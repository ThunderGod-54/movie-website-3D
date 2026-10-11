import { create } from 'zustand'
import { authService, type UserProfile, type AuthSession, type BookingRecord } from '../services/authService'

export interface PendingBooking {
  movieId: string
  movieTitle: string
  showtime: string
  seats: string[]
}

interface AuthState {
  user: UserProfile | null
  session: AuthSession | null
  isAuthenticated: boolean
  isLoading: boolean
  errorMessage: string | null
  userBookings: BookingRecord[]
  pendingBooking: PendingBooking | null

  isSignInModalOpen: boolean
  signInPrompt: string | null

  // Actions
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  restoreSession: () => void
  loadUserBookings: () => void
  createBooking: (data: {
    movieId: string
    movieTitle: string
    showtime: string
    seats: string[]
    totalPrice: number
  }) => BookingRecord
  setPendingBooking: (pending: PendingBooking | null) => void
  clearPendingBooking: () => void
  clearError: () => void
  openSignInModal: (prompt?: string | null) => void
  closeSignInModal: () => void
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Restore session immediately if available
  const initialSession = typeof window !== 'undefined' ? authService.getSession() : null
  const initialUser = initialSession?.user || null
  const initialBookings = initialUser ? authService.getUserBookings(initialUser.id) : []

  return {
    user: initialUser,
    session: initialSession,
    isAuthenticated: Boolean(initialSession),
    isLoading: false,
    errorMessage: null,
    userBookings: initialBookings,
    pendingBooking: null,
    isSignInModalOpen: false,
    signInPrompt: null,

    login: async (email, password) => {
      set({ isLoading: true, errorMessage: null })
      try {
        const session = await authService.signIn(email, password)
        const bookings = authService.getUserBookings(session.user.id)
        set({
          user: session.user,
          session,
          isAuthenticated: true,
          isLoading: false,
          errorMessage: null,
          userBookings: bookings,
        })
        return true
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Invalid credentials. Please try again.'
        set({
          isLoading: false,
          errorMessage: msg,
          isAuthenticated: false,
          user: null,
          session: null,
        })
        return false
      }
    },

    register: async (name, email, password) => {
      set({ isLoading: true, errorMessage: null })
      try {
        const session = await authService.signUp(name, email, password)
        set({
          user: session.user,
          session,
          isAuthenticated: true,
          isLoading: false,
          errorMessage: null,
          userBookings: [],
        })
        return true
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Registration failed.'
        set({
          isLoading: false,
          errorMessage: msg,
          isAuthenticated: false,
          user: null,
          session: null,
        })
        return false
      }
    },

    logout: () => {
      authService.clearSession()
      set({
        user: null,
        session: null,
        isAuthenticated: false,
        errorMessage: null,
        userBookings: [],
        pendingBooking: null,
      })
    },

    restoreSession: () => {
      const session = authService.getSession()
      if (session) {
        const bookings = authService.getUserBookings(session.user.id)
        set({
          user: session.user,
          session,
          isAuthenticated: true,
          userBookings: bookings,
        })
      } else {
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          userBookings: [],
        })
      }
    },

    loadUserBookings: () => {
      const { user } = get()
      if (user) {
        const bookings = authService.getUserBookings(user.id)
        set({ userBookings: bookings })
      }
    },

    createBooking: (data) => {
      const { session } = get()
      if (!session) {
        throw new Error('Authentication required: Please sign in before booking tickets.')
      }

      const record = authService.createBooking(session.token, data)
      const updated = authService.getUserBookings(session.user.id)
      set({ userBookings: updated, pendingBooking: null })
      return record
    },

    setPendingBooking: (pending) => set({ pendingBooking: pending }),
    clearPendingBooking: () => set({ pendingBooking: null }),
    clearError: () => set({ errorMessage: null }),
    openSignInModal: (prompt = null) => set({ isSignInModalOpen: true, signInPrompt: prompt }),
    closeSignInModal: () => set({ isSignInModalOpen: false, signInPrompt: null }),
  }
})
