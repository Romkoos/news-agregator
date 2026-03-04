---
name: inf-07-railway
description: This skill should be used when the user asks to "deploy to Railway", "configure Railway deployment", "set up Railway for the backend", "add railway.toml", or "configure Railway for a monorepo service".
version: 0.1.0
---

# INF-07: Railway deploy — Dockerfile/Start command/Variables

Configure Railway to deploy the backend from the monorepo using the Dockerfile.

## Inputs

- `serviceName` (required): Railway service name (e.g., `news-agregator-backend`)
- `rootDir` (optional): monorepo subdirectory Railway should treat as the service root — set to `apps/backend` for the backend service
- `startCmd` (required): process start command (e.g., `node dist/main.js` or `prisma migrate deploy && node dist/main.js`)
- `envVars` (required): array of environment variable names that must be set (e.g., `['DATABASE_URL', 'PORT', 'NODE_ENV']`)

## Outputs

Creates (optional — Railway also accepts manual UI config):

- `apps/backend/railway.toml` — Config-as-Code for Railway

## Preconditions

- `apps/backend/Dockerfile` exists (INF-04)
- Repository connected to a Railway project

## Workflow

1. Create a Railway project and add a new service named `<serviceName>` connected to the GitHub repository

2. In service **Settings → Source**: set **Root Directory** to the `rootDir` input value (e.g., `apps/backend`). Railway will detect the `Dockerfile` in that directory automatically.

3. In service **Settings → Variables**: add each variable from the `envVars` input:
   - For each name in `envVars`, create the variable and set its value
   - `DATABASE_URL`: copy from the Railway Postgres service reference (auto-populated when linked)
   - `PORT`: Railway injects this automatically; set explicitly to `3000` for local clarity
   - `NODE_ENV`: `production`

4. Optionally create `apps/backend/railway.toml` to pin config as code. Substitute `startCmd` into `startCommand`:

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "prisma migrate deploy && node dist/main.js"  # replace with startCmd input
healthcheckPath = "/health"
restartPolicyType = "ON_FAILURE"
```

> Note: `dockerfilePath` in `railway.toml` is relative to `rootDir`. If `rootDir` is `apps/backend`, the `Dockerfile` at `apps/backend/Dockerfile` is referenced simply as `"Dockerfile"`.

5. Trigger a deploy (push to the connected branch or click **Deploy** in the Railway dashboard) and monitor build logs

## Error conditions

- `E_START_CMD_INVALID`: Railway does not expand `$VAR` in start commands with Dockerfile builder → use `sh -c 'prisma migrate deploy && node dist/main.js'` as the start command, or use the `railway.toml` `startCommand` field which accepts shell syntax
- `E_ENV_MISSING`: Build or runtime fails with a missing env var → check the Railway **Variables** panel; verify every name in the `envVars` input has a value set

## Reference

See `docs/project-overview.md` → "INF-07 — Railway deploy" for the full deploy flow.
