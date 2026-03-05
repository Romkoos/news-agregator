## Phase 5: Frontend — Auth, Layout & Shell (Tasks 19–22)

---

### Task 19: features/auth + pages/auth — Login and Register

**Files:**
- Create: `apps/web/src/features/auth/login-form/LoginForm.tsx`
- Create: `apps/web/src/features/auth/login-form/LoginForm.test.tsx`
- Create: `apps/web/src/features/auth/register-form/RegisterForm.tsx`
- Create: `apps/web/src/features/auth/logout-button/LogoutButton.tsx`
- Create: `apps/web/src/features/auth/index.ts`
- Create: `apps/web/src/pages/auth/LoginPage.tsx`
- Create: `apps/web/src/pages/auth/RegisterPage.tsx`
- Create: `apps/web/src/pages/auth/index.ts`

---

**Step 1: Write failing test**

Create `apps/web/src/features/auth/login-form/LoginForm.test.tsx`:

```tsx
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
```

**Step 2: Run:** `pnpm --filter web vitest run src/features/auth/login-form/LoginForm.test.tsx` → Expected: **FAIL** (LoginForm.tsx does not exist yet)

---

**Step 3: Implement**

Create `apps/web/src/features/auth/login-form/LoginForm.tsx`:

```tsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/index.js'
import { Input } from '@/shared/ui/index.js'
import { api } from '@/shared/api/index.js'
import { useAuthStore } from '@/entities/user/index.js'
import type { AuthResponse } from '@repo/contracts'

export function LoginForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setAuth = useAuthStore(s => s.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) =>
      api.post<AuthResponse>('/auth/login', data).then(r => r.data),
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user)
      navigate('/')
    },
    onError: () => setError(t('auth.invalidCredentials')),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    mutation.mutate({ email, password })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {t('auth.loginTitle')}
      </h1>
      <Input
        label={t('auth.email')}
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        autoComplete="email"
      />
      <Input
        label={t('auth.password')}
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        autoComplete="current-password"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" isLoading={mutation.isPending} size="lg">
        {t('auth.login')}
      </Button>
      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        {t('auth.noAccount')}{' '}
        <Link
          to="/register"
          className="font-medium text-primary-600 hover:underline"
        >
          {t('auth.register')}
        </Link>
      </p>
    </form>
  )
}
```

Create `apps/web/src/features/auth/register-form/RegisterForm.tsx`:

```tsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/index.js'
import { Input } from '@/shared/ui/index.js'
import { api } from '@/shared/api/index.js'
import { useAuthStore } from '@/entities/user/index.js'
import type { AuthResponse } from '@repo/contracts'

export function RegisterForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setAuth = useAuthStore(s => s.setAuth)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async (data: { name: string; email: string; password: string }) =>
      api.post<AuthResponse>('/auth/register', data).then(r => r.data),
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user)
      navigate('/')
    },
    onError: () => setError(t('auth.registrationFailed')),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    mutation.mutate({ name, email, password })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {t('auth.registerTitle')}
      </h1>
      <Input
        label={t('auth.name')}
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        required
        autoComplete="name"
      />
      <Input
        label={t('auth.email')}
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        autoComplete="email"
      />
      <Input
        label={t('auth.password')}
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        autoComplete="new-password"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" isLoading={mutation.isPending} size="lg">
        {t('auth.register')}
      </Button>
      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        {t('auth.hasAccount')}{' '}
        <Link
          to="/login"
          className="font-medium text-primary-600 hover:underline"
        >
          {t('auth.login')}
        </Link>
      </p>
    </form>
  )
}
```

Create `apps/web/src/features/auth/logout-button/LogoutButton.tsx`:

```tsx
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/index.js'
import { api } from '@/shared/api/index.js'
import { useAuthStore } from '@/entities/user/index.js'

export function LogoutButton() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const clearAuth = useAuthStore(s => s.clearAuth)

  const mutation = useMutation({
    mutationFn: async () => api.delete('/auth/logout'),
    onSettled: () => {
      clearAuth()
      navigate('/login')
    },
  })

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => mutation.mutate()}
      isLoading={mutation.isPending}
    >
      {t('auth.logout')}
    </Button>
  )
}
```

Create `apps/web/src/features/auth/index.ts`:

