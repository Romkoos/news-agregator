---
name: inf-05-docker-compose
description: This skill should be used when the user asks to "create a docker-compose file", "add a local dev stack", "spin up Postgres locally with Docker", "add development docker-compose", or "compose backend and database".
version: 0.1.0
---

# INF-05: docker-compose dev stack (Postgres + backend)

Create a `docker-compose.yml` for the local development stack with Postgres and the backend service, controlling startup order with healthchecks.

## Inputs

- `services` (required): array of services to include — `'db'` for Postgres, `'backend'` for the backend container
- `ports` (optional): host port overrides (defaults: Postgres `5432`, backend `3000`)
- `envFiles` (optional): `.env` files to mount into the backend container — defaults to `apps/backend/.env`

## Outputs

Creates:

- `docker-compose.yml` at the monorepo root
- `apps/backend/.env.example` if no `.env.example` exists

## Preconditions

- Docker Engine and Compose v2 installed — verify with `docker compose version`

## Workflow

1. Create `docker-compose.yml` at the monorepo root. **Include only the services listed in the `services` input** — omit any service block not in the array. Substitute host-side port numbers from the `ports` input (left side of `"HOST:CONTAINER"`):

```yaml
services:
  # Include this block only if 'db' in services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: app
    ports:
      - "5432:5432"    # replace 5432 with ports.db if provided
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d app"]
      interval: 5s
      timeout: 5s
      retries: 10

  # Include this block only if 'backend' in services:
  backend:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile
    environment:
      DATABASE_URL: postgresql://app:app@db:5432/app
      PORT: "3000"
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "3000:3000"    # replace 3000 with ports.backend if provided
    # Substitute env_file paths from the envFiles input:
    env_file:
      - apps/backend/.env
```

2. Create `apps/backend/.env.example` if it does not already exist:

```
DATABASE_URL=postgresql://app:app@localhost:5432/app
PORT=3000
NODE_ENV=development
```

3. Start the `db` service and verify the healthcheck passes (skip if `'db'` not in services):

```bash
docker compose up -d db
docker compose ps  # expect db status: healthy
```

4. Start the full stack and verify the backend connects:

```bash
docker compose up backend
```

## Error conditions

- `E_PORT_IN_USE`: Port already bound on host → change the host-side port mapping (left side of `"5432:5432"`) in `ports` input or in `docker-compose.yml` directly
- `E_DB_HEALTHCHECK_FAIL`: Postgres does not become healthy → check `docker logs <container>` for errors; verify disk space and Docker memory limits

## Reference

See `docs/project-overview.md` → "INF-05 — docker-compose (Postgres + BE) dev stack".
