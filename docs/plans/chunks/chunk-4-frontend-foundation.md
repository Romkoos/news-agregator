## Phase 4: Frontend Foundation (Tasks 14–18)

This phase scaffolds the `apps/web` React 18 SPA, wires up the full infrastructure layer (Vite, Tailwind, routing, Axios with auth interceptors, i18n, shared UI components, and the Zustand auth store), and establishes the Feature-Sliced Design (FSD) directory structure. All implementation tasks follow TDD: write failing test → implement → pass → commit.

---

### Task 14: apps/web — Vite scaffold, Tailwind, routing shell

**Goal:** Bootstrap the `apps/web` package with Vite 6, React 18, TypeScript 5.7, Tailwind CSS 3, React Router v6, and the full FSD directory structure. No unit test is required for this task — verify with `pnpm --filter web dev`.

**Files to create:**

- `apps/web/package.json`
- `apps/web/vite.config.ts`
- `apps/web/tsconfig.json`
- `apps/web/vitest.config.ts`
- `apps/web/tailwind.config.ts`
- `apps/web/postcss.config.js`
- `apps/web/index.html`
- `apps/web/src/test/setup.ts`
- `apps/web/src/app/styles/global.css`
- `apps/web/src/app/main.tsx`
- `apps/web/src/app/App.tsx`
- `apps/web/src/app/router.tsx`

---

**`apps/web/package.json`**

```json
{
  "name": "web",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@repo/contracts": "workspace:*",
    "@tanstack/react-query": "^5.62.10",
    "axios": "^1.7.9",
    "clsx": "^2.1.1",
    "i18next": "^24.2.0",
    "i18next-browser-languagedetector": "^8.0.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-i18next": "^15.2.0",
    "react-router-dom": "^6.28.1",
    "tailwind-merge": "^2.6.0",
    "zustand": "^5.0.2"
  },
  "devDependencies": {
    "@repo/config": "workspace:*",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.17",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.17.0",
    "eslint-plugin-boundaries": "^5.0.1",
    "jsdom": "^25.0.1",
    "msw": "^2.7.0",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.3",
    "vite": "^6.0.7",
    "vitest": "^2.1.8"
  }
}
```

---

**`apps/web/vite.config.ts`**

Path aliases map each FSD layer to its source directory. The `server.port` is fixed at `5173` to match the expected dev URL.

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@/app': path.resolve(__dirname, './src/app'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/widgets': path.resolve(__dirname, './src/widgets'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/entities': path.resolve(__dirname, './src/entities'),
      '@/shared': path.resolve(__dirname, './src/shared'),
    },
  },
  server: { port: 5173 },
})
```

---

**`apps/web/tsconfig.json`**

Extends the shared repo tsconfig, adds DOM libs for browser code, and mirrors the Vite path aliases in TypeScript's `paths` so the compiler resolves the same aliases during type-checking.

```json
{
  "extends": "@repo/config/tsconfig",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/app/*": ["./src/app/*"],
      "@/pages/*": ["./src/pages/*"],
      "@/widgets/*": ["./src/widgets/*"],
      "@/features/*": ["./src/features/*"],
      "@/entities/*": ["./src/entities/*"],
      "@/shared/*": ["./src/shared/*"]
    }
  },
  "include": ["src/**/*", "vite.config.ts"]
}
```

---

**`apps/web/vitest.config.ts`**

Separate Vitest config so test runs use `jsdom` environment and the same path aliases as Vite. `setupFiles` points to the jest-dom import shim.

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@/app': path.resolve(__dirname, './src/app'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/widgets': path.resolve(__dirname, './src/widgets'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/entities': path.resolve(__dirname, './src/entities'),
      '@/shared': path.resolve(__dirname, './src/shared'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
```

---

**`apps/web/tailwind.config.ts`**

`darkMode: 'class'` means dark mode is activated by adding the `dark` class to `<html>`. The `primary` color scale is extended so shared UI components can reference `bg-primary-600` etc.

```ts
import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
```

---

**`apps/web/postcss.config.js`**

```js
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}
```

---

**`apps/web/src/test/setup.ts`**

