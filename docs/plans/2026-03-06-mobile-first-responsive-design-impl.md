# Mobile-First Responsive Design Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the app fully responsive with a mobile-first bottom tab bar, desktop sidebar, and the warm brick/cream/teal color palette.

**Architecture:** Single `AppLayout` that renders the full sidebar on `lg+` and a fixed bottom tab bar below `lg`. Color tokens are added to Tailwind config so all components use named tokens instead of hard-coded blue shades.

**Tech Stack:** React, Tailwind CSS v3, React Router v6, TypeScript

---

## Color Reference

| Token | Hex | Usage |
|---|---|---|
| `primary-50` | `#fdf2f2` | Light active bg (nav chip, category badge) |
| `primary-400` | `#d06868` | Dark mode accent text |
| `primary-500` | `#BF4646` | Brand color |
| `primary-600` | `#a33b3b` | Button bg, active link |
| `primary-700` | `#8a3232` | Active text |
| `primary-900` | `#3d1616` | Dark mode bg tint |
| `surface` | `#EDDCC6` | Sidebar bg, card tones |
| `background` | `#FFF4EA` | App background |
| `secondary` | `#7EACB5` | Secondary hover tones |

---

### Task 1: Update Tailwind color tokens

**Files:**
- Modify: `apps/web/tailwind.config.ts`

**Step 1: Replace the colors section**

Open `apps/web/tailwind.config.ts` and replace the entire `colors` block inside `theme.extend`:

```ts
import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#fdf2f2',
          400: '#d06868',
          500: '#BF4646',
          600: '#a33b3b',
          700: '#8a3232',
          900: '#3d1616',
        },
        surface:    '#EDDCC6',
        background: '#FFF4EA',
        secondary:  '#7EACB5',
      },
    },
  },
  plugins: [],
} satisfies Config
```

**Step 2: Verify Tailwind compiles**

```bash
cd apps/web && pnpm build 2>&1 | tail -5
```

Expected: build succeeds (or only TS errors unrelated to colors).

**Step 3: Commit**

```bash
git add apps/web/tailwind.config.ts
git commit -m "feat(ui): add warm color palette tokens to Tailwind config"
```

---

### Task 2: Update Sidebar — hide on mobile, apply new colors

**Files:**
- Modify: `apps/web/src/widgets/sidebar/ui/Sidebar.tsx`

**Step 1: Update the `<aside>` element**

Line 27 — change:
```tsx
<aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
```
To:
```tsx
<aside className="hidden lg:flex h-full w-64 flex-col border-r border-surface bg-surface dark:border-gray-700 dark:bg-gray-900">
```

**Step 2: Update active nav link colors**

Lines 47-49 — change:
```tsx
isActive
  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
```
To (same tokens, they now map to new palette — no change needed here):
```tsx
isActive
  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
```

> The active nav colors already use `primary-*` tokens — they automatically pick up the new palette from Task 1. No text changes needed for those lines.

**Step 3: Update logo border and section borders**

Line 29 — `border-gray-200` → `border-surface/60`
Line 61 — `border-gray-200` → `border-surface/60`

Full updated `<aside>` opening and logo section:
```tsx
<aside className="hidden lg:flex h-full w-64 flex-col border-r border-surface bg-surface dark:border-gray-700 dark:bg-gray-900">
  {/* Logo */}
  <div className="flex h-16 items-center border-b border-surface/60 px-6 dark:border-gray-700">
    <span className="text-lg font-bold text-gray-900 dark:text-white">
      News Digest
    </span>
  </div>
```

And the user section divider (line 61):
```tsx
<div className="border-t border-surface/60 p-4 dark:border-gray-700">
```

**Step 4: Run existing tests**

```bash
cd apps/web && pnpm test --run 2>&1 | tail -20
```

Expected: all tests pass (Sidebar has no unit tests; other tests unaffected).

**Step 5: Commit**

