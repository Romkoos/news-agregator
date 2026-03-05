import { useEffect } from 'react'
import { useAuthStore } from '@/entities/user/index.js'
import { api } from '@/shared/api/index.js'
import { setupInterceptors } from '@/shared/api/interceptors.js'
import type { ReactNode } from 'react'

/**
 * Wires Axios interceptors once, then rehydrates the authenticated user from
 * /users/me when a persisted access token is present in the store.
 * Sets isHydrated=true once both steps complete so AuthGuard can decide.
 */
export function ApiProvider({ children }: { children: ReactNode }) {
  const { accessToken, setAuth, clearAuth } = useAuthStore()

  useEffect(() => {
    // ── 1. Wire Axios interceptors (token attach + 401 refresh + logout) ──
    setupInterceptors(
      api,
      () => useAuthStore.getState().accessToken,
      (newToken) => {
        const user = useAuthStore.getState().user
        if (user) useAuthStore.getState().setAuth(newToken, user)
      },
      clearAuth,
    )

    // ── 2. Rehydrate user on boot (handles page refresh with stored token) ──
    if (!accessToken) {
      useAuthStore.setState({ isHydrated: true })
      return
    }

    api
      .get('/users/me')
      .then((r) => {
        const { id, email, name, avatarUrl } = r.data
        setAuth(accessToken, { id, email, name, avatarUrl })
      })
      .catch(() => {
        clearAuth()
      })
      .finally(() => {
        useAuthStore.setState({ isHydrated: true })
      })
    // Run once on mount only — accessToken comes from persisted store
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}
