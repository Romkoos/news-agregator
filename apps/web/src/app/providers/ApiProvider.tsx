import { useEffect } from 'react'
import { setupInterceptors } from '@/shared/api/interceptors.js'
import { api } from '@/shared/api/axios.js'
import { useAuthStore } from '@/entities/user/index.js'

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const setAuth = useAuthStore(s => s.setAuth)
  const clearAuth = useAuthStore(s => s.clearAuth)
  const getToken = () => useAuthStore.getState().accessToken

  useEffect(() => {
    setupInterceptors(
      api,
      getToken,
      (newToken) => {
        const user = useAuthStore.getState().user
        if (user) setAuth(newToken, user)
      },
      clearAuth,
    )
  }, [])

  return <>{children}</>
}
