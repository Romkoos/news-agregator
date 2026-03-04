---
name: inf-07-railway
description: This skill should be used when the user asks to "deploy to Railway", "configure Railway deployment", "set up Railway for the backend", "add railway.toml", or "configure Railway for a monorepo service".
version: 0.1.0
---

# INF-07: Railway deploy — Dockerfile/Start command/Variables

Configure Railway to deploy the backend from the monorepo using the Dockerfile.

## Inputs

- `serviceName` (required): Railway service name (e.g., `news-agregator-backend`)
- `rootDir` (optional): monorepo root directory for the service — set to `apps/backend` (Railway root directory setting)
- `startCmd` (required): start command (e.g., `node dist/main.js`)
- `envVars` (required): array of required environment variable names (e.g., `['DATABASE_URL', 'PORT', 'NODE_ENV']`)

## Outputs

Creates (optional — Railway also accepts manual UI config):

- `apps/backend/railway.toml` — Config-as-Code for Railway

## Preconditions

- `apps/backend/Dockerfile` exists (INF-04)
- Repository connected to a Railway project

## Workflow

1. Create a Railway project and add a new service connected to the GitHub repository

2. In service **Settings → Source**: set **Root Directory** to `apps/backend` (matches `rootDir` input). Railway will detect the `Dockerfile` automatically.

3. In service **Settings → Variables**: add all env vars from the `envVars` input:
   - `DATABASE_URL`: Railway Postgres connection string (copy from the Railway Postgres service)
   - `PORT`: Railway sets this automatically; add explicitly as `3000` for local clarity
   - `NODE_ENV`: `production`

4. For Prisma migrations, set **Start Command** to run migrations before the server starts:

```
prisma migrate deploy && node dist/main.js
```

5. Optionally create `apps/backend/railway.toml` to pin the configuration as code:

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "prisma migrate deploy && node dist/main.js"
healthcheckPath = "/health"
restartPolicyType = "ON_FAILURE"
```

6. Trigger a deploy (push to the connected branch) and monitor the build logs in the Railway dashboard

## Error conditions

- `E_START_CMD_INVALID`: Railway does not expand `$VAR` in start commands with Dockerfile builder → use a shell entrypoint script (e.g., `sh -c 'prisma migrate deploy && node dist/main.js'`) or define variables inline
- `E_ENV_MISSING`: Build or runtime fails with a missing env var → check the Railway **Variables** panel; ensure `DATABASE_URL` was copied from the Postgres service reference, not hardcoded

## Reference

See `docs/project-overview.md` → "INF-07 — Railway deploy" for the full deploy flow.
