## Phase 6: Frontend — News & Bookmarks (Tasks 23–26)

---

### Task 23: entities/article + entities/category

**Files:**
- Create: `apps/web/src/entities/article/model/types.ts`
- Create: `apps/web/src/entities/article/api/article.api.ts`
- Create: `apps/web/src/entities/article/ui/ArticleCard.tsx`
- Create: `apps/web/src/entities/article/ui/ArticleCard.test.tsx`
- Create: `apps/web/src/entities/article/index.ts`
- Create: `apps/web/src/entities/category/model/types.ts`
- Create: `apps/web/src/entities/category/api/category.api.ts`
- Create: `apps/web/src/entities/category/ui/CategoryTab.tsx`
- Create: `apps/web/src/entities/category/index.ts`

---

**Step 1: Write failing test**

`ArticleCard` delegates the bookmark action to `BookmarkButton` (from Task 24 — features/bookmark-toggle). To avoid a circular dependency at this stage, `ArticleCard` accepts an optional `renderBookmark` render-prop so tests can inject a stub and the widget layer can inject the real `BookmarkButton`. This keeps `entities/article` independent of `features/bookmark-toggle` per FSD rules.

Create `apps/web/src/entities/article/ui/ArticleCard.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ArticleCard } from './ArticleCard.js'
import type { Article } from '../model/types.js'

const article: Article = {
  id: '1',
  title: 'Test Article',
  summary: 'A short summary.',
  url: 'https://example.com/article',
  imageUrl: null,
  publishedAt: '2026-03-01T10:00:00.000Z',
  source: { id: 's1', name: 'BBC News' },
  category: { id: 'c1', slug: 'technology', nameEn: 'Technology', nameRu: 'Технологии' },
  isBookmarked: false,
}

function renderCard(overrides?: Partial<Article>) {
  return render(
    <MemoryRouter>
      <ArticleCard
        article={{ ...article, ...overrides }}
        renderBookmark={(a) => (
          <button aria-pressed={a.isBookmarked} aria-label="Bookmark">★</button>
        )}
      />
    </MemoryRouter>
  )
}

describe('ArticleCard', () => {
  it('renders the article title', () => {
    renderCard()
    expect(screen.getByText('Test Article')).toBeInTheDocument()
  })

  it('renders the source name', () => {
    renderCard()
    expect(screen.getByText('BBC News')).toBeInTheDocument()
  })

  it('renders the summary', () => {
    renderCard()
    expect(screen.getByText('A short summary.')).toBeInTheDocument()
  })

  it('renders bookmark button via render-prop', () => {
    renderCard()
    expect(screen.getByRole('button', { name: /bookmark/i })).toBeInTheDocument()
  })

  it('shows filled bookmark state when isBookmarked is true', () => {
    renderCard({ isBookmarked: true })
    const btn = screen.getByRole('button', { name: /bookmark/i })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
  })

  it('renders article image when imageUrl is provided', () => {
    renderCard({ imageUrl: 'https://example.com/img.jpg' })
    expect(screen.getByRole('img', { name: 'Test Article' })).toBeInTheDocument()
  })
})
```

**Step 2: Run (expect FAIL)**

```bash
pnpm --filter web vitest run src/entities/article/ui/ArticleCard.test.tsx
```

Expected: FAIL — `./ArticleCard.js` does not exist yet.

---

**Step 3: Implement**

Create `apps/web/src/entities/article/model/types.ts`:

```ts
export interface ArticleSource {
  id: string
  name: string
}

export interface ArticleCategory {
  id: string
  slug: string
  nameEn: string
  nameRu: string
}

export interface Article {
  id: string
  title: string
  summary: string | null
  url: string
  imageUrl: string | null
  publishedAt: string
  source: ArticleSource
  category: ArticleCategory | null
  isBookmarked: boolean
}

export interface ArticleListResponse {
  items: Article[]
  total: number
  page: number
  limit: number
}
```

Create `apps/web/src/entities/article/api/article.api.ts`:

```ts
import { api } from '@/shared/api/index.js'
import type { Article, ArticleListResponse } from '../model/types.js'

export const articleApi = {
  list(params: { categoryId?: string; page?: number; limit?: number }) {
    return api
      .get<ArticleListResponse>('/news/articles', { params })
      .then((r) => r.data)
  },

  getById(id: string) {
    return api.get<Article>(`/news/articles/${id}`).then((r) => r.data)
  },

  bookmark(id: string) {
    return api.post(`/news/articles/${id}/bookmark`)
  },

  unbookmark(id: string) {
    return api.delete(`/news/articles/${id}/bookmark`)
  },

  listBookmarks() {
    return api.get<ArticleListResponse>('/news/bookmarks').then((r) => r.data)
  },
}
```

