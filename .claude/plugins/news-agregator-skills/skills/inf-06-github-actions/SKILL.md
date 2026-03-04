---
name: inf-06-github-actions
description: This skill should be used when the user asks to "set up CI", "create a GitHub Actions workflow", "add a lint and test pipeline", "add CI/CD with GitHub Actions", or "configure automated testing on pull requests".
version: 0.1.0
---

# INF-06: GitHub Actions CI — lint/typecheck/test + Postgres

Create a GitHub Actions workflow that runs on push/PR: install → lint → typecheck → backend migrations → unit tests.

## Inputs

- `nodeVersion` (optional): defaults to `24`
- `packageManager` (optional): defaults to `pnpm` version `10`
- `withPostgres` (required): `true` to add a Postgres service container for integration tests

## Outputs

Creates:

- `.github/workflows/ci.yml`

## Preconditions

- Repository hosted on GitHub
- All lint/test scripts working locally before enabling CI

## Workflow

1. Create `.github/` and `.github/workflows/` directories if absent

2. Create `.github/workflows/ci.yml`:

```yaml
name: ci
on:
  pull_request:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: app
          POSTGRES_PASSWORD: app
          POSTGRES_DB: app_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd="pg_isready -U app -d app_test"
          --health-interval=5s --health-timeout=5s --health-retries=10
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - name: Backend migrate
        env:
          DATABASE_URL: postgresql://app:app@localhost:5432/app_test
        run: pnpm -C apps/backend prisma migrate deploy
      - run: pnpm test
```

> If `withPostgres: false`, remove the `services:` block entirely and remove the "Backend migrate" step.

3. Push to a branch and verify the workflow appears in GitHub Actions → Actions tab and passes all steps

## Error conditions

- `E_DB_CONNECT_CI`: Backend cannot reach Postgres → verify the service container port mapping is `localhost:5432` (not the container hostname) and that the migration step has `DATABASE_URL` set in its `env:` block
- `E_MIGRATIONS_FAIL`: `migrate deploy` fails in CI → ensure all migration files are committed to version control (no uncommitted schema changes)
- `E_PNPM_CACHE_MISS`: Cache not found on first run → this is expected; subsequent runs will use the pnpm store cache

## Reference

See `docs/project-overview.md` → "INF-06 — GitHub Actions CI" for the full workflow template.
