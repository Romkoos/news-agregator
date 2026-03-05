import { useTranslation } from 'react-i18next'
import { useAuthStore, UserAvatar } from '@/entities/user/index.js'
import { ProfileForm, ChangePasswordForm } from '@/features/profile-form/index.js'
import { Card } from '@/shared/ui/index.js'

export function ProfilePage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)

  return (
    <div className="flex flex-col gap-8 max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {t('profile.title')}
      </h1>

      {/* Avatar preview */}
      <div className="flex items-center gap-4">
        <UserAvatar name={user?.name ?? ''} avatarUrl={user?.avatarUrl ?? null} size="lg" />
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{user?.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
        </div>
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          {t('profile.title')}
        </h2>
        <ProfileForm />
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          {t('auth.currentPassword')}
        </h2>
        <ChangePasswordForm />
      </Card>
    </div>
  )
}
