import { cn } from '@/shared/lib/cn.js'
import type { HTMLAttributes } from 'react'

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
