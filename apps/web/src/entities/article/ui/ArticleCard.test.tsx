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
