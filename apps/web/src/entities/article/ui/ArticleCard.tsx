import { cn } from '@/shared/lib/index.js'
import type { ReactNode } from 'react'
import type { Article } from '../model/types.js'

interface ArticleCardProps {
  article: Article
  renderBookmark: (article: Article) => ReactNode
  className?: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function ArticleCard({ article, renderBookmark, className }: ArticleCardProps) {
  return (
    <article
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800',
        className,
      )}
    >
      {article.imageUrl && (
        <img
          src={article.imageUrl}
          alt={article.title}
          className="h-40 w-full object-cover"
        />
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>{article.source.name}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
          {article.category && (
            <>
              <span aria-hidden="true">·</span>
              <span className="rounded-full bg-primary-50 px-2 py-0.5 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400">
                {article.category.nameEn}
              </span>
            </>
          )}
        </div>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="line-clamp-2 text-sm font-semibold text-gray-900 hover:text-primary-600 dark:text-white dark:hover:text-primary-400"
        >
          {article.title}
        </a>
        {article.summary && (
          <p className="line-clamp-2 text-xs text-gray-600 dark:text-gray-400">
            {article.summary}
          </p>
        )}
        <div className="mt-auto flex justify-end">
          {renderBookmark(article)}
        </div>
      </div>
    </article>
  )
}
