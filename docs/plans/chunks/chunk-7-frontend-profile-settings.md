## Phase 7: Frontend — Profile & Settings (Tasks 27–28)

---

### Task 27: features/profile-form + pages/profile (full)

**Files:**
- Create: `apps/web/src/features/profile-form/ui/ProfileForm.tsx`
- Create: `apps/web/src/features/profile-form/ui/ProfileForm.test.tsx`
- Create: `apps/web/src/features/profile-form/ui/ChangePasswordForm.tsx`
- Create: `apps/web/src/features/profile-form/index.ts`
- Modify: `apps/web/src/pages/profile/ProfilePage.tsx`

---

**Step 1: Write failing test**

Create `apps/web/src/features/profile-form/ui/ProfileForm.test.tsx`:

```tsx
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
```

**Step 2: Run (expect FAIL)**

```bash
pnpm --filter web vitest run src/features/profile-form/ui/ProfileForm.test.tsx
```

Expected: FAIL — `./ProfileForm.js` does not exist yet.

---

**Step 3: Implement**

Create `apps/web/src/features/profile-form/ui/ProfileForm.tsx`:

```tsx
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '@/shared/api/index.js'
import { Button, Input } from '@/shared/ui/index.js'
import { useAuthStore } from '@/entities/user/index.js'
import type { UserProfile } from '@repo/contracts'

export function ProfileForm() {
  const { t } = useTranslation()
  const { user, setAuth } = useAuthStore()
  const accessToken = useAuthStore((s) => s.accessToken)
  const [name, setName] = useState(user?.name ?? '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '')
  const [success, setSuccess] = useState(false)

  const mutation = useMutation({
    mutationFn: () =>
      api
        .patch<UserProfile>('/users/me', {
          name,
          avatarUrl: avatarUrl.trim() || null,
        })
        .then((r) => r.data),
    onSuccess: (data) => {
      if (accessToken) {
        setAuth(accessToken, {
          id: data.id,
          email: data.email,
          name: data.name,
          avatarUrl: data.avatarUrl,
        })
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label={t('auth.name')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Input
        label={t('profile.avatarUrl')}
        type="url"
        value={avatarUrl}
        onChange={(e) => setAvatarUrl(e.target.value)}
        placeholder="https://example.com/avatar.jpg"
      />
      {success && (
        <p className="text-sm text-green-600 dark:text-green-400">
          {t('profile.updateSuccess')}
        </p>
      )}
      {mutation.isError && (
        <p className="text-sm text-red-500">{t('common.error')}</p>
      )}
      <Button type="submit" isLoading={mutation.isPending}>
        {t('common.save')}
      </Button>
    </form>
  )
}
```

Create `apps/web/src/features/profile-form/ui/ChangePasswordForm.tsx`:

```tsx
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '@/shared/api/index.js'
import { Button, Input } from '@/shared/ui/index.js'

export function ChangePasswordForm() {
  const { t } = useTranslation()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [success, setSuccess] = useState(false)

  const mutation = useMutation({
    mutationFn: () =>
      api.patch('/users/me/password', { currentPassword, newPassword }),
    onSuccess: () => {
      setCurrentPassword('')
      setNewPassword('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label={t('auth.currentPassword')}
        type="password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        required
        autoComplete="current-password"
      />
      <Input
        label={t('auth.newPassword')}
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
        minLength={8}
        autoComplete="new-password"
      />
      {success && (
        <p className="text-sm text-green-600 dark:text-green-400">
          {t('profile.passwordChanged')}
        </p>
      )}
      {mutation.isError && (
        <p className="text-sm text-red-500">{t('common.error')}</p>
      )}
      <Button type="submit" isLoading={mutation.isPending}>
        {t('common.save')}
      </Button>
    </form>
  )
}
```

Create `apps/web/src/features/profile-form/index.ts`:

```ts
export { ProfileForm } from './ui/ProfileForm.js'
export { ChangePasswordForm } from './ui/ChangePasswordForm.js'
```

