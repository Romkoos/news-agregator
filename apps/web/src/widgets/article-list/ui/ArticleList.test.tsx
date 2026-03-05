import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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