```bash
git add apps/web/src/widgets/sidebar/ui/Sidebar.tsx
git commit -m "feat(sidebar): hide on mobile, apply warm surface color"
```

---

### Task 3: Create BottomNav component

**Files:**
- Create: `apps/web/src/widgets/sidebar/ui/BottomNav.tsx`
- Modify: `apps/web/src/widgets/sidebar/index.ts`

**Step 1: Create the file**

`apps/web/src/widgets/sidebar/ui/BottomNav.tsx`:

```tsx
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/index.js'

const navItems = [
  { labelKey: 'nav.dashboard', to: '/',          icon: '📰' },
  { labelKey: 'nav.news',      to: '/news',       icon: '🗂️' },
  { labelKey: 'nav.bookmarks', to: '/bookmarks',  icon: '🔖' },
  { labelKey: 'nav.settings',  to: '/settings',   icon: '⚙️' },
]

export function BottomNav() {
  const { t } = useTranslation()

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 flex h-16 items-stretch border-t border-surface bg-surface lg:hidden dark:border-gray-700 dark:bg-gray-900"
      aria-label="Main navigation"
    >
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors',
              isActive
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
            )
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  'flex h-7 w-12 items-center justify-center rounded-full text-lg transition-colors',
                  isActive && 'bg-primary-50 dark:bg-primary-900/20',
                )}
                aria-hidden="true"
              >
                {item.icon}
              </span>
              <span>{t(item.labelKey)}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
```

**Step 2: Export from the widget index**

`apps/web/src/widgets/sidebar/index.ts` — add line:
```ts
export { Sidebar } from './ui/Sidebar.js'
export { BottomNav } from './ui/BottomNav.js'
```

**Step 3: Commit**

```bash
git add apps/web/src/widgets/sidebar/ui/BottomNav.tsx apps/web/src/widgets/sidebar/index.ts
git commit -m "feat(nav): add mobile bottom tab bar component"
```

---

### Task 4: Update AppLayout — background, bottom padding, render BottomNav

**Files:**
- Modify: `apps/web/src/app/layouts/AppLayout.tsx`

**Step 1: Replace the full file**

```tsx
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/widgets/sidebar/index.js'
import { BottomNav } from '@/widgets/sidebar/index.js'

export function AppLayout() {
  return (
    <div className="flex h-screen bg-background dark:bg-gray-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
        <div className="mx-auto max-w-5xl p-6">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
```

**Step 2: Run existing tests**

```bash
cd apps/web && pnpm test --run 2>&1 | tail -20
```

Expected: all tests pass.

**Step 3: Commit**

```bash
git add apps/web/src/app/layouts/AppLayout.tsx
git commit -m "feat(layout): switch to background color, add BottomNav for mobile"
```

---

### Task 5: Update Button primary variant colors

**Files:**
- Modify: `apps/web/src/shared/ui/Button/Button.tsx`

**Step 1: Update the primary variant class string**

Line 26 — change:
```tsx
'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500': variant === 'primary',
```
To:
```tsx
'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600': variant === 'primary',
```

> The hex values changed but the token names are the same from Task 1 — the button already uses the right tokens. The optional dark mode addition makes the button slightly brighter on dark backgrounds. If you want to keep it simple, you can skip the dark mode addition and leave the line unchanged (tokens already map to new colors).

**Step 2: Run button tests**

```bash
cd apps/web && pnpm test --run src/shared/ui/Button 2>&1
```

Expected: all Button tests pass.

**Step 3: Commit**

```bash
git add apps/web/src/shared/ui/Button/Button.tsx
git commit -m "feat(button): update primary variant for new palette dark mode"
```

---

### Task 6: Update CategoryTab active state

**Files:**
- Modify: `apps/web/src/entities/category/ui/CategoryTab.tsx`

**Step 1: The active state already uses `primary-600` — no change needed**

