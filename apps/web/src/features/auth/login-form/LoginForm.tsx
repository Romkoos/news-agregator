import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/index.js'
import { Input } from '@/shared/ui/index.js'
import { api } from '@/shared/api/index.js'
import { useAuthStore } from '@/entities/user/index.js'
import type { AuthResponse } from '@repo/contracts'

export function LoginForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setAuth = useAuthStore(s => s.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) =>
      api.post<AuthResponse>('/auth/login', data).then(r => r.data),
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user)
      navigate('/')
    },
    onError: () => setError(t('auth.invalidCredentials')),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    mutation.mutate({ email, password })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {t('auth.loginTitle')}
      </h1>
      <Input
        label={t('auth.email')}
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        autoComplete="email"
      />
      <Input
        label={t('auth.password')}
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        autoComplete="current-password"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" isLoading={mutation.isPending} size="lg">
        {t('auth.login')}
      </Button>
      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        {t('auth.noAccount')}{' '}
        <Link
          to="/register"
          className="font-medium text-primary-600 hover:underline"
        >
          {t('auth.register')}
        </Link>
      </p>
    </form>
  )
}
