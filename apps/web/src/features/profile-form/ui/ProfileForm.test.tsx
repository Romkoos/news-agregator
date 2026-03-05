import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ProfileForm } from './ProfileForm.js'
import { useAuthStore } from '@/entities/user/index.js'

const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  useAuthStore.setState({ accessToken: null, user: null, isHydrated: false })
})
afterAll(() => server.close())

function renderProfileForm() {
  useAuthStore.setState({
    accessToken: 'token',
    user: { id: '1', email: 'alice@example.com', name: 'Alice', avatarUrl: null },
    isHydrated: true,
  })
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ProfileForm />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('ProfileForm', () => {
  it('pre-fills name from auth store', () => {
    renderProfileForm()
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
  })

  it('submits PATCH /users/me with updated name', async () => {
    const user = userEvent.setup()
    let body: unknown
    server.use(
      http.patch('http://localhost:3001/users/me', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ id: '1', email: 'alice@example.com', name: 'Alicia', avatarUrl: null, preferences: null })
      }),
    )
    renderProfileForm()
    const nameInput = screen.getByDisplayValue('Alice')
    await user.clear(nameInput)
    await user.type(nameInput, 'Alicia')
    await user.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => {
      expect(body).toEqual({ name: 'Alicia', avatarUrl: null })
    })
  })

  it('shows success message after update', async () => {
    const user = userEvent.setup()
    server.use(
      http.patch('http://localhost:3001/users/me', () =>
        HttpResponse.json({ id: '1', email: 'alice@example.com', name: 'Alice', avatarUrl: null, preferences: null }),
      ),
    )
    renderProfileForm()
    await user.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => {
      expect(screen.getByText(/profile updated/i)).toBeInTheDocument()
    })
  })
})