```ts
export { LoginForm } from './login-form/LoginForm.js'
export { RegisterForm } from './register-form/RegisterForm.js'
export { LogoutButton } from './logout-button/LogoutButton.js'
```

Create `apps/web/src/pages/auth/LoginPage.tsx`:

```tsx
import { LoginForm } from '@/features/auth/index.js'

export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}
```

Create `apps/web/src/pages/auth/RegisterPage.tsx`:

```tsx
import { RegisterForm } from '@/features/auth/index.js'

export function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-sm">
        <RegisterForm />
      </div>
    </div>
  )
}
```

Create `apps/web/src/pages/auth/index.ts`:

```ts
export { LoginPage } from './LoginPage.js'
export { RegisterPage } from './RegisterPage.js'
```

**Step 4: Run:** `pnpm --filter web vitest run src/features/auth/login-form/LoginForm.test.tsx` → Expected: **PASS**

**Step 5: Commit:** `git commit -m "feat(web): add auth forms and pages (login, register, logout)"`

---

### Task 20: App providers + QueryClient + i18n init

**Files:**
- Create: `apps/web/src/app/providers/QueryProvider.tsx`
- Create: `apps/web/src/app/providers/I18nProvider.tsx`
- Update: `apps/web/src/app/App.tsx`

---

No unit test for provider wiring — this is covered by integration tests in later tasks. All steps below are implementation-only.

**Step 1: Implement**

Create `apps/web/src/app/providers/QueryProvider.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 60_000 },
  },
})

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
```

Create `apps/web/src/app/providers/I18nProvider.tsx`:

```tsx
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n/index.js'
import type { ReactNode } from 'react'

export function I18nProvider({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
```

Create `apps/web/src/app/providers/ApiProvider.tsx`:

`ApiProvider` has two responsibilities:
1. **Axios interceptors** (from Task 18) — attaches Bearer token to every request and handles 401 → refresh → retry. This must remain; do not remove the `setupInterceptors` call added in Task 18.
2. **User rehydration** — on mount, fetches `/users/me` with the persisted access token to re-validate the session and restore the user object.

```tsx
import { useEffect } from 'react'
import { useAuthStore } from '@/entities/user/index.js'
import { api } from '@/shared/api/index.js'
import { setupInterceptors } from '@/shared/api/interceptors.js'
import type { ReactNode } from 'react'

/**
 * Wires Axios interceptors once, then rehydrates the authenticated user from
 * /users/me when a persisted access token is present in the store.
 * Sets isHydrated=true once both steps complete so AuthGuard can decide.
 */
export function ApiProvider({ children }: { children: ReactNode }) {
  const { accessToken, setAuth, clearAuth } = useAuthStore()

  useEffect(() => {
    // ── 1. Wire Axios interceptors (token attach + 401 refresh + logout) ──
    setupInterceptors(
      api,
      () => useAuthStore.getState().accessToken,
      (newToken) => {
        const user = useAuthStore.getState().user
        if (user) useAuthStore.getState().setAuth(newToken, user)
      },
      clearAuth,
    )

    // ── 2. Rehydrate user on boot (handles page refresh with stored token) ──
    if (!accessToken) {
      useAuthStore.setState({ isHydrated: true })
      return
    }

    api
      .get('/users/me')
      .then((r) => {
        const { id, email, name, avatarUrl } = r.data
        setAuth(accessToken, { id, email, name, avatarUrl })
      })
      .catch(() => {
        clearAuth()
      })
      .finally(() => {
        useAuthStore.setState({ isHydrated: true })
      })
    // Run once on mount only — accessToken comes from persisted store
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}
```

Update `apps/web/src/app/App.tsx`:

```tsx
import { RouterProvider } from 'react-router-dom'
import { QueryProvider } from './providers/QueryProvider.js'
import { I18nProvider } from './providers/I18nProvider.js'
import { ApiProvider } from './providers/ApiProvider.js'
import { router } from './router.js'
import '@/shared/i18n/i18n.js'

export function App() {
  return (
    <I18nProvider>
      <QueryProvider>
        <ApiProvider>
          <RouterProvider router={router} />
        </ApiProvider>
      </QueryProvider>
    </I18nProvider>
  )
}
```

