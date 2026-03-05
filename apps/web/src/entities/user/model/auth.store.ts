import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from './types.js'

interface AuthState {
  accessToken: string | null
  user: User | null
  isHydrated: boolean
  setAuth: (accessToken: string, user: User) => void
  clearAuth: () => void
  setHydrated: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isHydrated: false,
      setAuth: (accessToken, user) => set({ accessToken, user }),
      clearAuth: () => set({ accessToken: null, user: null }),
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated()
      },
    },
  ),
)
