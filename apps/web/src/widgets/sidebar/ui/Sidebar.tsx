import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/entities/user/index.js'
import { UserAvatar } from '@/entities/user/index.js'
import { LogoutButton } from '@/features/auth/index.js'
import { cn } from '@/shared/lib/index.js'

interface NavItem {
  labelKey: string
  to: string
  icon: string
}

const navItems: NavItem[] = [
  { labelKey: 'nav.dashboard', to: '/', icon: '📰' },
  { labelKey: 'nav.news', to: '/news', icon: '🗂️' },
  { labelKey: 'nav.bookmarks', to: '/bookmarks', icon: '🔖' },
  { labelKey: 'nav.settings', to: '/settings', icon: '⚙️' },
]

export function Sidebar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-200 px-6 dark:border-gray-700">
        <span className="text-lg font-bold text-gray-900 dark:text-white">
          News Digest
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map(item => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  )
                }
              >
                <span aria-hidden="true">{item.icon}</span>
                {t(item.labelKey)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User section */}
      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
        <button
          onClick={() => navigate('/profile')}
          className="flex w-full items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label={`${user?.name ?? ''} — go to profile`}
        >
          <UserAvatar
            name={user?.name ?? ''}
            avatarUrl={user?.avatarUrl ?? null}
            size="sm"
          />
          <span className="flex-1 truncate text-left text-sm font-medium text-gray-700 dark:text-gray-300">
            {user?.name}
          </span>
        </button>
        <div className="mt-2">
          <LogoutButton />
        </div>
      </div>
    </aside>
  )
}
