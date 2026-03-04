# News Aggregator — Application Design

**Date:** 2026-03-04

## Product Summary

An AI-curated news digest where the system automatically fetches articles from preset RSS/Atom sources, applies rule-based categorization (keyword matching), and presents articles grouped by topic. Users browse by category, bookmark articles for later, manage their profile, and configure theme and language preferences. Auth is required. No user-facing source management in v1.

---

## Section 1: Monorepo Structure & Infrastructure

```
news-agregator/
├── apps/
│   ├── api/               # Fastify HTTP server (Railway web service)
│   ├── web/               # React/Vite SPA (Railway static site)
│   └── worker-news-fetch/ # One-shot fetch worker (Railway cron service)
├── packages/
│   ├── db/                # Prisma schema + generated client (shared)
│   ├── contracts/         # Zod schemas — shared FE/BE types
│   └── config/            # Shared ESLint, TS, Prettier configs
├── docker-compose.yml     # Local dev: postgres + api + web
├── turbo.json
└── pnpm-workspace.yaml
```

### Railway Services

| Service | Type | Source |
|---|---|---|
| `postgres` | Managed addon | Railway Postgres |
| `api` | Web service (always-on) | `apps/api/Dockerfile` |
| `web` | Static site | `apps/web/Dockerfile` |
| `worker-news-fetch` | Cron service (one-shot) | `apps/worker-news-fetch/Dockerfile` |

Each app has its own multi-stage Dockerfile. `packages/` code is bundled into each app at build time via pnpm workspace dependencies. The worker container runs, fetches and processes articles, then exits with code 0. Railway triggers it on a configured schedule.

---

## Section 2: Backend Architecture

Fastify modular monolith with hexagonal architecture. Three bounded contexts.

```
apps/api/src/
├── modules/
│   ├── auth/              # JWT login / register / refresh
│   │   ├── domain/        # User entity, password hashing policy
│   │   ├── application/   # use-cases: login, register, refreshToken
│   │   ├── ports/         # IUserRepository, ITokenService
│   │   └── adapters/      # PrismaUserRepository, JwtTokenService
│   ├── user/              # Profile + password management
│   │   ├── domain/
│   │   ├── application/   # use-cases: getProfile, updateProfile, changePassword
│   │   ├── ports/
│   │   └── adapters/
│   └── news/              # Articles, categories, sources, bookmarks
│       ├── domain/        # Article, Category, Source entities
│       ├── application/   # use-cases: listByCategory, getArticle, toggleBookmark
│       ├── ports/
│       └── adapters/      # PrismaArticleRepository, PrismaCategoryRepository
├── infrastructure/
│   ├── server.ts          # Fastify instance + plugin registration
│   ├── prisma.ts          # Prisma client singleton
│   └── auth-middleware.ts # JWT verify hook
└── main.ts
```

### API Endpoints

```
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
DELETE /auth/logout

GET    /users/me
PATCH  /users/me
PATCH  /users/me/password

GET    /news/categories
GET    /news/articles?categoryId=&page=&limit=
GET    /news/articles/:id
POST   /news/articles/:id/bookmark
DELETE /news/articles/:id/bookmark
GET    /news/bookmarks
```

### Worker (`apps/worker-news-fetch`)

Imports `@repo/db` directly. On each Railway-triggered run:
1. Fetch RSS feeds from `Source` rows in DB
2. Parse articles (rss-parser)
3. Run keyword categorizer against `Category.keywords`
4. Upsert articles into DB (dedup by `Article.guid`)
5. Exit 0

---

## Section 3: Database Schema

```prisma
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String
  name         String
  avatarUrl    String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  refreshTokens RefreshToken[]
  bookmarks     Bookmark[]
  preferences   UserPreferences?
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model UserPreferences {
  id       String @id @default(cuid())
  userId   String @unique
  theme    Theme  @default(LIGHT)
  language String @default("en")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Source {
  id       String    @id @default(cuid())
  name     String
  feedUrl  String    @unique
  articles Article[]
}

model Category {
  id       String   @id @default(cuid())
  slug     String   @unique  // "technology", "politics", etc.
  nameEn   String
  nameRu   String
  keywords String[]           // rule-based categorization

  articles Article[]
}

model Article {
  id          String    @id @default(cuid())
  guid        String    @unique  // RSS guid, deduplication key
  title       String
  summary     String?
  url         String
  imageUrl    String?
  publishedAt DateTime
  fetchedAt   DateTime  @default(now())
  sourceId    String
  categoryId  String?

  source    Source     @relation(fields: [sourceId], references: [id])
  category  Category?  @relation(fields: [categoryId], references: [id])
  bookmarks Bookmark[]
}

model Bookmark {
  id        String   @id @default(cuid())
  userId    String
  articleId String
  createdAt DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  article Article @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@unique([userId, articleId])
}

enum Theme {
  LIGHT
  DARK
}
```

