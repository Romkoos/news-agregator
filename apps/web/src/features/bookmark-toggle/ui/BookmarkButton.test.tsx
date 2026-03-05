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
