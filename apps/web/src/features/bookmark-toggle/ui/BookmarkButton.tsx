import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { articleApi } from '@/entities/article/index.js'
import { cn } from '@/shared/lib/index.js'

interface BookmarkButtonProps {
  articleId: string
  isBookmarked: boolean
  className?: string
}

export function BookmarkButton({ articleId, isBookmarked, className }: BookmarkButtonProps) {
  const { t } = useTranslation()
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: () =>
      isBookmarked ? articleApi.unbookmark(articleId) : articleApi.bookmark(articleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['articles'] })
      qc.invalidateQueries({ queryKey: ['bookmarks'] })
    },
  })

  return (
    <button
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      aria-pressed={isBookmarked}
      aria-label={isBookmarked ? t('news.unbookmark') : t('news.bookmark')}
      className={cn(
        'rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700',
        isBookmarked && 'text-primary-600 dark:text-primary-400',
        className,
      )}
    >
      {isBookmarked ? '★' : '☆'}
    </button>
  )
}