Imported by Vitest before every test file. Registers all `@testing-library/jest-dom` matchers (`toBeInTheDocument`, `toBeDisabled`, etc.) globally.

```ts
import '@testing-library/jest-dom'
```

---

**`apps/web/index.html`**

The Vite entry point. `<div id="root">` is the React mount target; `main.tsx` is loaded as an ES module.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>News Aggregator</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/app/main.tsx"></script>
  </body>
</html>
```

---

**`apps/web/src/app/styles/global.css`**

Tailwind directive imports. This file must be imported in `main.tsx` so Vite processes it through PostCSS.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

**`apps/web/src/app/main.tsx`**

Application entry point. Renders `<App>` inside `React.StrictMode`. Providers (Query, Theme, i18n) are added in Task 15+.

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App.tsx'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

---

**`apps/web/src/app/App.tsx`**

Thin shell that mounts the router. Full provider wrapping (QueryClient, ThemeProvider, ApiProvider) is added in subsequent tasks.

```tsx
import { RouterProvider } from 'react-router-dom'
import { router } from './router.tsx'

export function App() {
  return <RouterProvider router={router} />
}
```

---

**`apps/web/src/app/router.tsx`**

Placeholder routes. Page components replace the `<div>` placeholders in later tasks.

```tsx
import { createBrowserRouter } from 'react-router-dom'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <div>Dashboard (placeholder)</div>,
  },
  {
    path: '/login',
    element: <div>Login (placeholder)</div>,
  },
])
```

---

**Step 1: Install dependencies**

```bash
pnpm --filter web install
```

**Step 2: Smoke test**

```bash
pnpm --filter web dev
```

Expected: Vite dev server starts on `http://localhost:5173` with no errors in the terminal.

**Step 3: Verify build**

```bash
pnpm --filter web build
```

Expected: TypeScript type-check and Vite build both pass with no errors.

**Step 4: Commit**

```bash
git add apps/web
git commit -m "feat(web): scaffold Vite + React + Tailwind + FSD structure"
```

---

### Task 15: shared/api — Axios instance with auth interceptors

**Goal:** Create the shared Axios instance and the auth interceptor logic that attaches the access token to every request and transparently handles token refresh on 401 responses. Follow TDD: write the failing test first, then implement.

**Files to create:**

- `apps/web/src/shared/api/axios.ts`
- `apps/web/src/shared/api/interceptors.ts`
- `apps/web/src/shared/api/index.ts`
- `apps/web/src/shared/api/interceptors.test.ts`

---

**Step 1: Write failing test**