**Step 2: Verify:** `pnpm --filter web dev` → dev server starts without TypeScript errors or console errors in the browser.

**Step 3: Commit:** `git commit -m "feat(web): wire app providers (QueryClient, i18n, API)"`

---

### Task 21: widgets/sidebar + AuthGuard + Layout route

**Files:**
- Create: `apps/web/src/app/guards/AuthGuard.tsx`
- Create: `apps/web/src/app/guards/AuthGuard.test.tsx`
- Create: `apps/web/src/widgets/sidebar/ui/Sidebar.tsx`
- Create: `apps/web/src/widgets/sidebar/index.ts`
- Create: `apps/web/src/app/layouts/AppLayout.tsx`
- Update: `apps/web/src/app/router.tsx`

---

**Step 1: Write failing test**

Create `apps/web/src/app/guards/AuthGuard.test.tsx`:

```tsx
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

  it('redirects to /login when not authenticated', () => {
    renderWithRouter(false)
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })
})
```

**Step 2: Run:** `pnpm --filter web vitest run src/app/guards/AuthGuard.test.tsx` → Expected: **FAIL** (AuthGuard.tsx does not exist yet)

---

**Step 3: Implement**

Create `apps/web/src/app/guards/AuthGuard.tsx`:

```tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/entities/user/index.js'
import { Spinner } from '@/shared/ui/index.js'

export function AuthGuard() {
  const { accessToken, isHydrated } = useAuthStore()

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner aria-label="Loading" />
      </div>
    )
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
```

> Note: `Spinner` must accept and forward an `aria-label` prop so the test can locate it via `screen.getByLabelText('Loading')`. If `@/shared/ui` `Spinner` does not yet forward arbitrary props, update it to spread `...props` onto the root element (e.g., `<svg aria-label={props['aria-label']} ...>`).

Create `apps/web/src/widgets/sidebar/ui/Sidebar.tsx`:

```tsx
import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/entities/user/index.js'
import { UserAvatar } from '@/entities/user/index.js'
import { LogoutButton } from '@/features/auth/index.js'
import { cn } from '@/shared/lib/index.js'

interface NavItem {
  labelKey: string
  to: string
  icon: string
}

const navItems: NavItem[] = [
  { labelKey: 'nav.dashboard', to: '/', icon: '📰' },
  { labelKey: 'nav.news', to: '/news', icon: '🗂️' },
  { labelKey: 'nav.bookmarks', to: '/bookmarks', icon: '🔖' },
  { labelKey: 'nav.settings', to: '/settings', icon: '⚙️' },
]

export function Sidebar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-200 px-6 dark:border-gray-700">
        <span className="text-lg font-bold text-gray-900 dark:text-white">
          News Digest
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map(item => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  )
                }
              >
                <span aria-hidden="true">{item.icon}</span>
                {t(item.labelKey)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User section */}
      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
        <button
          onClick={() => navigate('/profile')}
          className="flex w-full items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label={`${user?.name ?? ''} — go to profile`}
        >
          <UserAvatar
            name={user?.name ?? ''}
            avatarUrl={user?.avatarUrl ?? null}
            size="sm"
          />
          <span className="flex-1 truncate text-left text-sm font-medium text-gray-700 dark:text-gray-300">
            {user?.name}
          </span>
        </button>
        <div className="mt-2">
          <LogoutButton />
        </div>
      </div>
    </aside>
  )
}
```

Create `apps/web/src/widgets/sidebar/index.ts`:

```ts
export { Sidebar } from './ui/Sidebar.js'
```

Create `apps/web/src/app/layouts/AppLayout.tsx`:

```tsx
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/widgets/sidebar/index.js'

export function AppLayout() {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
```

Update `apps/web/src/app/router.tsx` with the full routing structure. All page imports reference modules that will be created in Task 22:

```tsx
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthGuard } from './guards/AuthGuard.js'
import { AppLayout } from './layouts/AppLayout.js'
import { LoginPage } from '@/pages/auth/index.js'
import { RegisterPage } from '@/pages/auth/index.js'
import { DashboardPage } from '@/pages/dashboard/index.js'
import { NewsPage } from '@/pages/news/index.js'
import { BookmarksPage } from '@/pages/bookmarks/index.js'
import { SettingsPage } from '@/pages/settings/index.js'
import { ProfilePage } from '@/pages/profile/index.js'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/news', element: <NewsPage /> },
          { path: '/bookmarks', element: <BookmarksPage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '/profile', element: <ProfilePage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
```

