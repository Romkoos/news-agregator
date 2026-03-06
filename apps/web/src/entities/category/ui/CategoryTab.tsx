import { cn } from '@/shared/lib/index.js'
import type { Category } from '../model/types.js'

interface CategoryTabProps {
  category: Category | null // null = "All"
  isActive: boolean
  onClick: () => void
  label: string
}

export function CategoryTab({ isActive, onClick, label }: CategoryTabProps) {
  return (
    <button
      onClick={onClick}
      aria-pressed={isActive}
      className={cn(
        'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-secondary/20 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-secondary/10',
      )}
    >
      {label}
    </button>
  )
}