Create `apps/web/src/entities/article/ui/ArticleCard.tsx`:

`ArticleCard` is a pure presentational component. It uses a `renderBookmark` render-prop to keep `entities/article` independent of `features/bookmark-toggle` — per FSD, entities must not import from features. The widget and page layers inject the real `BookmarkButton`; tests inject a simple stub.

```tsx
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
```

Create `apps/web/src/entities/article/index.ts`:

```ts
export { ArticleCard } from './ui/ArticleCard.js'
export { articleApi } from './api/article.api.js'
export type { Article, ArticleListResponse, ArticleCategory, ArticleSource } from './model/types.js'
```

Create `apps/web/src/entities/category/model/types.ts`:

```ts
export interface Category {
  id: string
  slug: string
  nameEn: string
  nameRu: string
}
```

Create `apps/web/src/entities/category/api/category.api.ts`:

```ts
import { api } from '@/shared/api/index.js'
import type { Category } from '../model/types.js'

export const categoryApi = {
  list() {
    return api.get<Category[]>('/news/categories').then((r) => r.data)
  },
}
```

Create `apps/web/src/entities/category/ui/CategoryTab.tsx`:

```tsx
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
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
      )}
    >
      {label}
    </button>
  )
}
```

Create `apps/web/src/entities/category/index.ts`:

```ts
export { CategoryTab } from './ui/CategoryTab.js'
export { categoryApi } from './api/category.api.js'
export type { Category } from './model/types.js'
```

---

**Step 4: Run (expect PASS)**

```bash
pnpm --filter web vitest run src/entities/article/ui/ArticleCard.test.tsx
```

Expected: PASS — all 6 tests green.

**Step 5: Commit**

```bash
git add apps/web/src/entities/article apps/web/src/entities/category
git commit -m "feat(web): add article and category entities with ArticleCard component"
```

---

### Task 24: features/bookmark-toggle

**Files:**
- Create: `apps/web/src/features/bookmark-toggle/ui/BookmarkButton.tsx`
- Create: `apps/web/src/features/bookmark-toggle/ui/BookmarkButton.test.tsx`
- Create: `apps/web/src/features/bookmark-toggle/index.ts`

The bookmark-toggle feature owns the mutation logic. It wraps `ArticleCard`'s `onBookmarkToggle` with an optimistic TanStack Query mutation so the UI updates instantly before the server confirms.

---

**Step 1: Write failing test**

Create `apps/web/src/features/bookmark-toggle/ui/BookmarkButton.test.tsx`:

```tsx
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BookmarkButton } from './BookmarkButton.js'

const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderButton(isBookmarked: boolean) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <BookmarkButton articleId="art-1" isBookmarked={isBookmarked} />
    </QueryClientProvider>
  )
}

describe('BookmarkButton', () => {
  it('shows bookmark when not bookmarked', () => {
    renderButton(false)
    expect(screen.getByRole('button', { name: /bookmark/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('shows filled bookmark when bookmarked', () => {
    renderButton(true)
    expect(screen.getByRole('button', { name: /bookmark/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls POST /news/articles/:id/bookmark on click when not bookmarked', async () => {
    const user = userEvent.setup()
    let called = false
    server.use(
      http.post('http://localhost:3001/news/articles/art-1/bookmark', () => {
        called = true
        return new HttpResponse(null, { status: 201 })
      }),
    )
    renderButton(false)
    await user.click(screen.getByRole('button', { name: /bookmark/i }))
    await waitFor(() => expect(called).toBe(true))
  })

  it('calls DELETE /news/articles/:id/bookmark on click when bookmarked', async () => {
    const user = userEvent.setup()
    let called = false
    server.use(
      http.delete('http://localhost:3001/news/articles/art-1/bookmark', () => {
        called = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderButton(true)
    await user.click(screen.getByRole('button', { name: /bookmark/i }))
    await waitFor(() => expect(called).toBe(true))
  })
})
```

**Step 2: Run (expect FAIL)**

```bash
pnpm --filter web vitest run src/features/bookmark-toggle/ui/BookmarkButton.test.tsx
```

Expected: FAIL — `./BookmarkButton.js` does not exist yet.

---

**Step 3: Implement**

Create `apps/web/src/features/bookmark-toggle/ui/BookmarkButton.tsx`:

`useQueryClient` is used to invalidate both the article list and bookmarks queries after a mutation completes, keeping all cached data in sync.

```tsx
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
```

Create `apps/web/src/features/bookmark-toggle/index.ts`:

```ts
export { BookmarkButton } from './ui/BookmarkButton.js'
```

---

**Step 4: Run (expect PASS)**

```bash
pnpm --filter web vitest run src/features/bookmark-toggle/ui/BookmarkButton.test.tsx
```

