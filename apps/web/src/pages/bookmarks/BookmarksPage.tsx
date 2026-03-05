import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { articleApi, ArticleCard } from '@/entities/article/index.js'
import { BookmarkButton } from '@/features/bookmark-toggle/index.js'
import { Spinner } from '@/shared/ui/index.js'

export function BookmarksPage() {
  const { t } = useTranslation()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: articleApi.listBookmarks,
  })

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {t('news.bookmarks')}
      </h1>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner aria-label="Loading" />
        </div>
      )}
      {isError && (
        <p className="text-center text-sm text-red-500">{t('common.error')}</p>
      )}
      {data && data.items.length === 0 && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          {t('news.noBookmarks')}
        </p>
      )}
      {data && data.items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              renderBookmark={(a) => (
                <BookmarkButton articleId={a.id} isBookmarked={a.isBookmarked} />
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
