import { create } from 'zustand'
import { getToken, request, tokenKey, type User } from './api'

interface AuthState {
  user: User | null
  ready: boolean
  authenticate: (mode: 'login' | 'register', values: { email: string; password: string; name?: string }, remember: boolean) => Promise<void>
  restore: () => Promise<void>
  logout: () => void
}
export const useAuth = create<AuthState>((set) => ({
  user: null,
  ready: false,
  authenticate: async (mode, values, remember) => {
    const { data } = await request<{ user: User; token: string }>(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(values) })
    localStorage.removeItem(tokenKey); sessionStorage.removeItem(tokenKey)
    ;(remember ? localStorage : sessionStorage).setItem(tokenKey, data.token)
    set({ user: data.user, ready: true })
  },
  restore: async () => {
    const token = getToken()
    if (!token) { set({ ready: true }); return }
    try {
      const { data } = await request<User>('/auth/me')
      if (getToken() === token) set({ user: data })
    } catch { /* A failed restore leaves the visitor signed out; 401 clears the token. */ }
    finally { set({ ready: true }) }
  },
  logout: () => {
    localStorage.removeItem(tokenKey); sessionStorage.removeItem(tokenKey)
    set({ user: null, ready: true })
  },
}))
window.addEventListener('goodshow:logout', () => useAuth.getState().logout())