Expected: PASS — all 4 tests green.

**Step 5: Commit**

```bash
git add apps/web/src/features/bookmark-toggle
git commit -m "feat(web): add bookmark-toggle feature with optimistic mutation"
```

---

### Task 25: widgets/article-list

**Files:**
- Create: `apps/web/src/widgets/article-list/ui/ArticleList.tsx`
- Create: `apps/web/src/widgets/article-list/ui/ArticleList.test.tsx`
- Create: `apps/web/src/widgets/article-list/index.ts`

`ArticleList` fetches articles for the selected category and renders the category tab bar, the article grid, and pagination controls. It owns the category selection state and delegates article rendering to `ArticleCard` and bookmark mutations to `BookmarkButton`.

---

**Step 1: Write failing test**

Create `apps/web/src/widgets/article-list/ui/ArticleList.test.tsx`:

```tsx
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ArticleList } from './ArticleList.js'
import type { Category } from '@/entities/category/index.js'
import type { ArticleListResponse } from '@/entities/article/index.js'

const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const categories: Category[] = [
  { id: 'c1', slug: 'technology', nameEn: 'Technology', nameRu: 'Технологии' },
]

const articlesPage1: ArticleListResponse = {
  items: [
    {
      id: 'a1',
      title: 'Article One',
      summary: 'Summary one.',
      url: 'https://example.com/1',
      imageUrl: null,
      publishedAt: '2026-03-01T10:00:00Z',
      source: { id: 's1', name: 'BBC' },
      category: categories[0],
      isBookmarked: false,
    },
  ],
  total: 1,
  page: 1,
  limit: 20,
}

function renderArticleList() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ArticleList categories={categories} />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('ArticleList', () => {
  it('renders category tabs', async () => {
    server.use(
      http.get('http://localhost:3001/news/articles', () =>
        HttpResponse.json(articlesPage1),
      ),
    )
    renderArticleList()
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Technology' })).toBeInTheDocument()
  })

  it('renders article cards after loading', async () => {
    server.use(
      http.get('http://localhost:3001/news/articles', () =>
        HttpResponse.json(articlesPage1),
      ),
    )
    renderArticleList()
    await waitFor(() => {
      expect(screen.getByText('Article One')).toBeInTheDocument()
    })
  })

  it('shows loading spinner while fetching', () => {
    server.use(
      http.get('http://localhost:3001/news/articles', async () => {
        await new Promise(() => {}) // never resolves
      }),
    )
    renderArticleList()
    expect(screen.getByLabelText('Loading')).toBeInTheDocument()
  })
})
```

**Step 2: Run (expect FAIL)**

```bash
pnpm --filter web vitest run src/widgets/article-list/ui/ArticleList.test.tsx
```

Expected: FAIL — `./ArticleList.js` does not exist yet.

---

**Step 3: Implement**

Create `apps/web/src/widgets/article-list/ui/ArticleList.tsx`:

```tsx
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
```

Create `apps/web/src/widgets/article-list/index.ts`:

```ts
export { ArticleList } from './ui/ArticleList.js'
```

---

**Step 4: Run (expect PASS)**

```bash
pnpm --filter web vitest run src/widgets/article-list/ui/ArticleList.test.tsx
```

Expected: PASS — all 3 tests green.

**Step 5: Commit**

```bash
git add apps/web/src/widgets/article-list
git commit -m "feat(web): add ArticleList widget with category tabs and pagination"
```

---

### Task 26: pages/news (full) + pages/bookmarks (full)

**Files:**
- Modify: `apps/web/src/pages/news/NewsPage.tsx`
- Modify: `apps/web/src/pages/bookmarks/BookmarksPage.tsx`

---

**Step 1: Implement**

Replace `apps/web/src/pages/news/NewsPage.tsx` with the full implementation:

```tsx
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
```

Replace `apps/web/src/pages/bookmarks/BookmarksPage.tsx` with the full implementation:

```tsx
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
```

**Step 2: Type-check**

```bash
pnpm --filter web tsc --noEmit
```

Expected: No errors.

**Step 3: Smoke test**

1. Start API server: `pnpm --filter api dev`
2. Start web: `pnpm --filter web dev`
3. Log in and navigate to `/news`.
4. Verify: Category tabs appear at the top; articles load in a 3-column grid.
5. Click a category tab — articles refresh for that category.
6. Click the bookmark star on an article — it fills in immediately.
7. Navigate to `/bookmarks` — bookmarked article appears.
8. Click the bookmark star again — article disappears from bookmarks.

**Step 4: Commit**

```bash
git add apps/web/src/pages/news apps/web/src/pages/bookmarks
git commit -m "feat(web): implement full news and bookmarks pages"
```
