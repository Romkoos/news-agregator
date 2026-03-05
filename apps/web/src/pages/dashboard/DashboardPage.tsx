import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/entities/user/index.js'

export function DashboardPage() {
  const { t } = useTranslation()
  const user = useAuthStore(s => s.user)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {t('dashboard.welcome', { name: user?.name ?? '' })}
      </h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Navigate to News to browse articles by category.
      </p>
    </div>
  )
}