Create `apps/web/src/shared/api/interceptors.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { setupInterceptors } from './interceptors.js'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

const BASE = 'http://localhost:3001'

const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('setupInterceptors', () => {
  let instance: ReturnType<typeof axios.create>
  const getToken = vi.fn<() => string | null>()
  const onTokenRefreshed = vi.fn()
  const onLogout = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    instance = axios.create({ baseURL: BASE, withCredentials: true })
    setupInterceptors(instance, getToken, onTokenRefreshed, onLogout)
  })

  it('attaches Authorization header when token exists', async () => {
    getToken.mockReturnValue('my-token')
    let capturedAuth = ''
    server.use(
      http.get(`${BASE}/test`, ({ request }) => {
        capturedAuth = request.headers.get('authorization') ?? ''
        return HttpResponse.json({ ok: true })
      }),
    )
    await instance.get('/test')
    expect(capturedAuth).toBe('Bearer my-token')
  })

  it('does not attach Authorization when no token', async () => {
    getToken.mockReturnValue(null)
    let capturedAuth = ''
    server.use(
      http.get(`${BASE}/test`, ({ request }) => {
        capturedAuth = request.headers.get('authorization') ?? ''
        return HttpResponse.json({ ok: true })
      }),
    )
    await instance.get('/test')
    expect(capturedAuth).toBe('')
  })

  it('retries request with new token after 401', async () => {
    getToken.mockReturnValue('old-token')
    let callCount = 0
    server.use(
      http.get(`${BASE}/protected`, () => {
        callCount++
        if (callCount === 1) return new HttpResponse(null, { status: 401 })
        return HttpResponse.json({ data: 'ok' })
      }),
      http.post(`${BASE}/auth/refresh`, () => {
        return HttpResponse.json({ accessToken: 'new-token' })
      }),
    )
    const res = await instance.get('/protected')
    expect(res.data).toEqual({ data: 'ok' })
    expect(onTokenRefreshed).toHaveBeenCalledWith('new-token')
  })

  it('calls onLogout when refresh fails', async () => {
    getToken.mockReturnValue('old-token')
    server.use(
      http.get(`${BASE}/protected`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${BASE}/auth/refresh`, () => new HttpResponse(null, { status: 401 })),
    )
    await expect(instance.get('/protected')).rejects.toThrow()
    expect(onLogout).toHaveBeenCalled()
  })
})
```

**Step 2: Run (expect FAIL)**

```bash
pnpm --filter web vitest run src/shared/api/interceptors.test.ts
```

Expected: FAIL — the module `./interceptors.js` does not exist yet.

---

**Step 3: Implement**

Create `apps/web/src/shared/api/axios.ts`:

The instance uses `withCredentials: true` so the browser sends the `refreshToken` HttpOnly cookie on the `/auth/refresh` call.

```ts
import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
  withCredentials: true, // send cookies (refresh token)
})
```

Create `apps/web/src/shared/api/interceptors.ts`:

The interceptor implements a queue-based token refresh pattern. While a refresh is in flight, all other 401'd requests are held in `failedQueue` and replayed once the new token arrives. If refresh itself fails, all queued requests are rejected and `onLogout` is called to clear app state.

```ts
import type { AxiosInstance } from 'axios'

export function setupInterceptors(
  apiInstance: AxiosInstance,
  getToken: () => string | null,
  onTokenRefreshed: (token: string) => void,
  onLogout: () => void,
) {
  // Request interceptor: attach access token to every outgoing request
  apiInstance.interceptors.request.use((config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  // Response interceptor: handle 401 → refresh → retry
  let isRefreshing = false
  let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

  const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
      if (error) reject(error)
      else resolve(token!)
    })
    failedQueue = []
  }

  apiInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config
      if (error.response?.status !== 401 || originalRequest._retry) {
        return Promise.reject(error)
      }
      if (isRefreshing) {
        // Queue this request until the ongoing refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return apiInstance(originalRequest)
        })
      }
      originalRequest._retry = true
      isRefreshing = true
      try {
        const { data } = await apiInstance.post<{ accessToken: string }>('/auth/refresh')
        onTokenRefreshed(data.accessToken)
        processQueue(null, data.accessToken)
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return apiInstance(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        onLogout()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    },
  )
}
```

Create `apps/web/src/shared/api/index.ts`:

```ts
export { api } from './axios.js'
export { setupInterceptors } from './interceptors.js'
```

---

**Step 4: Run (expect PASS)**

```bash
pnpm --filter web vitest run src/shared/api/interceptors.test.ts
```

Expected: PASS — all 4 tests green.

**Step 5: Commit**

```bash
git add apps/web/src/shared/api
git commit -m "feat(web): add Axios instance with auth interceptors"
```

---

### Task 16: shared/i18n — react-i18next setup

**Goal:** Configure `react-i18next` with English and Russian translation files. Language detection reads from `localStorage` key `lang` first, then falls back to the browser's `navigator.language`, then to `'en'`. Follow TDD.

**Files to create:**

- `apps/web/src/shared/i18n/locales/en.json`
- `apps/web/src/shared/i18n/locales/ru.json`
- `apps/web/src/shared/i18n/i18n.ts`
- `apps/web/src/shared/i18n/index.ts`
- `apps/web/src/shared/i18n/i18n.test.ts`

---

**Step 1: Write failing test**

Create `apps/web/src/shared/i18n/i18n.test.ts`:

```ts
import { describe, it, expect, beforeAll } from 'vitest'
import i18n from './i18n.js'

beforeAll(async () => {
  await i18n.changeLanguage('en')
})

