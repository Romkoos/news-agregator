import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArticleCard, articleApi } from '@/entities/article/index.js'
import { CategoryTab } from '@/entities/category/index.js'
import { BookmarkButton } from '@/features/bookmark-toggle/index.js'
import { Spinner } from '@/shared/ui/index.js'
import type { Category } from '@/entities/category/index.js'

interface ArticleListProps {
  categories: Category[]
}

export function ArticleList({ categories }: ArticleListProps) {
  const { t } = useTranslation()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined)
  const [page, setPage] = useState(1)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['articles', { categoryId: selectedCategoryId, page }],
    queryFn: () => articleApi.list({ categoryId: selectedCategoryId, page, limit: 20 }),
  })

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1

  return (
    <div className="flex flex-col gap-6">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        <CategoryTab
          category={null}
          isActive={selectedCategoryId === undefined}
          onClick={() => { setSelectedCategoryId(undefined); setPage(1) }}
          label={t('news.allCategories')}
        />
        {categories.map((cat) => (
          <CategoryTab
            key={cat.id}
            category={cat}
            isActive={selectedCategoryId === cat.id}
            onClick={() => { setSelectedCategoryId(cat.id); setPage(1) }}
            label={cat.nameEn}
          />
        ))}
      </div>

      {/* Article grid */}
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
          {t('news.noArticles')}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            &larr; Prev
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  )
}
