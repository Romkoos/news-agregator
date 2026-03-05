import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '@/shared/api/index.js'
import { Button, Input } from '@/shared/ui/index.js'
import { useAuthStore } from '@/entities/user/index.js'
import type { UserProfile } from '@repo/contracts'

export function ProfileForm() {
  const { t } = useTranslation()
  const { user, setAuth } = useAuthStore()
  const accessToken = useAuthStore((s) => s.accessToken)
  const [name, setName] = useState(user?.name ?? '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '')
  const [success, setSuccess] = useState(false)

  const mutation = useMutation({
    mutationFn: () =>
      api
        .patch<UserProfile>('/users/me', {
          name,
          avatarUrl: avatarUrl.trim() || null,
        })
        .then((r) => r.data),
    onSuccess: (data) => {
      if (accessToken) {
        setAuth(accessToken, {
          id: data.id,
          email: data.email,
          name: data.name,
          avatarUrl: data.avatarUrl,
        })
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label={t('auth.name')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Input
        label={t('profile.avatarUrl')}
        type="url"
        value={avatarUrl}
        onChange={(e) => setAvatarUrl(e.target.value)}
        placeholder="https://example.com/avatar.jpg"
      />
      {success && (
        <p className="text-sm text-green-600 dark:text-green-400">
          {t('profile.updateSuccess')}
        </p>
      )}
      {mutation.isError && (
        <p className="text-sm text-red-500">{t('common.error')}</p>
      )}
      <Button type="submit" isLoading={mutation.isPending}>
        {t('common.save')}
      </Button>
    </form>
  )
}
