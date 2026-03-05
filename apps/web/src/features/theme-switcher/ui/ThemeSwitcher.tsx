import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '@/shared/api/index.js'
import { cn } from '@/shared/lib/index.js'
import { useAuthStore } from '@/entities/user/index.js'

type Theme = 'LIGHT' | 'DARK'

function getCurrentTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'DARK' : 'LIGHT'
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'DARK')
  localStorage.setItem('theme', theme === 'DARK' ? 'dark' : 'light')
}

export function ThemeSwitcher() {
  const { t } = useTranslation()
  const accessToken = useAuthStore((s) => s.accessToken)
  const [theme, setTheme] = useState<Theme>(getCurrentTheme)

  const mutation = useMutation({
    mutationFn: (newTheme: Theme) =>
      api.patch('/users/me/preferences', { theme: newTheme }),
  })

  const handleChange = (newTheme: Theme) => {
    applyTheme(newTheme)
    setTheme(newTheme)
    if (accessToken) {
      mutation.mutate(newTheme)
    }
  }

  return (
    <div className="flex gap-2" role="group" aria-label="Theme">
      {(['LIGHT', 'DARK'] as Theme[]).map((t_) => (
        <button
          key={t_}
          onClick={() => handleChange(t_)}
          aria-pressed={theme === t_}
          aria-label={t_ === 'LIGHT' ? t('settings.light') : t('settings.dark')}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            theme === t_
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
          )}
        >
          {t_ === 'LIGHT' ? t('settings.light') : t('settings.dark')}
        </button>
      ))}
    </div>
  )
}
