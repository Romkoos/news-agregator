import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/entities/user/index.js'
import { Spinner } from '@/shared/ui/index.js'

export function AuthGuard() {
  const { accessToken, isHydrated } = useAuthStore()

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner aria-label="Loading" />
      </div>
    )
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
