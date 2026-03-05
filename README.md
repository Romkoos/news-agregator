# News Aggregator

A full-stack news aggregator with RSS feed fetching, bookmarks, and per-user theme/language preferences.

**Stack:** Fastify · Prisma · PostgreSQL · React 18 · TanStack Query · Zustand · Tailwind CSS · pnpm workspaces · Turborepo

---

## Project Structure

```
.
├── apps/
│   ├── api/                  # Fastify REST API
│   ├── web/                  # React SPA (Vite)
│   └── worker-news-fetch/    # One-shot RSS fetch worker
├── packages/
│   ├── config/               # Shared TypeScript / ESLint config
│   ├── contracts/            # Shared Zod schemas and inferred types
│   └── db/                   # Prisma client + migrations + seed
├── docker-compose.yml
└── .github/workflows/ci.yml
```

---

## Running Locally

### Prerequisites

- **Node.js 24+**
- **pnpm 9+** — `npm install -g pnpm`
- **PostgreSQL 16+** running locally, or use Docker (see below)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Copy the example env file for the API and fill in your values:

```bash
cp apps/api/.env.example apps/api/.env
```

`apps/api/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/newsaggregator?schema=public
JWT_SECRET=change-me-in-production
CORS_ORIGIN=http://localhost:5173
PORT=3001
```

The web app reads one variable at build/dev time:

```bash
# apps/web/.env (optional — defaults to http://localhost:3001)
VITE_API_URL=http://localhost:3001
```

### 3. Set up the database

```bash
# Generate the Prisma client
pnpm --filter @repo/db db:generate

# Apply migrations
pnpm --filter @repo/db db:migrate

# (Optional) Seed with sample sources and categories
pnpm --filter @repo/db db:seed
```

### 4. Start the development servers

```bash
# Starts api (port 3001) + web (port 5173) in parallel via Turborepo
pnpm dev
```

Open http://localhost:5173 — register an account and start exploring.

### 5. Run the RSS worker manually

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/newsaggregator?schema=public \
  pnpm --filter worker-news-fetch dev
```

The worker fetches all sources stored in the database and exits. Run it on a schedule (cron / Railway cron) to keep articles fresh.

---

## Running with Docker Compose

The fastest way to run the full stack with no local Postgres setup required.

```bash
docker compose up --build
```

This starts:

| Service  | URL                      | Notes                                  |
|----------|--------------------------|----------------------------------------|
| postgres | localhost:5432           | Data persisted in `postgres_data` volume |
| api      | http://localhost:3001    | Runs migrations on startup             |
| web      | http://localhost:5173    | Served by nginx                        |

The RSS worker is not started by default. Run it once with:

```bash
docker compose --profile worker up worker
```

### Verify everything is healthy

```bash
curl http://localhost:3001/health
# {"status":"ok"}
```

### Stop and clean up

```bash
# Stop containers (keep data)
docker compose down

# Stop and delete the postgres volume (wipe all data)
docker compose down -v
```

---

## Running Tests

```bash
# All unit tests across every package
pnpm test

# Integration tests (requires a running Postgres — uses Testcontainers automatically)
pnpm test:integration

# Tests for a single app
pnpm --filter web vitest run
pnpm --filter api vitest run
```

---

## Other Useful Commands

```bash
# Type-check all packages
pnpm typecheck

# Lint all packages
pnpm lint

# Format all files
pnpm format

# Build all packages for production
pnpm build
```

---

## Deployment (Railway)

Railway can host the API, web, worker, and a managed Postgres database.

### 1. Create a Railway project

Go to [railway.app](https://railway.app) and create a new project.

### 2. Add a Postgres database

In the project dashboard click **+ New → Database → PostgreSQL**. Copy the `DATABASE_URL` from the Variables tab.

### 3. Deploy the API

1. Click **+ New → GitHub Repo** and select this repository.
2. Set **Root Directory** to `.` (repo root) and **Dockerfile Path** to `apps/api/Dockerfile`.
3. Add environment variables:

   | Variable            | Value                          |
   |---------------------|--------------------------------|
   | `DATABASE_URL`      | (from Postgres service)        |
   | `JWT_SECRET`        | (generate a strong secret)     |
   | `CORS_ORIGIN`       | https://your-web-domain.up.railway.app |
   | `PORT`              | `3001`                         |

4. Deploy. Railway builds the multi-stage image and runs `prisma migrate deploy` before starting the server.

### 4. Deploy the web app

1. Click **+ New → GitHub Repo** (same repo, new service).
2. Set **Dockerfile Path** to `apps/web/Dockerfile`.
3. Add build argument:

   | Argument        | Value                              |
   |-----------------|------------------------------------|
   | `VITE_API_URL`  | https://your-api-domain.up.railway.app |

4. Deploy. nginx serves the built SPA on port 80; Railway handles HTTPS.

### 5. Deploy the worker (cron)

1. Click **+ New → GitHub Repo** (same repo, new service).
2. Set **Dockerfile Path** to `apps/worker-news-fetch/Dockerfile`.
3. Add environment variable:

   | Variable       | Value                   |
   |----------------|-------------------------|
   | `DATABASE_URL` | (from Postgres service) |

4. In the service settings set a **Cron Schedule** (e.g. `0 * * * *` to fetch every hour).

---

## CI / CD

GitHub Actions runs on every push and pull request to `main`/`master`:

| Job                | What it does                                           |
|--------------------|--------------------------------------------------------|
| **Lint**           | ESLint across all packages                             |
| **Type-check**     | `tsc --noEmit` across all packages                     |
| **Unit Tests**     | Vitest unit tests for all packages                     |
| **Integration Tests** | Vitest integration tests with a Postgres service container |

Turborepo caches task outputs by content hash — unchanged packages are skipped on subsequent runs.

To enable the optional Turborepo remote cache, set `TURBO_TOKEN` and `TURBO_TEAM` in your repository secrets.

---

## Environment Variable Reference

### `apps/api`

| Variable       | Required | Default                  | Description                  |
|----------------|----------|--------------------------|------------------------------|
| `DATABASE_URL` | yes      | —                        | PostgreSQL connection string |
| `JWT_SECRET`   | yes      | `dev-secret`             | Secret for signing JWTs      |
| `CORS_ORIGIN`  | no       | `http://localhost:5173`  | Allowed CORS origin          |
| `PORT`         | no       | `3001`                   | Port the API listens on      |

### `apps/web`

| Variable        | Required | Default                   | Description              |
|-----------------|----------|---------------------------|--------------------------|
| `VITE_API_URL`  | no       | `http://localhost:3001`   | Base URL for API calls   |

### `apps/worker-news-fetch`

| Variable       | Required | Description                  |
|----------------|----------|------------------------------|
| `DATABASE_URL` | yes      | PostgreSQL connection string |
