import { useEffect } from 'react'
import { useAuthStore } from '@/entities/user/index.js'
import { api } from '@/shared/api/index.js'
import { setupInterceptors } from '@/shared/api/interceptors.js'
import { i18n } from '@/shared/i18n/index.js'
import type { ReactNode } from 'react'

function applyTheme(theme: 'LIGHT' | 'DARK') {
  document.documentElement.classList.toggle('dark', theme === 'DARK')
  localStorage.setItem('theme', theme === 'DARK' ? 'dark' : 'light')
}

export function ApiProvider({ children }: { children: ReactNode }) {
  const { accessToken, setAuth, clearAuth } = useAuthStore()

  useEffect(() => {
    // ── 1. Wire Axios interceptors ──
    setupInterceptors(
      api,
      () => useAuthStore.getState().accessToken,
      (newToken) => {
        const user = useAuthStore.getState().user
        if (user) useAuthStore.getState().setAuth(newToken, user)
      },
      clearAuth,
    )

    // ── 2. Rehydrate user on boot ──
    if (!accessToken) {
      useAuthStore.setState({ isHydrated: true })
      return
    }

    api
      .get('/users/me')
      .then((r) => {
        const { id, email, name, avatarUrl, preferences } = r.data
        setAuth(accessToken, { id, email, name, avatarUrl })

        // Apply server preferences — API takes priority over localStorage (design spec)
        if (preferences) {
          applyTheme(preferences.theme)
          void i18n.changeLanguage(preferences.language)
          localStorage.setItem('lang', preferences.language)
        }
      })
      .catch(() => {
        clearAuth()
      })
      .finally(() => {
        useAuthStore.setState({ isHydrated: true })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}
