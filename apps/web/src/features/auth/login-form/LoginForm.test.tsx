import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LoginForm } from './LoginForm.js'
import { useAuthStore } from '@/entities/user/index.js'

const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  useAuthStore.setState({ accessToken: null, user: null, isHydrated: false })
})
afterAll(() => server.close())

function renderLoginForm() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('LoginForm', () => {
  it('renders email and password fields', () => {
    renderLoginForm()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('submits and sets auth on success', async () => {
    const user = userEvent.setup()
    server.use(
      http.post('http://localhost:3001/auth/login', () =>
        HttpResponse.json({
          accessToken: 'token-abc',
          user: { id: '1', email: 'a@b.com', name: 'Alice', avatarUrl: null },
        })
      )
    )
    renderLoginForm()
    await user.type(screen.getByLabelText(/email/i), 'a@b.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(useAuthStore.getState().accessToken).toBe('token-abc')
    })
  })

  it('shows error on 401', async () => {
    const user = userEvent.setup()
    server.use(
      http.post('http://localhost:3001/auth/login', () =>
        new HttpResponse(null, { status: 401 })
      )
    )
    renderLoginForm()
    await user.type(screen.getByLabelText(/email/i), 'a@b.com')
    await user.type(screen.getByLabelText(/password/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
    })
  })
})
