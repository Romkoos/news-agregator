# Tech Stack

## Language & Runtime
- **TypeScript** (full-stack)
- **Node.js 24 LTS**

## Frontend
- **React** with **Feature-Sliced Design (FSD)** architecture (7 layers: app → pages → widgets → features → entities → shared)
- **React Router** — routing
- **Zustand** — state management
- **TanStack Query** — data fetching
- **Tailwind CSS** — styling
- **Vite** — build tool
- **Vitest + Testing Library (RTL)** — unit tests
- **MSW (Mock Service Worker)** — API mocking for tests

## Backend
- **Fastify** — HTTP framework
- **Hexagonal architecture** (ports & adapters) within a **modular monolith**
- **Prisma** — ORM + migrations
- **PostgreSQL** — database
- **Zod** — schema validation + shared contracts between FE/BE
- **Vitest** — unit tests
- **Testcontainers** — integration tests with real Postgres

## Monorepo & Infrastructure
- **pnpm workspaces** — package manager / monorepo
- **Turborepo** — task orchestration (lint/test/build caching)
- **ESLint flat config** + **typescript-eslint** + **eslint-plugin-boundaries** — linting + architecture boundary enforcement
- **Prettier** (with Tailwind class sorting) — formatting
- **Docker / Dockerfile** (multi-stage, BE + FE)
- **docker-compose** — local dev stack
- **GitHub Actions** — CI (lint, typecheck, test + Postgres service)
- **Railway** — deployment platform
