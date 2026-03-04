---
name: inf-04-dockerfile
description: This skill should be used when the user asks to "create a Dockerfile", "add a multi-stage Docker build", "containerize the backend", "add a production Docker image", or "create a Dockerfile for Railway".
version: 0.1.0
---

# INF-04: Dockerfile multi-stage (BE/FE)

Create a production-ready multi-stage Dockerfile that compiles TypeScript in a build stage and runs from a minimal Node runtime.

## Inputs

- `target` (required): `'backend'` or `'frontend'`
- `nodeVersion` (optional): defaults to `24`
- `packageManager` (optional): defaults to `pnpm`

## Outputs

Creates:

- `apps/<target>/Dockerfile` — multi-stage build
- `apps/<target>/.dockerignore` — excludes `node_modules`, `dist`, `.env`

## Preconditions

- Build script (`pnpm build`) produces output in `dist/`
- Lockfile exists (`pnpm-lock.yaml`)

## Workflow

1. Create `apps/<target>/.dockerignore`:

```
node_modules/
dist/
.env
.turbo/
*.local
```

2. Create `apps/<target>/Dockerfile` using a two-stage build:

```dockerfile
# Build stage
FROM node:24-slim AS build
WORKDIR /app
RUN corepack enable
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm -C apps/backend build

# Runtime stage
FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/backend/dist ./dist
COPY --from=build /app/apps/backend/package.json ./package.json
RUN corepack enable && pnpm install --prod --frozen-lockfile
CMD ["node", "dist/main.js"]
```

> Replace `apps/backend` with `apps/frontend` if `target: 'frontend'`. For a frontend target, the runtime stage typically serves the `dist/` output via a static file server (e.g., `node dist/server.js` or an nginx image).

> Replace `24` with `nodeVersion` input if provided.

3. Build locally to verify the image compiles successfully:

```bash
docker build -f apps/backend/Dockerfile -t app-backend .
```

4. Run briefly to verify startup and health:

```bash
docker run --rm -e DATABASE_URL=postgresql://... -p 3000:3000 app-backend
```

## Error conditions

- `E_BUILD_FAIL`: TypeScript build fails in the Docker build stage → check tsconfig `outDir` matches the `COPY --from=build` destination path
- `E_MISSING_LOCKFILE`: No `pnpm-lock.yaml` found → commit the lockfile before building (`pnpm install` generates it)
- `E_PROD_INSTALL_FAIL`: `pnpm install --prod` fails in runtime stage → ensure the runtime package.json lists all required production dependencies

## Reference

See `docs/project-overview.md` → "INF-04 — Dockerfile multi-stage" for the full Dockerfile template.
