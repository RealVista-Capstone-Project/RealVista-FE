import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Session } from './types'

/**
 * Auth Store
 * Global authentication state using Zustand
 * Manages user session and authentication status
 */
interface AuthStore {
  // State
  session: Session | null
  user: User | null
  isAuthenticated: boolean

  // Actions
  setSession: (session: Session) => void
  setUser: (user: User) => void
  clearSession: () => void
  updateUser: (updates: Partial<User>) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      isAuthenticated: false,

      setSession: (session) =>
        set({
          session,
          user: session.user,
          isAuthenticated: true,
        }),

      setUser: (user) => set((state) => ({ ...state, user, isAuthenticated: !!user })),

      clearSession: () =>
        set({
          session: null,
          user: null,
          isAuthenticated: false,
        }),

      updateUser: (updates) =>
        set((state) => ({
          ...state,
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        session: state.session,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