describe('i18n', () => {
  it('translates nav.dashboard in English', () => {
    expect(i18n.t('nav.dashboard')).toBe('Dashboard')
  })

  it('translates nav.dashboard in Russian after language change', async () => {
    await i18n.changeLanguage('ru')
    expect(i18n.t('nav.dashboard')).toBe('Главная')
    await i18n.changeLanguage('en')
  })

  it('falls back to English for unknown language', async () => {
    await i18n.changeLanguage('fr')
    expect(i18n.t('nav.dashboard')).toBe('Dashboard')
    await i18n.changeLanguage('en')
  })
})
```

**Step 2: Run (expect FAIL)**

```bash
pnpm --filter web vitest run src/shared/i18n/i18n.test.ts
```

Expected: FAIL — the module `./i18n.js` does not exist yet.

---

**Step 3: Implement**

Create `apps/web/src/shared/i18n/locales/en.json`:

```json
{
  "nav": {
    "dashboard": "Dashboard",
    "news": "News",
    "bookmarks": "Bookmarks",
    "settings": "Settings"
  },
  "auth": {
    "login": "Sign In",
    "register": "Sign Up",
    "logout": "Sign Out",
    "email": "Email",
    "password": "Password",
    "name": "Full Name",
    "loginTitle": "Welcome back",
    "registerTitle": "Create account",
    "noAccount": "Don't have an account?",
    "hasAccount": "Already have an account?",
    "invalidCredentials": "Invalid email or password",
    "currentPassword": "Current Password",
    "newPassword": "New Password"
  },
  "profile": {
    "title": "Profile",
    "updateSuccess": "Profile updated successfully",
    "passwordChanged": "Password changed successfully",
    "avatarUrl": "Avatar URL"
  },
  "settings": {
    "title": "Settings",
    "theme": "Theme",
    "light": "Light",
    "dark": "Dark",
    "language": "Language",
    "english": "English",
    "russian": "Russian"
  },
  "news": {
    "allCategories": "All",
    "noArticles": "No articles found",
    "readMore": "Read more",
    "bookmark": "Bookmark",
    "unbookmark": "Remove bookmark",
    "bookmarks": "Bookmarks",
    "noBookmarks": "No bookmarks yet"
  },
  "dashboard": {
    "title": "Dashboard",
    "welcome": "Welcome, {{name}}!"
  },
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "loading": "Loading...",
    "error": "Something went wrong",
    "retry": "Retry"
  }
}
```

Create `apps/web/src/shared/i18n/locales/ru.json`:

```json
{
  "nav": {
    "dashboard": "Главная",
    "news": "Новости",
    "bookmarks": "Закладки",
    "settings": "Настройки"
  },
  "auth": {
    "login": "Войти",
    "register": "Зарегистрироваться",
    "logout": "Выйти",
    "email": "Электронная почта",
    "password": "Пароль",
    "name": "Полное имя",
    "loginTitle": "С возвращением",
    "registerTitle": "Создать аккаунт",
    "noAccount": "Нет аккаунта?",
    "hasAccount": "Уже есть аккаунт?",
    "invalidCredentials": "Неверный email или пароль",
    "currentPassword": "Текущий пароль",
    "newPassword": "Новый пароль"
  },
  "profile": {
    "title": "Профиль",
    "updateSuccess": "Профиль обновлён",
    "passwordChanged": "Пароль изменён",
    "avatarUrl": "URL аватара"
  },
  "settings": {
    "title": "Настройки",
    "theme": "Тема",
    "light": "Светлая",
    "dark": "Тёмная",
    "language": "Язык",
    "english": "Английский",
    "russian": "Русский"
  },
  "news": {
    "allCategories": "Все",
    "noArticles": "Статей не найдено",
    "readMore": "Читать",
    "bookmark": "В закладки",
    "unbookmark": "Убрать из закладок",
    "bookmarks": "Закладки",
    "noBookmarks": "Закладок пока нет"
  },
  "dashboard": {
    "title": "Главная",
    "welcome": "Добро пожаловать, {{name}}!"
  },
  "common": {
    "save": "Сохранить",
    "cancel": "Отмена",
    "loading": "Загрузка...",
    "error": "Что-то пошло не так",
    "retry": "Повторить"
  }
}
```

Create `apps/web/src/shared/i18n/i18n.ts`:

`LanguageDetector` is configured with `order: ['localStorage', 'navigator']` so that a user's stored preference takes priority over the browser setting. The `lookupLocalStorage` key `'lang'` matches what the settings feature writes when the user changes language.

```ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en.json'
import ru from './locales/ru.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, ru: { translation: ru } },
    fallbackLng: 'en',
    supportedLngs: ['en', 'ru'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'lang',
    },
    interpolation: { escapeValue: false },
  })

