import { cn } from '@/shared/lib/cn.js'

interface UserAvatarProps {
  name: string
  avatarUrl: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function UserAvatar({ name, avatarUrl, size = 'md', className }: UserAvatarProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-16 w-16 text-xl' }

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn('rounded-full object-cover', sizes[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-primary-600 font-semibold text-white',
        sizes[size],
        className,
      )}
      aria-label={name}
    >
      {initials}
    </div>
  )
}
