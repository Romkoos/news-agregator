export interface NavItem {
  labelKey: string
  to: string
  icon: string
}

export const navItems: NavItem[] = [
  { labelKey: 'nav.dashboard', to: '/',         icon: '📰' },
  { labelKey: 'nav.news',      to: '/news',      icon: '🗂️' },
  { labelKey: 'nav.bookmarks', to: '/bookmarks', icon: '🔖' },
  { labelKey: 'nav.settings',  to: '/settings',  icon: '⚙️' },
]