export default i18n
```

Create `apps/web/src/shared/i18n/index.ts`:

```ts
export { default as i18n } from './i18n.js'
```

---

**Step 4: Run (expect PASS)**

```bash
pnpm --filter web vitest run src/shared/i18n/i18n.test.ts
```

Expected: PASS — all 3 tests green.

**Step 5: Commit**

```bash
git add apps/web/src/shared/i18n
git commit -m "feat(web): add react-i18next with EN/RU translations"
```

---

### Task 17: shared/ui — Base design system components

**Goal:** Implement the four foundational shared UI components (`Button`, `Input`, `Card`, `Spinner`) and the `cn()` utility. Follow TDD — the `Button` test is written first.

**Files to create:**

- `apps/web/src/shared/lib/cn.ts`
- `apps/web/src/shared/lib/index.ts`
- `apps/web/src/shared/ui/Button/Button.tsx`
- `apps/web/src/shared/ui/Input/Input.tsx`
- `apps/web/src/shared/ui/Card/Card.tsx`
- `apps/web/src/shared/ui/Spinner/Spinner.tsx`
- `apps/web/src/shared/ui/index.ts`
- `apps/web/src/shared/ui/Button/Button.test.tsx`

---

**Step 1: Write failing test**

Create `apps/web/src/shared/ui/Button/Button.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button.js'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('is disabled when isLoading is true', () => {
    render(<Button isLoading>Save</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick} disabled>Click</Button>)
    await user.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })
})
```

**Step 2: Run (expect FAIL)**

```bash
pnpm --filter web vitest run src/shared/ui/Button/Button.test.tsx
```

Expected: FAIL — the module `./Button.js` does not exist yet.

---

**Step 3: Implement**

Create `apps/web/src/shared/lib/cn.ts`:

`clsx` handles conditional class names; `twMerge` resolves Tailwind class conflicts (e.g. `p-2 p-4` → `p-4`).

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Create `apps/web/src/shared/lib/index.ts`:

```ts
export { cn } from './cn.js'
```

Create `apps/web/src/shared/ui/Button/Button.tsx`:

The `isLoading` prop disables the button and renders an inline spinner. `variant` controls color intent; `size` controls height and padding. All classes are composed through `cn()` so consumers can override with `className`.

```tsx
import { cn } from '@/shared/lib/cn.js'
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500': variant === 'primary',
          'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600': variant === 'secondary',
          'hover:bg-gray-100 text-gray-700 focus:ring-gray-500 dark:text-gray-300 dark:hover:bg-gray-800': variant === 'ghost',
          'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500': variant === 'danger',
          'h-8 px-3 text-sm': size === 'sm',
          'h-10 px-4 text-sm': size === 'md',
          'h-12 px-6 text-base': size === 'lg',
        },
        className,
      )}
    >
      {isLoading ? (
        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  )
}
```

Create `apps/web/src/shared/ui/Input/Input.tsx`:

`forwardRef` allows parent components (especially form libraries) to hold a direct ref to the underlying `<input>`. The `error` prop renders a red helper text and switches the border to red.

```tsx
import { cn } from '@/shared/lib/cn.js'
import type { InputHTMLAttributes } from 'react'
import { forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'rounded-lg border px-3 py-2 text-sm outline-none transition-colors',
            'border-gray-300 bg-white text-gray-900 placeholder-gray-400',
            'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
            'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  },
)
Input.displayName = 'Input'
```

Create `apps/web/src/shared/ui/Card/Card.tsx`:

A generic container with a white/dark background, rounded corners, border, and drop shadow. Accepts all standard `div` props so consumers can add `onClick`, `className`, etc.

```tsx
import { cn } from '@/shared/lib/cn.js'
import type { HTMLAttributes } from 'react'

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
```

Create `apps/web/src/shared/ui/Spinner/Spinner.tsx`:

`role="status"` and a default `aria-label` make the spinner accessible. Accept all `HTMLDivElement` attributes so callers can override `aria-label` and `className` without TypeScript errors. Chunks 5, 6, and 7 pass `<Spinner aria-label="Loading" />` and tests use `screen.getByLabelText('Loading')`.

```tsx
import { cn } from '@/shared/lib/cn.js'
import type { HTMLAttributes } from 'react'

