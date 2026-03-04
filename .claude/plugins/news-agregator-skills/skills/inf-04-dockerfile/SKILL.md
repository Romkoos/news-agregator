---
name: inf-04-dockerfile
description: This skill should be used when the user asks to "create a Dockerfile", "add a multi-stage Docker build", "containerize the backend", "add a production Docker image", or "create a Dockerfile for Railway".
version: 0.1.0
---

# INF-04: Dockerfile multi-stage (BE/FE)

Create a production-ready multi-stage Dockerfile that compiles TypeScript in a build stage and runs from a minimal Node runtime.

## Inputs

- `target` (required): `'backend'` or `'frontend'` — determines which app directory paths appear in the Dockerfile
- `nodeVersion` (optional): defaults to `24` — substitute into the `FROM node:<nodeVersion>-slim` lines
- `packageManager` (optional): defaults to `pnpm`

## Outputs

Creates:

- `apps/<target>/Dockerfile` — multi-stage build (use `target` value in place of `<target>`)
- `apps/<target>/.dockerignore` — excludes `node_modules`, `dist`, `.env`

## Preconditions

- Build script (`pnpm build`) produces output in `dist/`
- `pnpm-lock.yaml` exists at the monorepo root

## Workflow

1. Create `apps/<target>/.dockerignore` (substitute `target` for `<target>`):

```
node_modules/
dist/
.env
.turbo/
*.local
```

2. Create `apps/<target>/Dockerfile`. Substitute `<target>` with the `target` input value and `24` with `nodeVersion`:

```dockerfile
# Build stage — compiles TypeScript for apps/<target>
FROM node:24-slim AS build
WORKDIR /app
RUN corepack enable
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm -C apps/<target> build

# Runtime stage — copy lockfile + package.json so pnpm install can run
FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /app/apps/<target>/dist ./dist
COPY --from=build /app/apps/<target>/package.json ./package.json
RUN corepack enable && pnpm install --prod --frozen-lockfile
CMD ["node", "dist/main.js"]
```

> For `target: 'frontend'`, the runtime CMD typically serves a static file server rather than `dist/main.js`.

3. Build locally to verify the image compiles successfully:

```bash
docker build -f apps/<target>/Dockerfile -t app-<target> .
```

4. Run briefly to verify startup:

```bash
docker run --rm -e DATABASE_URL=postgresql://... -p 3000:3000 app-<target>
```

## Error conditions

- `E_BUILD_FAIL`: TypeScript build fails in Docker build stage → check that `tsconfig.json` `outDir` is `./dist` and that all path aliases resolve
- `E_MISSING_LOCKFILE`: No `pnpm-lock.yaml` found → run `pnpm install` locally to generate the lockfile, then commit it
- `E_PROD_INSTALL_FAIL`: `pnpm install --prod` fails in runtime stage → verify the runtime `package.json` lists all production dependencies and that `pnpm-lock.yaml` is correctly copied into the stage

## Reference

See `docs/project-overview.md` → "INF-04 — Dockerfile multi-stage" for the full Dockerfile template.
