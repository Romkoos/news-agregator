---
name: inf-05-docker-compose
description: This skill should be used when the user asks to "create a docker-compose file", "add a local dev stack", "spin up Postgres locally with Docker", "add development docker-compose", or "compose backend and database".
version: 0.1.0
---

# INF-05: docker-compose dev stack (Postgres + backend)

Create a `docker-compose.yml` for the local development stack with Postgres and the backend service, controlling startup order with healthchecks.

## Inputs

- `services` (required): array of services to include (e.g., `['db', 'backend']`)
- `ports` (optional): port mappings — defaults: Postgres `5432:5432`, backend `3000:3000`
- `envFiles` (optional): `.env` files to mount — defaults to `apps/backend/.env`

## Outputs

Creates:

- `docker-compose.yml` at the monorepo root
- `apps/backend/.env.example` if no `.env.example` exists

## Preconditions

- Docker Engine and Compose v2 installed — verify with `docker compose version`

## Workflow

1. Create `docker-compose.yml` at the monorepo root. Include only the services from the `services` input:

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: app
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d app"]
      interval: 5s
      timeout: 5s
      retries: 10

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
      - "3000:3000"
    env_file:
      - apps/backend/.env
```

2. Create `apps/backend/.env.example` if it does not already exist:

```
DATABASE_URL=postgresql://app:app@localhost:5432/app
PORT=3000
NODE_ENV=development
```

3. Start the `db` service first and verify the healthcheck passes:

```bash
docker compose up -d db
docker compose ps  # expect db status: healthy
```

4. Start the full stack and verify the backend connects:

```bash
docker compose up backend
```

## Error conditions

- `E_PORT_IN_USE`: Port already bound on host → change the host-side port mapping (left side of `"5432:5432"`)
- `E_DB_HEALTHCHECK_FAIL`: Postgres does not become healthy → check `docker logs <container>` for errors; verify disk space and Docker memory limits

## Reference

See `docs/project-overview.md` → "INF-05 — docker-compose (Postgres + BE) dev stack".
