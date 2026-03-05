import { useTranslation } from 'react-i18next'
import { ThemeSwitcher } from '@/features/theme-switcher/index.js'
import { LanguageSwitcher } from '@/features/language-switcher/index.js'
import { Card } from '@/shared/ui/index.js'

export function SettingsPage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-8 max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {t('settings.title')}
      </h1>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
          {t('settings.theme')}
        </h2>
        <ThemeSwitcher />
      </Card>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
          {t('settings.language')}
        </h2>
        <LanguageSwitcher />
      </Card>
    </div>
  )
}
