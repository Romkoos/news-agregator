import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/index.js'

const navItems = [
  { labelKey: 'nav.dashboard', to: '/',         icon: '📰' },
  { labelKey: 'nav.news',      to: '/news',      icon: '🗂️' },
  { labelKey: 'nav.bookmarks', to: '/bookmarks', icon: '🔖' },
  { labelKey: 'nav.settings',  to: '/settings',  icon: '⚙️' },
]

export function BottomNav() {
  const { t } = useTranslation()

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 flex h-16 items-stretch border-t border-surface bg-surface lg:hidden dark:border-gray-700 dark:bg-gray-900"
      aria-label="Main navigation"
    >
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors',
              isActive
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
            )
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  'flex h-7 w-12 items-center justify-center rounded-full text-lg transition-colors',
                  isActive && 'bg-primary-50 dark:bg-primary-900/20',
                )}
                aria-hidden="true"
              >
                {item.icon}
              </span>
              <span>{t(item.labelKey)}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