Replace `apps/web/src/pages/profile/ProfilePage.tsx` with the full implementation:

```tsx
import { useTranslation } from 'react-i18next'
import { useAuthStore, UserAvatar } from '@/entities/user/index.js'
import { ProfileForm, ChangePasswordForm } from '@/features/profile-form/index.js'
import { Card } from '@/shared/ui/index.js'

export function ProfilePage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)

  return (
    <div className="flex flex-col gap-8 max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {t('profile.title')}
      </h1>

      {/* Avatar preview */}
      <div className="flex items-center gap-4">
        <UserAvatar name={user?.name ?? ''} avatarUrl={user?.avatarUrl ?? null} size="lg" />
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{user?.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
        </div>
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          {t('profile.title')}
        </h2>
        <ProfileForm />
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          {t('auth.currentPassword')}
        </h2>
        <ChangePasswordForm />
      </Card>
    </div>
  )
}
```

---

**Step 4: Run (expect PASS)**

```bash
pnpm --filter web vitest run src/features/profile-form/ui/ProfileForm.test.tsx
```

Expected: PASS — all 3 tests green.

**Step 5: Commit**

```bash
git add apps/web/src/features/profile-form apps/web/src/pages/profile
git commit -m "feat(web): add profile form, change password form, and profile page"
```

---

### Task 28: features/theme-switcher + features/language-switcher + pages/settings (full)

**Files:**
- Create: `apps/web/src/features/theme-switcher/ui/ThemeSwitcher.tsx`
- Create: `apps/web/src/features/theme-switcher/ui/ThemeSwitcher.test.tsx`
- Create: `apps/web/src/features/theme-switcher/index.ts`
- Create: `apps/web/src/features/language-switcher/ui/LanguageSwitcher.tsx`
- Create: `apps/web/src/features/language-switcher/index.ts`
- Create: `apps/web/src/app/providers/ThemeProvider.tsx`
- Modify: `apps/web/src/app/App.tsx`
- Modify: `apps/web/src/pages/settings/SettingsPage.tsx`

---

**Step 1: Write failing test**

Create `apps/web/src/features/theme-switcher/ui/ThemeSwitcher.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeSwitcher } from './ThemeSwitcher.js'

function getHtmlClass() {
  return document.documentElement.classList
}

beforeEach(() => {
  document.documentElement.classList.remove('dark')
})

describe('ThemeSwitcher', () => {
  it('renders light and dark options', () => {
    render(<ThemeSwitcher />)
    expect(screen.getByRole('button', { name: /light/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /dark/i })).toBeInTheDocument()
  })

  it('adds dark class to html element when dark is selected', async () => {
    const user = userEvent.setup()
    render(<ThemeSwitcher />)
    await user.click(screen.getByRole('button', { name: /dark/i }))
    expect(getHtmlClass().contains('dark')).toBe(true)
  })

  it('removes dark class when light is selected after dark', async () => {
    const user = userEvent.setup()
    document.documentElement.classList.add('dark')
    render(<ThemeSwitcher />)
    await user.click(screen.getByRole('button', { name: /light/i }))
    expect(getHtmlClass().contains('dark')).toBe(false)
  })
})
```

**Step 2: Run (expect FAIL)**

```bash
pnpm --filter web vitest run src/features/theme-switcher/ui/ThemeSwitcher.test.tsx
```

Expected: FAIL — `./ThemeSwitcher.js` does not exist yet.

---

**Step 3: Implement**

Create `apps/web/src/app/providers/ThemeProvider.tsx`:

`ThemeProvider` initializes the `<html class="dark">` toggle on mount based on the user's stored preference. It reads the stored theme from `localStorage` key `theme` (written by `ThemeSwitcher`) and falls back to the OS-level `prefers-color-scheme` media query. It renders no additional DOM — just applies the class and returns children.

```tsx
import { useEffect } from 'react'
import type { ReactNode } from 'react'

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = stored === 'dark' || (!stored && prefersDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  return <>{children}</>
}
```

