## Phase 8: Infrastructure — Docker, docker-compose, CI (Tasks 29–30)

---

### Task 29: Docker + docker-compose

**Files:**
- Create: `apps/api/Dockerfile`
- Create: `apps/web/Dockerfile`
- Create: `apps/worker-news-fetch/Dockerfile`
- Create: `docker-compose.yml`

---

No unit test for infrastructure files. Verify by building and running the compose stack locally.

**Step 1: Create `apps/api/Dockerfile`**

Multi-stage build. Stage 1 (`builder`) installs all dependencies and produces the compiled `dist/main.js` bundle using esbuild. Stage 2 (`runner`) is a minimal Node image that only copies the bundle and the generated Prisma client, keeping the final image small. The `prisma migrate deploy` step runs before the server starts, applying any pending migrations in production.

```dockerfile
FROM node:24-alpine AS builder
WORKDIR /app

# Copy workspace manifests and lockfile so pnpm can resolve the graph
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/config/package.json ./packages/config/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/db/package.json ./packages/db/
COPY apps/api/package.json ./apps/api/

RUN corepack enable && pnpm install --frozen-lockfile

# Copy source
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Generate Prisma client
RUN pnpm --filter @repo/db db:generate

# Build API bundle
RUN pnpm --filter api build

FROM node:24-alpine AS runner
WORKDIR /app

# Install only the Prisma CLI for the migration step at startup
RUN corepack enable

COPY --from=builder /app/apps/api/dist/main.js ./main.js
COPY --from=builder /app/packages/db/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

ENV NODE_ENV=production
EXPOSE 3001

# Run migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node main.js"]
```

**Step 2: Create `apps/web/Dockerfile`**

Stage 1 builds the Vite SPA. Stage 2 serves the static output with `nginx:alpine`. The nginx config below forwards all requests to `index.html` so React Router handles client-side navigation.

```dockerfile
FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/config/package.json ./packages/config/
COPY packages/contracts/package.json ./packages/contracts/
COPY apps/web/package.json ./apps/web/

RUN corepack enable && pnpm install --frozen-lockfile

COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

ARG VITE_API_URL=http://localhost:3001
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm --filter web build

FROM nginx:alpine AS runner
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Step 3: Create `apps/web/nginx.conf`**

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  # Serve static assets with long cache
  location ~* \.(js|css|png|jpg|svg|ico|woff2?)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    try_files $uri =404;
  }

  # All other routes → index.html (React Router handles it)
  location / {
    try_files $uri /index.html;
  }
}
```

**Step 4: Create `apps/worker-news-fetch/Dockerfile`**

The worker is a one-shot container: it runs, fetches articles, then exits with code 0. Railway triggers it on a cron schedule.

```dockerfile
FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/config/package.json ./packages/config/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/db/package.json ./packages/db/
COPY apps/worker-news-fetch/package.json ./apps/worker-news-fetch/

RUN corepack enable && pnpm install --frozen-lockfile

COPY packages/ ./packages/
COPY apps/worker-news-fetch/ ./apps/worker-news-fetch/

RUN pnpm --filter @repo/db db:generate
RUN pnpm --filter worker-news-fetch build

FROM node:24-alpine AS runner
WORKDIR /app

COPY --from=builder /app/apps/worker-news-fetch/dist/main.js ./main.js
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

ENV NODE_ENV=production

CMD ["node", "main.js"]
```

**Step 5: Create `docker-compose.yml`**

The compose file wires together Postgres, the API, the web app, and optionally the worker for local development. The `api` service depends on `postgres` and waits for the health check to pass before starting. The `web` service connects to the API through `VITE_API_URL`.

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: newsaggregator
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/newsaggregator?schema=public
      JWT_SECRET: dev-jwt-secret-change-in-prod
      JWT_REFRESH_SECRET: dev-refresh-secret-change-in-prod
      NODE_ENV: development
      PORT: 3001
      CORS_ORIGIN: http://localhost:5173
    ports:
      - '3001:3001'
    depends_on:
      postgres:
        condition: service_healthy

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
      args:
        VITE_API_URL: http://localhost:3001
    ports:
      - '5173:80'
    depends_on:
      - api

  worker:
    build:
      context: .
      dockerfile: apps/worker-news-fetch/Dockerfile
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/newsaggregator?schema=public
    depends_on:
      postgres:
        condition: service_healthy
    profiles:
      - worker  # only runs when: docker compose --profile worker up

volumes:
  postgres_data:
```

> The `worker` service uses the `profiles` key so it does not start automatically with `docker compose up`. Run it explicitly with `docker compose --profile worker up worker` to simulate a cron trigger.

**Step 6: Run to verify**

```bash
docker compose up --build
```

Expected:
- `postgres` starts and becomes healthy.
- `api` starts, runs migrations, logs `Listening on 0.0.0.0:3001`.
- `web` starts, nginx serves on port 80.
- `curl http://localhost:3001/health` returns `{"status":"ok"}`.
- Opening `http://localhost:5173` shows the login page.

**Step 7: Commit**

```bash
git add apps/api/Dockerfile apps/web/Dockerfile apps/web/nginx.conf \
        apps/worker-news-fetch/Dockerfile docker-compose.yml
git commit -m "feat(infra): add multi-stage Dockerfiles and docker-compose for local dev"
```

---

### Task 30: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

---

No unit test for CI config. Verify by pushing a branch and checking the Actions tab.

**Step 1: Create `.github/workflows/ci.yml`**

The pipeline runs four sequential stages: lint → typecheck → test → test:integration. Turborepo caches task outputs by content hash, so unchanged packages skip their steps entirely on subsequent runs. The integration test job spins up a Postgres service container so Testcontainers can connect to it.

```yaml
name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

env:
  # Turborepo remote cache — optional, set in repo secrets if desired
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ secrets.TURBO_TEAM }}

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint

  typecheck:
    name: Type-check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck

  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm test

  test-integration:
    name: Integration Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: newsaggregator_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/newsaggregator_test?schema=public
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @repo/db db:generate
      - run: pnpm test:integration
```

**Step 2: Push to trigger CI**

```bash
git add .github/
git commit -m "feat(ci): add GitHub Actions pipeline (lint, typecheck, test, integration)"
git push origin HEAD
```

Expected: All four jobs pass in the Actions tab. On pull requests, the status checks appear on the PR page.

**Step 3: Verify cache behavior**

Make a trivial change (e.g., add a comment to a single file), push again, and observe in the Actions logs that Turborepo skips unchanged packages with `cache hit` messages.