**Key decisions:**
- `Article.guid` — RSS deduplication key; prevents duplicate inserts on repeated fetches
- `Category.keywords` — Postgres text array; worker matches against article title/summary
- `Source` rows seeded via Prisma seed script; no admin UI in v1
- `UserPreferences` created eagerly on register with defaults

---

## Section 4: Frontend Architecture

React + FSD. All layer boundaries enforced by `eslint-plugin-boundaries`.

```
apps/web/src/
├── app/
│   ├── providers/         # QueryClient, Router, ThemeProvider, I18nProvider
│   ├── router.tsx         # Route definitions
│   └── styles/            # global CSS + Tailwind base
├── pages/
│   ├── auth/              # /login, /register
│   ├── dashboard/         # / (post-auth landing)
│   ├── news/              # /news?category=
│   ├── bookmarks/         # /bookmarks
│   ├── profile/           # /profile
│   └── settings/          # /settings
├── widgets/
│   ├── sidebar/           # Nav + user info + avatar
│   └── article-list/      # Paginated article grid by category
├── features/
│   ├── auth/              # login-form, register-form, logout-button
│   ├── bookmark-toggle/   # Bookmark button with optimistic update
│   ├── theme-switcher/    # Light/Dark toggle (persisted to API)
│   ├── language-switcher/ # EN/RU selector (persisted to API)
│   └── profile-form/      # Edit name, avatar URL, change password
├── entities/
│   ├── article/           # ArticleCard, article types, article API
│   ├── category/          # CategoryTab, category types, category API
│   └── user/              # UserAvatar, user types, user API
└── shared/
    ├── ui/                # Button, Input, Card, Spinner, Modal — design system
    ├── api/               # Axios instance + interceptors (token refresh)
    ├── i18n/              # react-i18next setup + en.json + ru.json
    ├── hooks/             # useAuth, useTheme
    └── lib/               # cn() utility, date formatters
```

### Routing

React Router v6. `<AuthGuard>` wraps all protected routes. A layout route wraps authenticated pages with the sidebar shell.

### State

| Concern | Tool |
|---|---|
| Server state | TanStack Query |
| Auth (token, user) | Zustand (persisted to localStorage) |
| Theme / language | Derived from UserPreferences, synced to API on change |

### i18n

`react-i18next` with `en.json` / `ru.json` under `shared/i18n/locales/`. Detection order: user preference from API → localStorage → browser default. Adding a new language requires only a new JSON file + registration in i18n config.

### Theme

Tailwind CSS `darkMode: 'class'`. ThemeProvider toggles `<html class="dark">`. All components use `dark:` variants. Theme persisted in `UserPreferences`.

---

## Section 5: Authentication Flow

**Register:** `POST /auth/register` → creates User + UserPreferences → returns access token + sets refresh token httpOnly cookie.

**Login:** `POST /auth/login` → validates credentials → returns access token + sets refresh token httpOnly cookie.

**Token refresh:** Axios response interceptor catches 401 → calls `POST /auth/refresh` with cookie → receives new access token → retries original request transparently. On refresh failure → logout + redirect `/login`.

**Logout:** `DELETE /auth/logout` → deletes refresh token from DB → clears cookie → clears Zustand auth state.

**Route protection:** `<AuthGuard>` checks Zustand auth store. No token → redirect `/login`. On app boot with token in store but no user loaded → fetch `/users/me` to rehydrate (handles page refresh).

---

## Section 6: Testing Strategy

### Backend (Vitest)

- **Unit:** domain logic — categorization rules, password policy, token expiry
- **Integration:** each use-case against real Postgres via Testcontainers — register, login, refresh, article listing, bookmark toggle

### Frontend (Vitest + RTL + MSW)

- **Unit:** entity components (ArticleCard renders correctly), feature form validation states
- **Integration:** full page flows with MSW — login flow, category browsing, bookmark toggle, settings persistence
- **Auth interceptor:** 401 → refresh → retry behavior via MSW

### CI (GitHub Actions)

Pipeline: `lint` → `typecheck` → `test:unit` → `test:integration` (Postgres service container). Turborepo caches all tasks — only affected packages re-run on PR.

---

## Tech Stack Reference

| Area | Choice |
|---|---|
| Language | TypeScript (full-stack) |
| Runtime | Node.js 24 LTS |
| Frontend framework | React + FSD |
| Routing | React Router v6 |
| State | Zustand + TanStack Query |
| Styling | Tailwind CSS |
| Build | Vite |
| i18n | react-i18next |
| Backend framework | Fastify |
| BE architecture | Hexagonal + modular monolith |
| ORM | Prisma |
| Database | PostgreSQL |
| Validation | Zod (shared contracts) |
| Monorepo | pnpm workspaces + Turborepo |
| Linting | ESLint flat config + eslint-plugin-boundaries |
| Formatting | Prettier + Tailwind class sorting |
| FE tests | Vitest + RTL + MSW |
| BE tests | Vitest + Testcontainers |
| CI | GitHub Actions |
| Deployment | Railway |