Create `apps/web/src/features/theme-switcher/ui/ThemeSwitcher.tsx`:

`ThemeSwitcher` persists the user's choice to `localStorage` and immediately toggles the `<html class="dark">`. If the user is authenticated, it also calls `PATCH /users/me/preferences` to persist the preference server-side so it survives across devices and sessions.

```tsx
import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '@/shared/api/index.js'
import { cn } from '@/shared/lib/index.js'
import { useAuthStore } from '@/entities/user/index.js'

type Theme = 'LIGHT' | 'DARK'

function getCurrentTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'DARK' : 'LIGHT'
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'DARK')
  localStorage.setItem('theme', theme === 'DARK' ? 'dark' : 'light')
}

export function ThemeSwitcher() {
  const { t } = useTranslation()
  const accessToken = useAuthStore((s) => s.accessToken)
  const [theme, setTheme] = useState<Theme>(getCurrentTheme)

  const mutation = useMutation({
    mutationFn: (newTheme: Theme) =>
      api.patch('/users/me/preferences', { theme: newTheme }),
  })

  const handleChange = (newTheme: Theme) => {
    applyTheme(newTheme)
    setTheme(newTheme)
    if (accessToken) {
      mutation.mutate(newTheme)
    }
  }

  return (
    <div className="flex gap-2" role="group" aria-label="Theme">
      {(['LIGHT', 'DARK'] as Theme[]).map((t_) => (
        <button
          key={t_}
          onClick={() => handleChange(t_)}
          aria-pressed={theme === t_}
          aria-label={t_ === 'LIGHT' ? t('settings.light') : t('settings.dark')}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            theme === t_
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
          )}
        >
          {t_ === 'LIGHT' ? t('settings.light') : t('settings.dark')}
        </button>
      ))}
    </div>
  )
}
```

Create `apps/web/src/features/theme-switcher/index.ts`:

```ts
export { ThemeSwitcher } from './ui/ThemeSwitcher.js'
```

Create `apps/web/src/features/language-switcher/ui/LanguageSwitcher.tsx`:

`LanguageSwitcher` calls `i18n.changeLanguage()` immediately for a live preview effect, persists to `localStorage` via the `i18next-browser-languagedetector` config (`lookupLocalStorage: 'lang'`), and saves to the server for cross-device persistence.

```tsx
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '@/shared/api/index.js'
import { cn } from '@/shared/lib/index.js'
import { useAuthStore } from '@/entities/user/index.js'

const LANGUAGES = [
  { code: 'en', labelKey: 'settings.english' },
  { code: 'ru', labelKey: 'settings.russian' },
] as const

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  const accessToken = useAuthStore((s) => s.accessToken)

  const mutation = useMutation({
    mutationFn: (lang: string) =>
      api.patch('/users/me/preferences', { language: lang }),
  })

  const handleChange = (lang: string) => {
    i18n.changeLanguage(lang)
    if (accessToken) {
      mutation.mutate(lang)
    }
  }

  return (
    <div className="flex gap-2" role="group" aria-label="Language">
      {LANGUAGES.map(({ code, labelKey }) => (
        <button
          key={code}
          onClick={() => handleChange(code)}
          aria-pressed={i18n.language === code}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            i18n.language === code
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
          )}
        >
          {t(labelKey)}
        </button>
      ))}
    </div>
  )
}
```

Create `apps/web/src/features/language-switcher/index.ts`:

```ts
export { LanguageSwitcher } from './ui/LanguageSwitcher.js'
```

Replace `apps/web/src/pages/settings/SettingsPage.tsx` with the full implementation:

```tsx
import { useTranslation } from 'react-i18next'
import { ThemeSwitcher } from '@/features/theme-switcher/index.js'
import { LanguageSwitcher } from '@/features/language-switcher/index.js'
import { Card } from '@/shared/ui/index.js'

export function SettingsPage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-8 max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {t('settings.title')}
      </h1>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
          {t('settings.theme')}
        </h2>
        <ThemeSwitcher />
      </Card>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
          {t('settings.language')}
        </h2>
        <LanguageSwitcher />
      </Card>
    </div>
  )
}
```