**Step 4: Run:** `pnpm --filter web vitest run src/app/guards/AuthGuard.test.tsx` → Expected: **PASS**

**Step 5: Commit:** `git commit -m "feat(web): add Sidebar widget, AuthGuard, and AppLayout"`

---

### Task 22: pages/dashboard + all placeholder pages

**Files:**
- Create: `apps/web/src/pages/dashboard/DashboardPage.tsx`
- Create: `apps/web/src/pages/dashboard/index.ts`
- Create: `apps/web/src/pages/news/NewsPage.tsx`
- Create: `apps/web/src/pages/news/index.ts`
- Create: `apps/web/src/pages/bookmarks/BookmarksPage.tsx`
- Create: `apps/web/src/pages/bookmarks/index.ts`
- Create: `apps/web/src/pages/settings/SettingsPage.tsx`
- Create: `apps/web/src/pages/settings/index.ts`
- Create: `apps/web/src/pages/profile/ProfilePage.tsx`
- Create: `apps/web/src/pages/profile/index.ts`

---

No dedicated unit tests for placeholder pages — their content is minimal and will be replaced in later tasks. The smoke test below covers correctness end-to-end.

**Step 1: Implement**

Create `apps/web/src/pages/dashboard/DashboardPage.tsx`:

```tsx
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/entities/user/index.js'

export function DashboardPage() {
  const { t } = useTranslation()
  const user = useAuthStore(s => s.user)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {t('dashboard.welcome', { name: user?.name ?? '' })}
      </h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Navigate to News to browse articles by category.
      </p>
    </div>
  )
}
```

Create `apps/web/src/pages/dashboard/index.ts`:

```ts
export { DashboardPage } from './DashboardPage.js'
```

Create `apps/web/src/pages/news/NewsPage.tsx`:

```tsx
export function NewsPage() {
  return <div>News (coming soon)</div>
}
```

Create `apps/web/src/pages/news/index.ts`:

```ts
export { NewsPage } from './NewsPage.js'
```

Create `apps/web/src/pages/bookmarks/BookmarksPage.tsx`:

```tsx
export function BookmarksPage() {
  return <div>Bookmarks (coming soon)</div>
}
```

Create `apps/web/src/pages/bookmarks/index.ts`:

```ts
export { BookmarksPage } from './BookmarksPage.js'
```

Create `apps/web/src/pages/settings/SettingsPage.tsx`:

```tsx
export function SettingsPage() {
  return <div>Settings (coming soon)</div>
}
```

Create `apps/web/src/pages/settings/index.ts`:

```ts
export { SettingsPage } from './SettingsPage.js'
```

Create `apps/web/src/pages/profile/ProfilePage.tsx`:

```tsx
export function ProfilePage() {
  return <div>Profile (coming soon)</div>
}
```

Create `apps/web/src/pages/profile/index.ts`:

```ts
export { ProfilePage } from './ProfilePage.js'
```

**Step 2: Type-check:** `pnpm --filter web tsc --noEmit` → Expected: no errors. All router imports now resolve.

**Step 3: Smoke test:**

1. Run `pnpm --filter web dev`
2. Open `http://localhost:5173/login` → the login form renders with Email and Password fields and a "Sign In" button.
3. Open `http://localhost:5173/register` → the register form renders with Name, Email, Password fields and a "Sign Up" button.
4. Navigate to `http://localhost:5173/` while unauthenticated → redirected to `/login`.
5. Log in with valid credentials → redirected to `/` → the dashboard renders with the sidebar visible.
6. In the sidebar, click "News" → URL becomes `/news`, "News (coming soon)" appears in main content.
7. Click "Bookmarks" → URL becomes `/bookmarks`.
8. Click the user avatar / name at the bottom of the sidebar → URL becomes `/profile`.
9. Click the "Logout" button → redirected to `/login`, auth store is cleared.

**Step 4: Commit:** `git commit -m "feat(web): add dashboard and placeholder pages, complete routing"`
