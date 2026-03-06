import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
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

  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<AuthGuard />}>
          <Route path="/" element={<div>Protected Content</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  useAuthStore.setState({ accessToken: null, user: null, isHydrated: false })
})

describe('AuthGuard', () => {
  it('shows loading spinner when not hydrated', () => {
    useAuthStore.setState({ isHydrated: false, accessToken: null, user: null })
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AuthGuard />}>
            <Route path="/" element={<div>Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByLabelText('Loading')).toBeInTheDocument()
  })

  it('renders outlet when authenticated', () => {
    renderWithRouter(true)
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('redirects to /login when not authenticated', () => {
    renderWithRouter(false)
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })
})