export function Spinner({ className, 'aria-label': ariaLabel = 'Loading', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={cn(
        'h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600',
        className,
      )}
      {...props}
    />
  )
}
```

Create `apps/web/src/shared/ui/index.ts`:

```ts
export { Button } from './Button/Button.js'
export { Input } from './Input/Input.js'
export { Card } from './Card/Card.js'
export { Spinner } from './Spinner/Spinner.js'
```

---

**Step 4: Run (expect PASS)**

```bash
pnpm --filter web vitest run src/shared/ui/Button/Button.test.tsx
```

Expected: PASS — all 4 tests green.

**Step 5: Commit**

```bash
git add apps/web/src/shared/lib apps/web/src/shared/ui
git commit -m "feat(web): add shared UI components (Button, Input, Card, Spinner)"
```

---

### Task 18: entities/user + Zustand auth store

**Goal:** Define the `User` and `UserPreferences` TypeScript types, implement the Zustand auth store with `persist` middleware, create the `UserAvatar` UI component, wire the Axios interceptors to the store via `ApiProvider`, and expose a clean public API from `entities/user/index.ts`. Follow TDD.

**Files to create:**

- `apps/web/src/entities/user/model/types.ts`
- `apps/web/src/entities/user/model/auth.store.ts`
- `apps/web/src/entities/user/model/auth.store.test.ts`
- `apps/web/src/entities/user/ui/UserAvatar.tsx`
- `apps/web/src/entities/user/index.ts`
- `apps/web/src/app/providers/ApiProvider.tsx`

---

**Step 1: Write failing test**

Create `apps/web/src/entities/user/model/auth.store.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './auth.store.js'

beforeEach(() => {
  useAuthStore.setState({ accessToken: null, user: null, isHydrated: false })
})

