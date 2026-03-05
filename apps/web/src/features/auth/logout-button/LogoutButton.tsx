import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/index.js'
import { api } from '@/shared/api/index.js'
import { useAuthStore } from '@/entities/user/index.js'

export function LogoutButton() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const clearAuth = useAuthStore(s => s.clearAuth)

  const mutation = useMutation({
    mutationFn: async () => api.delete('/auth/logout'),
    onSettled: () => {
      clearAuth()
      navigate('/login')
    },
  })

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => mutation.mutate()}
      isLoading={mutation.isPending}
    >
      {t('auth.logout')}
    </Button>
  )
}
