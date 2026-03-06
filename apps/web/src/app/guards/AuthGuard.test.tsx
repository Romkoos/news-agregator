import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { AuthGuard } from './AuthGuard.js'
import { useAuthStore } from '@/entities/user/index.js'

function renderWithRouter(authenticated: boolean) {
  useAuthStore.setState({
    accessToken: authenticated ? 'token-123' : null,
    user: authenticated
      ? { id: '1', email: 'a@b.com', name: 'Alice', avatarUrl: null }
      : null,
    isHydrated: true,
  })

  const router = createMemoryRouter(
    [
      {
        element: <AuthGuard />,
        children: [{ path: '/', element: <div>Protected Content</div> }],
      },
      { path: '/login', element: <div>Login Page</div> },
    ],
    { initialEntries: ['/'] }
  )

  return render(<RouterProvider router={router} />)
}

beforeEach(() => {
  useAuthStore.setState({ accessToken: null, user: null, isHydrated: false })
})

describe('AuthGuard', () => {
  it('shows loading spinner when not hydrated', () => {
    useAuthStore.setState({ isHydrated: false, accessToken: null, user: null })
    const router = createMemoryRouter(
      [
        {
          element: <AuthGuard />,
          children: [{ path: '/', element: <div>Content</div> }],
        },
        { path: '/login', element: <div>Login</div> },
      ],
      { initialEntries: ['/'] }
    )
    render(<RouterProvider router={router} />)
    expect(screen.getByLabelText('Loading')).toBeInTheDocument()
  })

  it('renders outlet when authenticated', () => {
    renderWithRouter(true)
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('redirects to /login when not authenticated', async () => {
    renderWithRouter(false)
    expect(await screen.findByText('Login Page')).toBeInTheDocument()
  })
})