describe('useAuthStore', () => {
  it('starts with null auth', () => {
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('sets auth correctly', () => {
    const user = { id: '1', email: 'a@b.com', name: 'Alice', avatarUrl: null }
    useAuthStore.getState().setAuth('token-123', user)
    expect(useAuthStore.getState().accessToken).toBe('token-123')
    expect(useAuthStore.getState().user).toEqual(user)
  })

  it('clears auth', () => {
    useAuthStore.getState().setAuth('token', { id: '1', email: 'a@b.com', name: 'Alice', avatarUrl: null })
    useAuthStore.getState().clearAuth()
    expect(useAuthStore.getState().accessToken).toBeNull()
  })
})
```

**Step 2: Run (expect FAIL)**

```bash
pnpm --filter web vitest run src/entities/user/model/auth.store.test.ts
```

Expected: FAIL — the module `./auth.store.js` does not exist yet.

---

**Step 3: Implement**

Create `apps/web/src/entities/user/model/types.ts`:

`User` is the shape returned by the backend's auth endpoints. `UserPreferences` comes from the `/users/me/preferences` endpoint and drives theme and language state.

```ts
export interface User {
  id: string
  email: string
  name: string
  avatarUrl: string | null
}

export interface UserPreferences {
  theme: 'LIGHT' | 'DARK'
  language: string
}
```

Create `apps/web/src/entities/user/model/auth.store.ts`:

`isHydrated` is `false` until Zustand's `persist` middleware finishes reading `localStorage`. UI that depends on auth state (e.g. route guards) should wait until `isHydrated` is `true` before rendering, to avoid a flash of unauthenticated content.

The `onRehydrateStorage` callback receives the reconstituted state and calls `setHydrated()`. `getState()` is used by the Axios interceptor (outside of React) to read the current access token without subscribing.

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from './types.js'

interface AuthState {
  accessToken: string | null
  user: User | null
  isHydrated: boolean
  setAuth: (accessToken: string, user: User) => void
  clearAuth: () => void
  setHydrated: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isHydrated: false,
      setAuth: (accessToken, user) => set({ accessToken, user }),
      clearAuth: () => set({ accessToken: null, user: null }),
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated()
      },
    },
  ),
)
```

Create `apps/web/src/entities/user/ui/UserAvatar.tsx`:

When `avatarUrl` is provided, renders an `<img>` with `object-cover` so the image fills the circular frame. Otherwise, computes initials (up to two characters) from the user's name and renders them on a `primary-600` background. The `aria-label` on the fallback div makes it accessible.

```tsx
import { cn } from '@/shared/lib/cn.js'

interface UserAvatarProps {
  name: string
  avatarUrl: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function UserAvatar({ name, avatarUrl, size = 'md', className }: UserAvatarProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-16 w-16 text-xl' }

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn('rounded-full object-cover', sizes[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-primary-600 font-semibold text-white',
        sizes[size],
        className,
      )}
      aria-label={name}
    >
      {initials}
    </div>
  )
}
```

Create `apps/web/src/entities/user/index.ts`:

Public API for the `user` entity slice. All consumers import from `@/entities/user`, never from internal paths.

```ts
export { useAuthStore } from './model/auth.store.js'
export { UserAvatar } from './ui/UserAvatar.js'
export type { User, UserPreferences } from './model/types.js'
```

Create `apps/web/src/app/providers/ApiProvider.tsx`:

`ApiProvider` runs `setupInterceptors` once on mount via `useEffect`. It reads the token imperatively via `useAuthStore.getState()` (not `useAuthStore()`) so the Axios request interceptor does not trigger React re-renders. When the refresh succeeds, `setAuth` is called with the new token while preserving the existing `user` object. When refresh fails, `clearAuth` wipes both token and user, triggering a redirect to `/login` via downstream route guards.

```tsx
import { useEffect } from 'react'
import { setupInterceptors } from '@/shared/api/interceptors.js'
import { api } from '@/shared/api/axios.js'
import { useAuthStore } from '@/entities/user/index.js'

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const setAuth = useAuthStore(s => s.setAuth)
  const clearAuth = useAuthStore(s => s.clearAuth)
  const getToken = () => useAuthStore.getState().accessToken

  useEffect(() => {
    setupInterceptors(
      api,
      getToken,
      (newToken) => {
        const user = useAuthStore.getState().user
        if (user) setAuth(newToken, user)
      },
      clearAuth,
    )
  }, [])

  return <>{children}</>
}
```

---

**Step 4: Run (expect PASS)**

```bash
pnpm --filter web vitest run src/entities/user/model/auth.store.test.ts
```

Expected: PASS — all 3 tests green.

**Step 5: Commit**

```bash
git add apps/web/src/entities/user apps/web/src/app/providers
git commit -m "feat(web): add auth store and user entity"
```

---

## Summary

| Task | What is built | Test coverage |
|------|--------------|---------------|
| 14 | Vite + React + Tailwind + FSD scaffold, routing shell | Smoke test (dev server starts) |
| 15 | Axios instance + auth interceptors (token attach, 401 refresh, logout) | 4 unit tests via MSW |
| 16 | react-i18next with EN/RU locale files, language detection | 3 unit tests |
| 17 | `cn()` utility + Button, Input, Card, Spinner components | 4 unit tests for Button |
| 18 | `User` types, Zustand auth store with persistence, `UserAvatar`, `ApiProvider` | 3 unit tests for store |

After completing all five tasks, the frontend infrastructure is fully in place. Subsequent phases (authentication pages, news feed, bookmarks, settings, layout shell) build on top of these foundations without modifying them.
