import { cn } from '@/shared/lib/cn.js'
import type { HTMLAttributes } from 'react'

export function Spinner({ className, 'aria-label': ariaLabel = 'Loading', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={cn(
        'h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600',
        className,
      )}
      {...props}
    />
  )
}