Open `apps/web/src/entities/category/ui/CategoryTab.tsx`. Line 19:
```tsx
isActive
  ? 'bg-primary-600 text-white'
```

This token now maps to `#a33b3b` from Task 1. No code change needed — the new palette is applied automatically.

For the inactive state, optionally update the hover to use `secondary`:

Line 20 — change:
```tsx
: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
```
To:
```tsx
: 'bg-gray-100 text-gray-700 hover:bg-secondary/20 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-secondary/10',
```

**Step 2: Commit**

```bash
git add apps/web/src/entities/category/ui/CategoryTab.tsx
git commit -m "feat(category-tab): use secondary color for hover state"
```

---

### Task 7: Update ArticleCard category badge

**Files:**
- Modify: `apps/web/src/entities/article/ui/ArticleCard.tsx`

**Step 1: The badge already uses `primary-*` tokens — no change needed**

Lines 42-43 in `ArticleCard.tsx`:
```tsx
<span className="rounded-full bg-primary-50 px-2 py-0.5 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400">
```

These tokens now map to new palette automatically from Task 1. No code change needed.

**Step 2: Run ArticleCard tests**

```bash
cd apps/web && pnpm test --run src/entities/article 2>&1
```

Expected: all ArticleCard tests pass.

> No commit needed (no code changed).

---

### Task 8: Update auth form links and auth page backgrounds

**Files:**
- Modify: `apps/web/src/features/auth/login-form/LoginForm.tsx`
- Modify: `apps/web/src/features/auth/register-form/RegisterForm.tsx`
- Modify: `apps/web/src/pages/auth/LoginPage.tsx`
- Modify: `apps/web/src/pages/auth/RegisterPage.tsx`

**Step 1: LoginForm link (line 63)**

Change:
```tsx
className="font-medium text-primary-600 hover:underline"
```
To (no change — token maps to new color automatically):
```tsx
className="font-medium text-primary-600 hover:underline"
```

> Same token, new hex from Task 1. No code change needed.

**Step 2: RegisterForm link (line 72) — same situation, no change needed.**

**Step 3: Update auth page backgrounds**

`apps/web/src/pages/auth/LoginPage.tsx` line 5 — change:
```tsx
<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
```
To:
```tsx
<div className="flex min-h-screen items-center justify-center bg-background px-4 dark:bg-gray-900">
```

`apps/web/src/pages/auth/RegisterPage.tsx` — apply the same `bg-gray-50` → `bg-background` change.

**Step 4: Run auth tests**

```bash
cd apps/web && pnpm test --run src/features/auth 2>&1
```

Expected: all auth tests pass.

**Step 5: Commit**

```bash
git add apps/web/src/pages/auth/LoginPage.tsx apps/web/src/pages/auth/RegisterPage.tsx
git commit -m "feat(auth): apply background color to auth pages"
```

---

### Task 9: Final verification

**Step 1: Run full test suite**

```bash
cd apps/web && pnpm test --run 2>&1
```

Expected: all tests pass with 0 failures.

**Step 2: Build to catch any TypeScript errors**

```bash
cd apps/web && pnpm build 2>&1 | tail -10
```

Expected: build succeeds.

**Step 3: Manual visual checklist**

Open the dev server (`pnpm dev`) and verify at viewport widths:

- **320px** (iPhone SE): bottom tab bar visible, sidebar hidden, content not clipped
- **768px** (tablet): bottom tab bar still visible, sidebar hidden
- **1024px+** (desktop): sidebar visible, bottom tab bar hidden
- **Active nav** highlights in brick red (`#a33b3b`)
- **App background** is cream (`#FFF4EA`)
- **Sidebar background** is warm beige (`#EDDCC6`)
- **Primary buttons** (Login, Register, Save) are brick red
- **Dark mode**: same layout, dark grays, brick red accents

**Step 4: Final commit if any fixes were needed**

```bash
git add -p
git commit -m "fix(responsive): address visual review findings"
```
