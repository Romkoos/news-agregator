---
name: be-08-integration-tests
description: This skill should be used when the user asks to "add integration tests", "add Testcontainers tests", "test with a real database", "add an integration test suite with Postgres", or "test a repository with a real DB".
version: 0.1.0
---

# BE-08: Integration tests with Postgres (Testcontainers)

Create a Vitest integration test suite that spins up a real Postgres container via Testcontainers, applies migrations, and tests repository adapters end-to-end.

## Inputs

- `moduleName` (required): existing module name
- `suiteName` (required): kebab-case name for the test suite (e.g., `article-repository`)
- `migrationCommand` (optional): defaults to `pnpm -C apps/backend prisma migrate deploy`

## Outputs

Creates:

- `apps/backend/test/integration/<suite-name>.test.ts` — test file with container lifecycle

## Preconditions

- Docker Engine is running
- Module and Prisma adapter exist (BE-01, BE-04, BE-05)
- `@testcontainers/postgresql` installed in `apps/backend`

## Workflow

1. Install `@testcontainers/postgresql` if not present:

```bash
pnpm -C apps/backend add -D @testcontainers/postgresql
```

2. Create `apps/backend/test/integration/<suite-name>.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'node:child_process';

let container: StartedPostgreSqlContainer;
let prisma: PrismaClient;

beforeAll(async () => {
  container = await new PostgreSqlContainer().start();
  // Pass the URL directly — setting process.env after module import has no effect
  prisma = new PrismaClient({ datasourceUrl: container.getConnectionUri() });
  execSync('pnpm -C apps/backend prisma migrate deploy', { stdio: 'inherit' });
}, 120_000); // 2 minute timeout for container startup

afterAll(async () => {
  await prisma?.$disconnect();
  await container?.stop();
});

describe('<SuiteName> integration', () => {
  it('can write and read an entity', async () => {
    // TODO: use prisma directly or inject into the Prisma adapter and test through it
    const created = await prisma.<modelName>.create({
      data: {
        // TODO: minimal valid create data
      },
    });
    const found = await prisma.<modelName>.findUnique({ where: { id: created.id } });
    expect(found?.id).toBe(created.id);
  });
});
```

3. Create `apps/backend/vitest.integration.config.ts` if it does not exist:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/integration/**/*.test.ts'],
    testTimeout: 120_000,
  },
});
```

4. Add a `test:integration` script to `apps/backend/package.json` if missing:

```json
"test:integration": "vitest run --config vitest.integration.config.ts"
```

5. Run `pnpm -C apps/backend test:integration` to verify the container starts and tests pass

## Error conditions

- `E_DOCKER_UNAVAILABLE`: Docker not running → run `docker ps` to check; start Docker Desktop
- `E_DB_BOOT_TIMEOUT`: Container takes >120 s → increase `beforeAll` timeout or check Docker resource limits
- `E_MIGRATION_FAIL`: `migrate deploy` fails inside container → ensure all migration files are committed to version control

## Reference

See `docs/project-overview.md` → "BE-08 — Integration tests with Postgres (Testcontainers)".