Update `apps/web/src/app/providers/ApiProvider.tsx` to apply preferences from the API on boot.

The design specifies *"Detection order: user preference from API → localStorage → browser default."* `ThemeProvider` initializes from `localStorage` before the API call completes. After `/users/me` returns, override both theme and language with the server-authoritative values. This ensures cross-device preference sync.

```tsx
import { useEffect } from 'react'
import { useAuthStore } from '@/entities/user/index.js'
import { api } from '@/shared/api/index.js'
import { setupInterceptors } from '@/shared/api/interceptors.js'
import { i18n } from '@/shared/i18n/index.js'
import type { ReactNode } from 'react'

function applyTheme(theme: 'LIGHT' | 'DARK') {
  document.documentElement.classList.toggle('dark', theme === 'DARK')
  localStorage.setItem('theme', theme === 'DARK' ? 'dark' : 'light')
}

export function ApiProvider({ children }: { children: ReactNode }) {
  const { accessToken, setAuth, clearAuth } = useAuthStore()

  useEffect(() => {
    // ── 1. Wire Axios interceptors ──
    setupInterceptors(
      api,
      () => useAuthStore.getState().accessToken,
      (newToken) => {
        const user = useAuthStore.getState().user
        if (user) useAuthStore.getState().setAuth(newToken, user)
      },
      clearAuth,
    )

    // ── 2. Rehydrate user on boot ──
    if (!accessToken) {
      useAuthStore.setState({ isHydrated: true })
      return
    }

    api
      .get('/users/me')
      .then((r) => {
        const { id, email, name, avatarUrl, preferences } = r.data
        setAuth(accessToken, { id, email, name, avatarUrl })

        // Apply server preferences — API takes priority over localStorage (design spec)
        if (preferences) {
          applyTheme(preferences.theme)
          void i18n.changeLanguage(preferences.language)
          localStorage.setItem('lang', preferences.language)
        }
      })
      .catch(() => {
        clearAuth()
      })
      .finally(() => {
        useAuthStore.setState({ isHydrated: true })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}
```

Update `apps/web/src/app/App.tsx` to include `ThemeProvider`:

```tsx
import { RouterProvider } from 'react-router-dom'
import { QueryProvider } from './providers/QueryProvider.js'
import { I18nProvider } from './providers/I18nProvider.js'
import { ApiProvider } from './providers/ApiProvider.js'
import { ThemeProvider } from './providers/ThemeProvider.js'
import { router } from './router.js'
import '@/shared/i18n/i18n.js'

export function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <QueryProvider>
          <ApiProvider>
            <RouterProvider router={router} />
          </ApiProvider>
        </QueryProvider>
      </ThemeProvider>
    </I18nProvider>
  )
}
```

---

**Step 4: Run (expect PASS)**

```bash
pnpm --filter web vitest run src/features/theme-switcher/ui/ThemeSwitcher.test.tsx
```

Expected: PASS — all 3 tests green.

**Step 5: Type-check**

```bash
pnpm --filter web tsc --noEmit
```

Expected: No errors.

**Step 6: Smoke test**

1. Navigate to `/settings`.
2. Click "Dark" — page background switches to dark mode instantly.
3. Click "Light" — switches back.
4. Click "Russian" — all nav labels, headings, and button text switch to Russian instantly.
5. Refresh the page — language and theme preferences are preserved.

**Step 7: Commit**

```bash
git add apps/web/src/features/theme-switcher apps/web/src/features/language-switcher \
        apps/web/src/app/providers/ThemeProvider.tsx apps/web/src/app/App.tsx \
        apps/web/src/pages/settings
git commit -m "feat(web): add theme/language switchers and full settings page"
```
