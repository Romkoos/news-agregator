import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { categoryApi } from '@/entities/category/index.js'
import { ArticleList } from '@/widgets/article-list/index.js'
import { Spinner } from '@/shared/ui/index.js'

export function NewsPage() {
  const { t } = useTranslation()

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryApi.list,
    staleTime: Infinity, // categories rarely change
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner aria-label="Loading" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {t('nav.news')}
      </h1>
      <ArticleList categories={categories ?? []} />
    </div>
  )
}
