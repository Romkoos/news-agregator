# News Aggregator — Full Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full-stack news aggregator with JWT auth, RSS feed fetching, category-based article browsing, bookmarks, and user profile/settings — deployed on Railway.

**Architecture:** Pnpm monorepo (Turborepo) with Fastify hexagonal-architecture API, React FSD frontend, Prisma/Postgres database, and a one-shot RSS fetch worker. Shared Zod contracts between FE and BE. All apps deployed as separate Railway services via multi-stage Dockerfiles.

**Tech Stack:** TypeScript · Node 24 · Fastify · Prisma · PostgreSQL · React 18 · FSD · Zustand · TanStack Query · Tailwind CSS · Vite · react-i18next · Vitest · Testcontainers · MSW · pnpm workspaces · Turborepo · GitHub Actions · Railway

---

## Task Index

| Task | Phase | What is built |
|------|-------|---------------|
| 1 | Foundation | Monorepo root (package.json, turbo.json, pnpm-workspace.yaml, .gitignore, .env.example) |
| 2 | Foundation | packages/config — shared TS, ESLint, Prettier configs |
| 3 | Foundation | packages/db — Prisma schema, client factory, seed data |
| 4 | Foundation | packages/contracts — Zod schemas for auth, user, news |
| 5 | Foundation | apps/api — Fastify server foundation + /health endpoint |
| 6 | Backend Auth | Auth domain, ports, RegisterUseCase + unit test |
| 7 | Backend Auth | LoginUseCase + RefreshTokenUseCase + unit tests |
| 8 | Backend Auth | PrismaUserRepository + JwtTokenService adapters |
| 9 | Backend Auth | Auth routes (register, login, refresh, logout) + integration tests |
| 10 | Backend User | User module: getProfile, updateProfile, changePassword routes + integration tests |
| 11 | Backend News | News module: ports, use-cases, Prisma adapters, routes + integration tests |
| 12 | Backend News | Worker app scaffold — package.json, tsconfig, Dockerfile |
| 13 | Backend News | Worker main — RSS fetch, keyword categorizer, DB upsert |
| 14 | Frontend | apps/web — Vite + React + Tailwind + FSD scaffold, routing shell |
| 15 | Frontend | shared/api — Axios instance with auth interceptors |
| 16 | Frontend | shared/i18n — react-i18next with EN/RU locales |
| 17 | Frontend | shared/ui — Button, Input, Card, Spinner + cn() utility |
| 18 | Frontend | entities/user — Zustand auth store, UserAvatar, ApiProvider |
| 19 | Frontend Auth | features/auth — LoginForm, RegisterForm, LogoutButton + auth pages |
| 20 | Frontend Auth | App providers — QueryClient, i18n init, ApiProvider wired |
| 21 | Frontend Shell | widgets/sidebar + AuthGuard + AppLayout route |
| 22 | Frontend Shell | pages/dashboard + all placeholder pages, routing complete |
| 23 | Frontend News | entities/article + entities/category — types, API hooks, ArticleCard, CategoryTab |
| 24 | Frontend News | features/bookmark-toggle — BookmarkButton with optimistic mutation |
| 25 | Frontend News | widgets/article-list — category tabs, paginated article grid |
| 26 | Frontend News | pages/news (full) + pages/bookmarks (full) |
| 27 | Frontend Profile | features/profile-form — ProfileForm, ChangePasswordForm + pages/profile |
| 28 | Frontend Settings | features/theme-switcher + features/language-switcher + pages/settings |
| 29 | Infrastructure | Dockerfiles (api, web, worker) + docker-compose.yml |
| 30 | Infrastructure | GitHub Actions CI (lint, typecheck, test, integration) |

---

## Plan Chunks

All tasks are fully specified in the following chunk files. Execute them in order.

| Chunk | Tasks | File |
|-------|-------|------|
| Phase 1: Foundation | 1–5 | `docs/plans/chunks/chunk-1-foundation.md` |
| Phase 2: Backend Auth & User | 6–10 | `docs/plans/chunks/chunk-2-backend-auth-user.md` |
| Phase 3: Backend News & Worker | 11–13 | `docs/plans/chunks/chunk-3-backend-news-worker.md` |
| Phase 4: Frontend Foundation | 14–18 | `docs/plans/chunks/chunk-4-frontend-foundation.md` |
| Phase 5: Frontend Auth & Shell | 19–22 | `docs/plans/chunks/chunk-5-frontend-auth-layout.md` |
| Phase 6: Frontend News & Bookmarks | 23–26 | `docs/plans/chunks/chunk-6-frontend-news-bookmarks.md` |
| Phase 7: Frontend Profile & Settings | 27–28 | `docs/plans/chunks/chunk-7-frontend-profile-settings.md` |
| Phase 8: Infrastructure | 29–30 | `docs/plans/chunks/chunk-8-infrastructure.md` |

---

## Execution Order Notes

- Tasks 1–5 must be done before anything else — they establish the monorepo workspace all subsequent packages depend on.
- Tasks 6–13 (backend) and Tasks 14–22 (frontend foundation) can be worked in parallel across sessions once Task 5 is complete.
- Tasks 23–28 (frontend features) require Tasks 14–22 to be done first.
- Tasks 29–30 (infra/CI) can be done any time after Tasks 1–5, but are most useful once the full app works end-to-end.

## Validation Notes (post-review corrections applied to chunks)

The following issues were found during plan validation and fixed in the chunk files:

1. **`RegisterUseCase` now creates default `UserPreferences`** (chunk-2) — design requires eager creation on register.
2. **`ApiProvider` retains Axios interceptors** (chunk-5) — the Task 20 rewrite previously dropped them; both concerns are now combined.
3. **`ApiProvider` applies preferences from `/users/me` on boot** (chunk-7) — theme and language from the API now override `localStorage`, per the design's detection-order requirement.
4. **`Spinner` accepts `aria-label` prop** (chunk-4) — typed as `HTMLAttributes<HTMLDivElement>` so all usages in chunks 5, 6, 7 pass TypeScript without error.
5. **`ArticleCard` uses `renderBookmark` render-prop** (chunk-6) — keeps `entities/article` independent of `features/bookmark-toggle` per FSD; no mid-plan refactor needed.
6. **Auth integration test imports `PrismaUserPreferencesRepository`** (chunk-2) — required since `RegisterUseCase` now takes a 4th argument.
7. **`main.ts` composition root passes `prefsRepo` to `RegisterUseCase`** (chunk-3).

Accepted deviations (structural only, functionally correct):
- `infrastructure/prisma.ts` not a separate file — `createPrismaClient()` used directly in `main.ts`.
- `infrastructure/auth-middleware.ts` not a separate file — `fastify.decorate('authenticate', ...)` lives in `server.ts`.
- `PATCH /users/me/preferences` not listed in design doc API table — present in contracts and correctly implemented.
- `shared/hooks/useAuth` and `shared/hooks/useTheme` not planned — Zustand store used directly (acceptable simplification).

---

## Definition of Done

- [ ] `pnpm install` runs without errors at the monorepo root
- [ ] `pnpm lint` passes across all packages
- [ ] `pnpm typecheck` passes across all packages
- [ ] `pnpm test` passes (all unit tests green)
- [ ] `pnpm test:integration` passes (all integration tests green with Testcontainers)
- [ ] `docker compose up --build` starts the full stack with no errors
- [ ] Manual smoke test: register → login → browse news → bookmark article → change theme/language → update profile → logout
- [ ] GitHub Actions CI passes on a push to `main`
