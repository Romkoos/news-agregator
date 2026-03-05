import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '@/shared/api/index.js'
import { cn } from '@/shared/lib/index.js'
import { useAuthStore } from '@/entities/user/index.js'

const LANGUAGES = [
  { code: 'en', labelKey: 'settings.english' },
  { code: 'ru', labelKey: 'settings.russian' },
] as const

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  const accessToken = useAuthStore((s) => s.accessToken)

  const mutation = useMutation({
    mutationFn: (lang: string) =>
      api.patch('/users/me/preferences', { language: lang }),
  })

  const handleChange = (lang: string) => {
    i18n.changeLanguage(lang)
    if (accessToken) {
      mutation.mutate(lang)
    }
  }

  return (
    <div className="flex gap-2" role="group" aria-label="Language">
      {LANGUAGES.map(({ code, labelKey }) => (
        <button
          key={code}
          onClick={() => handleChange(code)}
          aria-pressed={i18n.language === code}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            i18n.language === code
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
          )}
        >
          {t(labelKey)}
        </button>
      ))}
    </div>
  )
}
