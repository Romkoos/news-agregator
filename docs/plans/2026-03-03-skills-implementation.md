# News Aggregator Skills Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create 26 Claude Code skill files (SKILL.md) for all catalog entries in docs/project-overview.md, packaged as a local project plugin.

**Architecture:** A minimal Claude Code plugin at `.claude/plugins/news-agregator-skills/` wrapping 26 skills organized by domain (BE/FE/INF). Each skill has a SKILL.md with trigger phrases, workflow steps, and a reference to the project overview for code templates.

**Tech Stack:** Markdown, YAML frontmatter, Claude Code plugin system

---

## Task 1: Bootstrap plugin structure

**Files:**
- Create: `.claude/plugins/news-agregator-skills/.claude-plugin/plugin.json`
- Modify: `.claude/settings.local.json`

**Step 1: Create plugin.json**

```json
{
  "name": "news-agregator-skills",
  "version": "0.1.0",
  "description": "Project-specific dev skills for the news aggregator monorepo (FSD frontend + hexagonal backend)"
}
```

**Step 2: Update settings.local.json**

```json
{
  "enabledPlugins": {
    "superpowers@claude-plugins-official": true,
    "news-agregator-skills": true
  }
}
```

**Step 3: Validate plugin.json has required fields**

Run: `grep -c '"name"' .claude/plugins/news-agregator-skills/.claude-plugin/plugin.json`
Expected: `1`

**Step 4: Commit**

```bash
git add .claude/plugins/news-agregator-skills/.claude-plugin/plugin.json .claude/settings.local.json
git commit -m "feat: bootstrap news-agregator-skills plugin"
```

---

## Task 2: BE-01 — scaffold-module

**Files:**
- Create: `.claude/plugins/news-agregator-skills/skills/be-01-scaffold-module/SKILL.md`

**Step 1: Write the file**

```markdown
---
name: be-01-scaffold-module
description: This skill should be used when the user asks to "scaffold a backend module", "create a hexagonal module", "add a bounded context", "generate a new BE module", or "create a module in the modular monolith".
version: 0.1.0
---

# BE-01: Scaffold bounded-context module (hex)

Create a new bounded-context module inside the modular monolith using hexagonal structure: domain, application, ports, adapters, and a public module API.

## Inputs

- `moduleName` (required): kebab-case name (e.g., `billing`, `news-feed`)
- `httpPrefix` (optional): URL prefix for the module's HTTP routes
- `dbSchema` (optional): Postgres schema name for isolation

## Outputs

Creates `apps/backend/src/modules/<moduleName>/` with:

```
<moduleName>/
├── domain/
│   ├── entities/
│   ├── value-objects/
│   └── policies/
├── application/
│   ├── use-cases/
│   ├── orchestration/
│   └── dto/
├── ports/
│   ├── inbound/
│   └── outbound/
├── adapters/
│   ├── http/
│   │   └── router.ts      # Fastify plugin stub
│   └── persistence/
│       └── prisma/
└── index.ts               # public API
```

## Preconditions

- `moduleName` must be unique — `apps/backend/src/modules/<moduleName>/` must not exist
- `moduleName` must be kebab-case (lowercase, hyphens only)
- Path aliases configured in `tsconfig.json`

## Workflow

1. Verify `moduleName` is kebab-case and the directory does not already exist
2. Create all directories per the tree above
3. Create `adapters/http/router.ts` with a Fastify plugin stub that exports `async function register(app: FastifyInstance)`
4. Create `index.ts` as the public API with placeholder re-export comments
5. Register the module router in `apps/backend/src/app/modules.ts`
6. Run `pnpm -C apps/backend lint` — verify no boundary violations

## Error conditions

- `E_MODULE_EXISTS`: Directory already exists → report the path, ask user to confirm overwrite
- `E_INVALID_NAME`: Name contains uppercase or spaces → suggest kebab-case correction

## Reference

See `docs/project-overview.md` → "BE-01 — Scaffold bounded-context module (hex)" for full spec and "Backend: Packages, Configs, Folders" for the target directory layout.
```

**Step 2: Validate frontmatter**

Run: `grep -c "^name:" .claude/plugins/news-agregator-skills/skills/be-01-scaffold-module/SKILL.md`
Expected: `1`

**Step 3: Commit**

```bash
git add .claude/plugins/news-agregator-skills/skills/be-01-scaffold-module/SKILL.md
git commit -m "feat(skills): add BE-01 scaffold-module skill"
```

---

## Task 3: BE-02 through BE-05 (use-case, endpoint, repo, prisma)

**Files:**
- Create: `.claude/plugins/news-agregator-skills/skills/be-02-add-usecase/SKILL.md`
- Create: `.claude/plugins/news-agregator-skills/skills/be-03-http-endpoint/SKILL.md`
- Create: `.claude/plugins/news-agregator-skills/skills/be-04-repo-port/SKILL.md`
- Create: `.claude/plugins/news-agregator-skills/skills/be-05-prisma-model/SKILL.md`

**Step 1: Write be-02-add-usecase/SKILL.md**

```markdown
---
name: be-02-add-usecase
description: This skill should be used when the user asks to "add a use-case", "create a use case", "add an application service", "add orchestration skeleton", or "scaffold a use-case in a module".
version: 0.1.0
---

# BE-02: Add use-case + orchestration skeleton

Add an application use-case class and orchestration service that coordinates domain operations and outbound ports. Keeps business logic separate from HTTP and database concerns.

## Inputs

- `moduleName` (required): existing module name (must exist, see BE-01)
- `useCaseName` (required): PascalCase name (e.g., `CreateArticle`, `PublishFeed`)
- `commandShape` (required): input DTO fields (e.g., `{title: string, url: string}`)
- `resultShape` (required): output DTO fields (e.g., `{articleId: string}`)

## Outputs

Creates inside `apps/backend/src/modules/<moduleName>/`:

- `application/use-cases/<use-case-name>.usecase.ts` — class with `execute(input): Promise<Result>`
- `application/dto/<use-case-name>.dto.ts` — Zod schema + inferred TS type for input/output
- `ports/outbound/<repo-name>.ts` — outbound port interface stub (if new entity implied)
- Wires use-case in `index.ts` public API

## Preconditions

- Module already exists (run BE-01 first)
- `useCaseName` must be PascalCase

## Workflow

1. Verify module directory exists at `apps/backend/src/modules/<moduleName>/`
2. Create `application/dto/<use-case-name>.dto.ts` with Zod input/output schemas and inferred types
3. Create `application/use-cases/<use-case-name>.usecase.ts` with class, constructor injection of repository port, and `execute` method skeleton
4. Create or update port stub in `ports/outbound/` if a new repository is implied
5. Export use-case class from `index.ts`
6. Run `pnpm -C apps/backend typecheck`

## Error conditions

- `E_MODULE_NOT_FOUND`: Module directory missing → run BE-01 first
- `E_USECASE_EXISTS`: File already exists → ask to overwrite or rename

## Reference

See `docs/project-overview.md` → "BE-02 — Add use-case + orchestration skeleton" and the `CreateInvoiceUseCase` template for the exact file structure and Zod pattern.
```

**Step 2: Write be-03-http-endpoint/SKILL.md**

```markdown
---
name: be-03-http-endpoint
description: This skill should be used when the user asks to "add an HTTP endpoint", "create a Fastify route", "add an API route", "scaffold a route handler", or "create a REST endpoint" in the backend.
version: 0.1.0
---

# BE-03: Add HTTP endpoint (Fastify) + schemas

Create an inbound adapter (Fastify route) with JSON Schema validation and connect it to an existing use-case.

## Inputs

- `moduleName` (required): existing module name
- `method` (required): HTTP method (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`)
- `path` (required): route path (e.g., `/articles/:id`)
- `requestSchema` (required): JSON Schema object for the request body/params
- `responseSchema` (required): JSON Schema object for the success response
- `useCaseName` (required): existing use-case to call

## Outputs

Creates/modifies inside `apps/backend/src/modules/<moduleName>/adapters/http/`:

- `schemas/<route-name>.schema.ts` — JSON Schema objects for request and response
- `handlers/<route-name>.handler.ts` — Fastify route handler calling the use-case
- Updates `router.ts` to register the new route with its schema

## Preconditions

- Module exists (BE-01)
- Use-case exists (BE-02)
- Fastify instance configured in `apps/backend/src/app/http.ts`

## Workflow

1. Verify module and use-case exist
2. Create `schemas/<route-name>.schema.ts` with typed JSON Schema for request and response
3. Create `handlers/<route-name>.handler.ts` that instantiates the use-case and maps HTTP ↔ application DTOs
4. Register the route in `router.ts`: `app.route({ method, url, schema, handler })`
5. Run `pnpm -C apps/backend typecheck` to verify schema types

## Error conditions

- `E_ROUTE_CONFLICT`: Route method+path combination already registered → report conflict
- `E_SCHEMA_INVALID`: Schema cannot be serialized by Fastify → validate JSON Schema structure

## Reference

See `docs/project-overview.md` → "BE-03 — Add HTTP endpoint (Fastify) + schemas" for the schema-based approach pattern.
```

**Step 3: Write be-04-repo-port/SKILL.md**

```markdown
---
name: be-04-repo-port
description: This skill should be used when the user asks to "add a repository port", "create a Prisma adapter", "add an outbound port", "add a database repository", or "scaffold a repository interface".
version: 0.1.0
---

# BE-04: Add repository port + Prisma adapter

Declare an outbound repository port (interface) and implement a Prisma adapter with domain↔DB mapping.

## Inputs

- `moduleName` (required): existing module name
- `repoName` (required): PascalCase (e.g., `ArticleRepository`)
- `entityName` (required): domain entity name (e.g., `Article`)
- `operations` (required): array of method signatures (e.g., `create`, `findById`, `list`)

## Outputs

Creates inside `apps/backend/src/modules/<moduleName>/`:

- `ports/outbound/<repo-name>.ts` — TypeScript interface with the declared operations
- `adapters/persistence/prisma/<repo-name>.prisma.ts` — Prisma implementation of the interface
- `adapters/persistence/prisma/<entity-name>.mapper.ts` — domain ↔ Prisma model mapper

## Preconditions

- Module exists (BE-01)
- Prisma client configured (`apps/backend/prisma/schema.prisma` exists)
- The Prisma model for `entityName` exists in `schema.prisma`

## Workflow

1. Verify module and Prisma model exist
2. Create `ports/outbound/<repo-name>.ts` with the TypeScript interface (async methods)
3. Create `adapters/persistence/prisma/<entity-name>.mapper.ts` converting Prisma model ↔ domain entity
4. Create `adapters/persistence/prisma/<repo-name>.prisma.ts` implementing the port interface using `PrismaClient`
5. Export the port interface from `index.ts`
6. Run `pnpm -C apps/backend typecheck`

## Error conditions

- `E_PRISMA_CLIENT_MISSING`: `@prisma/client` not installed or not generated → run `pnpm prisma generate`
- `E_PORT_EXISTS`: Port interface file already exists → ask to extend or overwrite

## Reference

See `docs/project-overview.md` → "BE-04 — Add repository port + Prisma adapter" for the port/adapter/mapper pattern.
```

**Step 4: Write be-05-prisma-model/SKILL.md**

```markdown
---
name: be-05-prisma-model
description: This skill should be used when the user asks to "add a Prisma model", "create a database model", "add a model and migration", "scaffold a Prisma schema model", or "create a new migration".
version: 0.1.0
---

# BE-05: Prisma model + migration workflow

Add a model to `schema.prisma`, create a named migration, and document dev vs production migration commands.

## Inputs

- `modelName` (required): PascalCase Prisma model name (e.g., `Article`)
- `fields` (required): array of `{name, type, modifiers?}` (e.g., `{name: "id", type: "String", modifiers: "@id @default(cuid())"}`)
- `relations` (optional): array of relation fields

## Outputs

Modifies/creates:

- `apps/backend/prisma/schema.prisma` — new model block added
- `apps/backend/prisma/migrations/<timestamp>_<name>/migration.sql` — generated by Prisma
- Updates `apps/backend/package.json` `postinstall` to include `prisma generate` if not present

## Preconditions

- `DATABASE_URL` env var is set and dev database is accessible
- `apps/backend/prisma/schema.prisma` exists

## Workflow

1. Add the model block to `apps/backend/prisma/schema.prisma` with all fields and relations
2. Run `pnpm -C apps/backend prisma migrate dev --name <snake_case_model_name>` to generate and apply the migration
3. Verify `prisma generate` runs and client is updated
4. Confirm `postinstall` script includes `prisma generate`

## Commands reference

```bash
# Development — creates migration + applies
pnpm -C apps/backend prisma migrate dev --name add_article

# Production/CI — applies pending migrations only
pnpm -C apps/backend prisma migrate deploy
```

## Error conditions

- `E_MIGRATION_CONFLICT`: History divergence → run `prisma migrate reset` in dev (data loss warning)
- `E_DB_CONNECTION`: DATABASE_URL unreachable → verify Docker is running and .env is loaded

## Reference

See `docs/project-overview.md` → "BE-05 — Prisma model + migration workflow" and the `Invoice` model example.
```

**Step 5: Validate all 4 files have frontmatter**

Run: `for f in be-02-add-usecase be-03-http-endpoint be-04-repo-port be-05-prisma-model; do grep -c "^name:" .claude/plugins/news-agregator-skills/skills/$f/SKILL.md; done`
Expected: `1` four times

**Step 6: Commit**

```bash
git add .claude/plugins/news-agregator-skills/skills/be-02-add-usecase/SKILL.md \
  .claude/plugins/news-agregator-skills/skills/be-03-http-endpoint/SKILL.md \
  .claude/plugins/news-agregator-skills/skills/be-04-repo-port/SKILL.md \
  .claude/plugins/news-agregator-skills/skills/be-05-prisma-model/SKILL.md
git commit -m "feat(skills): add BE-02 through BE-05 skills"
```

---

## Task 4: BE-06 through BE-10 (errors, tests, refactor, contracts)

**Files:**
- Create: `.claude/plugins/news-agregator-skills/skills/be-06-error-taxonomy/SKILL.md`
- Create: `.claude/plugins/news-agregator-skills/skills/be-07-unit-tests/SKILL.md`
- Create: `.claude/plugins/news-agregator-skills/skills/be-08-integration-tests/SKILL.md`
- Create: `.claude/plugins/news-agregator-skills/skills/be-09-refactor-module/SKILL.md`
- Create: `.claude/plugins/news-agregator-skills/skills/be-10-shared-contracts/SKILL.md`

**Step 1: Write be-06-error-taxonomy/SKILL.md**

```markdown
---
name: be-06-error-taxonomy
description: This skill should be used when the user asks to "add an error taxonomy", "create domain error types", "add HTTP error mapping", "define module errors", or "add error catalog to a module".
version: 0.1.0
---

# BE-06: Error taxonomy + HTTP mapping

Create a unified catalog of domain/application errors for a module and map them to HTTP responses.

## Inputs

- `moduleName` (required): existing module name
- `errors` (required): array of `{code, httpStatus, messageTemplate}` (e.g., `{code: "ARTICLE_NOT_FOUND", httpStatus: 404, messageTemplate: "Article {id} not found"}`)

## Outputs

Creates inside `apps/backend/src/modules/<moduleName>/`:

- `domain/errors.ts` — typed error classes keyed by code
- `adapters/http/error-mapper.ts` — maps domain errors to Fastify HTTP responses with status codes

## Preconditions

- Module exists (BE-01)
- Error code format: `SCREAMING_SNAKE_CASE`

## Workflow

1. Create `domain/errors.ts` with a base `DomainError` class and one exported class per error code
2. Create `adapters/http/error-mapper.ts` that catches `DomainError` and sets the correct HTTP status + body
3. Register the error mapper as a Fastify error handler in `adapters/http/router.ts`
4. Export error classes from `index.ts`
5. Run `pnpm -C apps/backend typecheck`

## Error conditions

- `E_DUPLICATE_ERROR_CODE`: Same code used twice → list duplicates and ask to consolidate

## Reference

See `docs/project-overview.md` → "BE-06 — Error taxonomy + HTTP mapping".
```

**Step 2: Write be-07-unit-tests/SKILL.md**

```markdown
---
name: be-07-unit-tests
description: This skill should be used when the user asks to "add unit tests for domain", "generate unit tests for a use-case", "test a use-case with Vitest", "scaffold backend unit tests", or "add tests for the application layer".
version: 0.1.0
---

# BE-07: Unit tests for Domain/Application (Vitest)

Scaffold Vitest unit tests for domain entities/policies and application use-cases. Tests must run without a database or HTTP server — use in-memory mocks for ports.

## Inputs

- `moduleName` (required): existing module name
- `target` (required): `'domain'` or `'application'`
- `subjectName` (required): class/function to test (e.g., `CreateArticleUseCase`, `ArticlePolicy`)

## Outputs

Creates:

- `apps/backend/src/modules/<moduleName>/<target>/<subject-name>.test.ts` — test file with at least one happy-path and one edge-case

## Preconditions

- Subject file exists
- Vitest configured in `apps/backend/vitest.config.ts`

## Workflow

1. Locate the subject file at `apps/backend/src/modules/<moduleName>/<target>/...`
2. Create `<subject-name>.test.ts` adjacent to the implementation file
3. Write tests using Vitest `describe/it/expect`; mock all outbound ports with plain objects
4. Include at minimum: one happy-path test, one validation error test
5. Run `pnpm -C apps/backend test` to verify tests pass

## Test pattern

```ts
import { describe, it, expect } from 'vitest';
import { SubjectUseCase } from './subject.usecase';

describe('SubjectUseCase', () => {
  const mockRepo = {
    create: async (data: any) => ({ id: 'id_1', ...data }),
  };

  it('happy path: [describe expected outcome]', async () => {
    const uc = new SubjectUseCase(mockRepo as any);
    const result = await uc.execute({ /* valid input */ });
    expect(result).toMatchObject({ /* expected output */ });
  });

  it('edge case: throws on invalid input', async () => {
    const uc = new SubjectUseCase(mockRepo as any);
    await expect(uc.execute({ /* invalid input */ })).rejects.toThrow();
  });
});
```

## Error conditions

- `E_SUBJECT_NOT_FOUND`: Subject file does not exist → run BE-02 first

## Reference

See `docs/project-overview.md` → "BE-07 — Unit tests for Domain/Application" and the `CreateInvoiceUseCase` test template.
```

**Step 3: Write be-08-integration-tests/SKILL.md**

```markdown
---
name: be-08-integration-tests
description: This skill should be used when the user asks to "add integration tests", "add Testcontainers tests", "test with a real database", "add integration test suite with Postgres", or "test repository with real DB".
version: 0.1.0
---

# BE-08: Integration tests with Postgres (Testcontainers)

Create a Vitest integration test suite that spins up a real Postgres container via Testcontainers, applies migrations, and tests repository adapters or HTTP endpoints end-to-end.

## Inputs

- `moduleName` (required): existing module name
- `suiteName` (required): name for the test suite (e.g., `article-repository`)
- `migrationCommand` (optional): defaults to `pnpm -C apps/backend prisma migrate deploy`

## Outputs

Creates:

- `apps/backend/test/integration/<suite-name>.test.ts` — test file with container lifecycle

## Preconditions

- Docker Engine is running locally and in CI
- `@testcontainers/postgresql` installed in `apps/backend`
- Vitest integration config exists (or create `vitest.integration.config.ts`)

## Workflow

1. Install `@testcontainers/postgresql` if not present: `pnpm -C apps/backend add -D @testcontainers/postgresql`
2. Create `apps/backend/test/integration/<suite-name>.test.ts` with `beforeAll` starting the container and setting `DATABASE_URL`
3. Apply migrations in `beforeAll` using the migration command
4. Write tests using a real `PrismaClient` (no mocks)
5. Disconnect Prisma and stop container in `afterAll`
6. Run `pnpm -C apps/backend test:integration`

## Container lifecycle pattern

```ts
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'node:child_process';

let container: Awaited<ReturnType<typeof new PostgreSqlContainer().start>>;
let prisma: PrismaClient;

beforeAll(async () => {
  container = await new PostgreSqlContainer().start();
  process.env.DATABASE_URL = container.getConnectionUri();
  prisma = new PrismaClient();
  execSync('pnpm -C apps/backend prisma migrate deploy');
}, 60_000);

afterAll(async () => {
  await prisma?.$disconnect();
  await container?.stop();
});
```

## Error conditions

- `E_DOCKER_UNAVAILABLE`: Docker not running → verify with `docker ps`
- `E_DB_BOOT_TIMEOUT`: Container takes >60s → increase `beforeAll` timeout

## Reference

See `docs/project-overview.md` → "BE-08 — Integration tests with Postgres (Testcontainers)".
```

**Step 4: Write be-09-refactor-module/SKILL.md**

```markdown
---
name: be-09-refactor-module
description: This skill should be used when the user asks to "move code to a module", "refactor to a bounded context", "update a module's public API", "fix module boundaries", or "extract logic into a separate module".
version: 0.1.0
---

# BE-09: Refactor — move code to module + update public API

Move files to the correct module/layer, update re-exports and imports, and verify no boundary violations are introduced.

## Inputs

- `fromPaths` (required): array of current file paths to move
- `toModuleName` (required): destination module name
- `updateImports` (required): `true` to automatically update import paths

## Outputs

- Files moved to correct locations under `apps/backend/src/modules/<toModuleName>/`
- Updated `index.ts` public API
- All import paths updated across the codebase

## Preconditions

- Destination module exists (BE-01)
- ESLint boundary rules enabled (INF-03) — needed to detect violations

## Workflow

1. For each file in `fromPaths`: determine correct destination layer (domain/application/ports/adapters) based on content
2. Move files using the editor, preserving file history
3. Update all imports referencing moved files — search with `grep -r "from '.*<filename>'"` and update paths
4. Update `index.ts` public API: remove old exports, add new ones
5. Run `pnpm -C apps/backend typecheck` to find broken imports
6. Run `pnpm -C apps/backend lint` to verify no boundary violations

## Error conditions

- `E_CYCLE_INTRODUCED`: Moving files creates a circular import → report cycle, suggest alternative placement
- `E_BOUNDARY_VIOLATION`: Import crosses forbidden layer boundary → move file to correct layer or route through public API

## Reference

See `docs/project-overview.md` → "BE-09 — Refactor: move code to module + update public API".
```

**Step 5: Write be-10-shared-contracts/SKILL.md**

```markdown
---
name: be-10-shared-contracts
description: This skill should be used when the user asks to "create a shared contract", "add a Zod contract", "share types between frontend and backend", "add a shared schema", or "create a contracts package".
version: 0.1.0
---

# BE-10: Contract types — shared Zod schemas

Create a `packages/contracts` workspace package that holds Zod schemas and inferred TypeScript types shared between frontend and backend, eliminating duplication.

## Inputs

- `contractName` (required): dot-namespaced name (e.g., `Billing.CreateInvoice`, `Feed.GetArticles`)
- `schemas` (optional): `{Input?, Output?, Error?}` — Zod schema shapes for each

## Outputs

Creates/modifies:

- `packages/contracts/src/<domain>/<contract-name>.ts` — Zod schemas + inferred types
- `packages/contracts/src/index.ts` — re-exports all contracts
- `packages/contracts/package.json` — workspace package (if not existing)
- Updates `apps/backend/package.json` and `apps/frontend/package.json` to depend on `@contracts/contracts`

## Preconditions

- pnpm workspace configured (`pnpm-workspace.yaml` includes `packages/*`)

## Workflow

1. Create `packages/contracts/` package structure if it doesn't exist (package.json, tsconfig.json, src/index.ts)
2. Create `packages/contracts/src/<domain>/<contract-name>.ts` with Zod Input/Output/Error schemas
3. Export types from `packages/contracts/src/index.ts`
4. Add `"@app/contracts": "workspace:*"` to BE and FE `package.json` dependencies
5. Run `pnpm install` to link the workspace package
6. Import and use in BE use-case DTO and FE API layer

## Error conditions

- `E_CONTRACT_EXISTS`: Contract name already exists → ask to extend or version
- Workspace not configured → add `packages: ["packages/*"]` to `pnpm-workspace.yaml` first

## Reference

See `docs/project-overview.md` → "BE-10 — Contract types: shared Zod schemas" and the monorepo structure section.
```

**Step 6: Validate all 5 files have frontmatter**

Run: `for f in be-06-error-taxonomy be-07-unit-tests be-08-integration-tests be-09-refactor-module be-10-shared-contracts; do grep -c "^name:" .claude/plugins/news-agregator-skills/skills/$f/SKILL.md; done`
Expected: `1` five times

**Step 7: Commit**

```bash
git add .claude/plugins/news-agregator-skills/skills/be-06-error-taxonomy/SKILL.md \
  .claude/plugins/news-agregator-skills/skills/be-07-unit-tests/SKILL.md \
  .claude/plugins/news-agregator-skills/skills/be-08-integration-tests/SKILL.md \
  .claude/plugins/news-agregator-skills/skills/be-09-refactor-module/SKILL.md \
  .claude/plugins/news-agregator-skills/skills/be-10-shared-contracts/SKILL.md
git commit -m "feat(skills): add BE-06 through BE-10 skills"
```

---

## Task 5: FE-01 through FE-04 (FSD slice, feature module, zustand, tanstack)

**Files:**
- Create: `.claude/plugins/news-agregator-skills/skills/fe-01-fsd-slice/SKILL.md`
- Create: `.claude/plugins/news-agregator-skills/skills/fe-02-feature-module/SKILL.md`
- Create: `.claude/plugins/news-agregator-skills/skills/fe-03-zustand-store/SKILL.md`
- Create: `.claude/plugins/news-agregator-skills/skills/fe-04-tanstack-query/SKILL.md`

**Step 1: Write fe-01-fsd-slice/SKILL.md**

```markdown
---
name: fe-01-fsd-slice
description: This skill should be used when the user asks to "scaffold an FSD slice", "create a feature slice", "add a new FSD layer slice", "create an entities slice", "add a pages slice", or "generate an FSD segment".
version: 0.1.0
---

# FE-01: Scaffold FSD slice (entities/features/widgets/pages)

Create a new slice in the specified FSD layer with the required segments and a public API (`index.ts`). Enforces FSD naming and import direction.

## Inputs

- `layer` (required): one of `entities`, `features`, `widgets`, `pages`
- `sliceName` (required): kebab-case business-domain name (e.g., `article`, `auth`, `billing-feed`)
- `segments` (required): subset of `['ui', 'model', 'api', 'lib']`

## Outputs

Creates `apps/frontend/src/<layer>/<sliceName>/`:

```
<sliceName>/
├── ui/           # React components
├── model/        # State, hooks, business logic
├── api/          # Data fetching, API clients
├── lib/          # Utilities, helpers
└── index.ts      # Public API — only export what's needed outside the slice
```

Only segments listed in `segments` input are created.

## Preconditions

- `apps/frontend/src/<layer>/` directory exists
- `sliceName` must be kebab-case

## Workflow

1. Verify `layer` is one of the valid FSD layers
2. Verify slice does not already exist
3. Create the slice directory with only the requested segments
4. Create `index.ts` with a placeholder comment: `// Export public API here`
5. Run `pnpm -C apps/frontend lint` to check boundary rules

## FSD import rules (enforce these)

- Imports must go downward: `pages → widgets → features → entities → shared`
- Never import from a sibling slice's internals — always via `index.ts` public API
- No imports from higher layers

## Error conditions

- `E_SLICE_EXISTS`: Slice directory already exists → ask to extend or skip
- `E_LAYER_INVALID`: Invalid layer name → list valid layers

## Reference

See `docs/project-overview.md` → "FE-01 — Scaffold FSD slice" and "Frontend: FSD Structure" for the directory layout.
```

**Step 2: Write fe-02-feature-module/SKILL.md**

```markdown
---
name: fe-02-feature-module
description: This skill should be used when the user asks to "create a feature module", "add a feature", "scaffold a feature with ui/model/api", "create a feature with store and API", or "add a full FSD feature".
version: 0.1.0
---

# FE-02: Create feature module (ui/model/api) + public API

Create a complete FSD feature slice with a UI component, state/model, API fetching hook, and public API export.

## Inputs

- `featureName` (required): kebab-case path inside features (e.g., `billing/pay-invoice`)
- `uiComponentName` (required): PascalCase component name (e.g., `PayInvoiceButton`)
- `storeShape` (optional): Zustand store state fields
- `apiContract` (optional): contract type from `packages/contracts`

## Outputs

Creates `apps/frontend/src/features/<featureName>/`:

```
<featureName>/
├── ui/
│   └── <component-name>.tsx     # React component
├── model/
│   └── store.ts                 # Zustand store (if storeShape provided)
├── api/
│   └── <feature-name>.ts        # TanStack Query mutation/query
└── index.ts                     # Public API: export component + store hooks
```

## Preconditions

- `apps/frontend/src/features/` directory exists
- TanStack Query `QueryClient` configured in `app/` layer

## Workflow

1. Create all four directories (ui/, model/, api/) plus `index.ts`
2. Create `ui/<component-name>.tsx` — React component with `className` Tailwind props
3. If `storeShape` provided: create `model/store.ts` with Zustand `create()` (see FE-03 for persist variant)
4. Create `api/<feature-name>.ts` with a `useMutation` hook wired to the API contract
5. Export component and store hook from `index.ts`
6. Run `pnpm -C apps/frontend lint`

## Error conditions

- `E_PUBLIC_API_MISSING`: Forgot to add exports to `index.ts` → re-run lint, boundary rules will catch imports bypassing public API

## Reference

See `docs/project-overview.md` → "FE-02 — Create feature module" and the `PayInvoiceButton` template.
```

**Step 3: Write fe-03-zustand-store/SKILL.md**

```markdown
---
name: fe-03-zustand-store
description: This skill should be used when the user asks to "create a Zustand store", "add a store slice", "add a persist store", "scaffold state management", or "add Zustand state with selectors".
version: 0.1.0
---

# FE-03: Zustand store slice + selectors + persist

Create a Zustand store (feature-local or shared) with typed state, actions, selectors, and optional `persist` middleware.

## Inputs

- `storeName` (required): camelCase hook name (e.g., `useAuthStore`, `usePayInvoiceStore`)
- `stateFields` (required): array of `{name, type, defaultValue}` (e.g., `{name: "token", type: "string | null", defaultValue: "null"}`)
- `actions` (required): array of action names (e.g., `setToken`, `clearAuth`)
- `persist` (optional): `{key: string, storage: 'localStorage' | 'sessionStorage'}` — omit to skip persist

## Outputs

Creates inside the slice's `model/` directory:

- `store.ts` — Zustand store with full TypeScript types
- `selectors.ts` — derived selector functions (e.g., `selectIsAuthenticated`)

## Preconditions

- `zustand` installed in `apps/frontend`
- Slice directory exists (FE-01 or FE-02)

## Workflow

1. Create `store.ts` using `create<State>()()` pattern
2. If `persist` provided: wrap with `persist(fn, { name: key })` middleware
3. Create `selectors.ts` with pure functions operating on the store state
4. Export the store hook from the slice's `index.ts`
5. Run `pnpm -C apps/frontend typecheck`

## Store template (with persist)

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type State = {
  // state fields
  // action signatures
};

export const useStoreName = create<State>()(
  persist(
    (set) => ({
      // default values and action implementations
    }),
    { name: 'storage-key' }
  )
);
```

## Error conditions

- `E_PERSIST_KEY_REQUIRED`: `persist.key` missing → Zustand requires a unique storage key

## Reference

See `docs/project-overview.md` → "FE-03 — Zustand store slice" and the `usePayInvoiceStore` template.
```

**Step 4: Write fe-04-tanstack-query/SKILL.md**

```markdown
---
name: fe-04-tanstack-query
description: This skill should be used when the user asks to "add a TanStack Query hook", "scaffold data fetching", "add a useQuery hook", "add React Query hooks", or "add a data fetching layer".
version: 0.1.0
---

# FE-04: Data fetching layer (TanStack Query) scaffold

Create standardized `useQuery`/`useMutation` hooks with query keys and cache invalidation patterns.

## Inputs

- `scope` (required): entity or feature scope (e.g., `billing.invoices`, `feed.articles`)
- `queryName` (required): camelCase operation (e.g., `listArticles`, `getArticle`)
- `keyShape` (required): query key structure (e.g., `['feed', 'articles', { page }]`)
- `fetcherSignature` (required): async fetcher function signature

## Outputs

Creates inside the slice's `api/` directory:

- `queries.ts` — `useQuery`/`useMutation` hooks
- `keys.ts` — query key factory (typed)

## Preconditions

- `@tanstack/react-query` installed
- `QueryClientProvider` configured in `apps/frontend/src/app/providers/`

## Workflow

1. Create `keys.ts` with a typed query key factory object
2. Create `queries.ts` with `useQuery` hooks for read operations and `useMutation` hooks for writes
3. In `useMutation` `onSuccess`: invalidate related queries via `queryClient.invalidateQueries`
4. Export hooks from the slice's `index.ts`
5. Run `pnpm -C apps/frontend typecheck`

## Query key pattern

```ts
// api/keys.ts
export const articleKeys = {
  all: ['articles'] as const,
  list: (params: ListParams) => [...articleKeys.all, 'list', params] as const,
  detail: (id: string) => [...articleKeys.all, 'detail', id] as const,
};
```

## Error conditions

- `E_QUERY_KEY_CONFLICT`: Same key shape used in another query → use scoped prefixes

## Reference

See `docs/project-overview.md` → "FE-04 — Data fetching layer (TanStack Query) scaffold".
```

**Step 5: Validate all 4 files have frontmatter**

Run: `for f in fe-01-fsd-slice fe-02-feature-module fe-03-zustand-store fe-04-tanstack-query; do grep -c "^name:" .claude/plugins/news-agregator-skills/skills/$f/SKILL.md; done`
Expected: `1` four times

**Step 6: Commit**

```bash
git add .claude/plugins/news-agregator-skills/skills/fe-01-fsd-slice/SKILL.md \
  .claude/plugins/news-agregator-skills/skills/fe-02-feature-module/SKILL.md \
  .claude/plugins/news-agregator-skills/skills/fe-03-zustand-store/SKILL.md \
  .claude/plugins/news-agregator-skills/skills/fe-04-tanstack-query/SKILL.md
git commit -m "feat(skills): add FE-01 through FE-04 skills"
```

---

## Task 6: FE-05 through FE-08 (router, RTL tests, MSW, refactor)

**Files:**
- Create: `.claude/plugins/news-agregator-skills/skills/fe-05-react-router/SKILL.md`
- Create: `.claude/plugins/news-agregator-skills/skills/fe-06-unit-tests-rtl/SKILL.md`
- Create: `.claude/plugins/news-agregator-skills/skills/fe-07-msw-mocks/SKILL.md`
- Create: `.claude/plugins/news-agregator-skills/skills/fe-08-refactor-fsd/SKILL.md`

**Step 1: Write fe-05-react-router/SKILL.md**

```markdown
---
name: fe-05-react-router
description: This skill should be used when the user asks to "add a route module", "scaffold a React Router page", "add a page route", "create a page component with routing", or "add a new route to the router".
version: 0.1.0
---

# FE-05: React Router route module scaffold

Add a page slice and wire it into the React Router tree using `createBrowserRouter`.

## Inputs

- `routePath` (required): URL path (e.g., `/feed/articles`, `/billing/invoices/:id`)
- `pageSliceName` (required): kebab-case name (e.g., `feed-articles`, `billing-invoice-detail`)
- `layout` (optional): existing layout component to wrap the page
- `authGuard` (optional): `true` to add an auth redirect check

## Outputs

Creates:

- `apps/frontend/src/pages/<page-slice-name>/ui/page.tsx` — page component
- `apps/frontend/src/pages/<page-slice-name>/index.ts` — public API
- Modifies `apps/frontend/src/app/router.ts` — adds route entry

## Preconditions

- React Router `createBrowserRouter` configured in `apps/frontend/src/app/router.ts`
- Page slice directory exists or will be created

## Workflow

1. Create `pages/<page-slice-name>/` slice (FE-01 with `layer=pages`)
2. Create `pages/<page-slice-name>/ui/page.tsx` with a basic React component
3. Export component from `pages/<page-slice-name>/index.ts`
4. Add route entry in `apps/frontend/src/app/router.ts` referencing the page component
5. If `authGuard`: wrap route with a loader that checks auth state and redirects
6. Run `pnpm -C apps/frontend typecheck`

## Error conditions

- `E_ROUTE_DUPLICATE`: Path already registered → list existing routes and ask for new path

## Reference

See `docs/project-overview.md` → "FE-05 — React Router route module scaffold".
```

**Step 2: Write fe-06-unit-tests-rtl/SKILL.md**

```markdown
---
name: fe-06-unit-tests-rtl
description: This skill should be used when the user asks to "add RTL tests", "add unit tests for a React component", "test a React component with Testing Library", "add Vitest component tests", or "scaffold frontend component tests".
version: 0.1.0
---

# FE-06: Unit tests with RTL (component + hook)

Create Vitest + React Testing Library tests for components and hooks. Test user behavior, not implementation details.

## Inputs

- `componentPath` (required): path to the component or hook file (e.g., `apps/frontend/src/features/billing/pay-invoice/ui/pay-invoice-button.tsx`)
- `scenarios` (required): array of test scenario descriptions (e.g., `"renders button", "disables during loading"`)

## Outputs

Creates `<component-path-without-extension>.test.tsx` adjacent to the component.

## Preconditions

- Vitest configured with `jsdom` environment in `apps/frontend/vitest.config.ts`
- `@testing-library/react` and `@testing-library/user-event` installed

## Workflow

1. Locate the component/hook file
2. Create `.test.tsx` adjacent to it
3. For each scenario: write one `it()` that renders the component, interacts via `userEvent`, and asserts on visible output (text, ARIA roles, states)
4. Wrap with `QueryClientProvider` and other required providers if the component uses TanStack Query or Router
5. Run `pnpm -C apps/frontend test` to verify all pass

## Test principles (enforce these)

- Query by ARIA role or visible text, not test IDs or class names
- Never assert on internal state — only what the user can see
- Use `userEvent.setup()` for interactions (not `fireEvent`)

## Test template

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ComponentName } from './component-name';

describe('ComponentName', () => {
  const qc = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

  it('scenario description', async () => {
    const user = userEvent.setup();
    render(<QueryClientProvider client={qc()}><ComponentName /></QueryClientProvider>);
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /submit/i }));
    // assert outcome
  });
});
```

## Error conditions

- `E_RENDER_FAIL`: Component throws on render → check missing providers, add them in test wrapper
- `E_QUERY_AMBIGUOUS`: Multiple elements match → use `getAllByRole` or add ARIA labels

## Reference

See `docs/project-overview.md` → "FE-06 — Unit tests with RTL" and the `PayInvoiceButton` test template.
```

**Step 3: Write fe-07-msw-mocks/SKILL.md**

```markdown
---
name: fe-07-msw-mocks
description: This skill should be used when the user asks to "add MSW mocks", "scaffold Mock Service Worker handlers", "add API mocks for frontend tests", "add MSW to Vitest setup", or "mock HTTP endpoints in tests".
version: 0.1.0
---

# FE-07: MSW mocks scaffold for frontend tests

Create Mock Service Worker (MSW) handlers for API endpoints used in frontend tests, in Node mode for Vitest.

## Inputs

- `endpoints` (required): array of `{method, path, responseShape}` (e.g., `{method: "GET", path: "/api/articles", responseShape: {articles: []}}`)
- `mode` (required): `'node'` for Vitest (server-side MSW) — use `'browser'` only for manual testing in the browser

## Outputs

Creates/modifies:

- `apps/frontend/src/shared/api/mocks/handlers.ts` — MSW request handlers
- `apps/frontend/src/shared/api/mocks/server.ts` — `setupServer()` export
- Modifies `apps/frontend/src/setupTests.ts` — starts/resets/closes server in Vitest lifecycle hooks

## Preconditions

- `msw` installed in `apps/frontend` (v2+)
- `setupTests.ts` referenced in `vitest.config.ts` `setupFiles`

## Workflow

1. Install MSW if not present: `pnpm -C apps/frontend add -D msw`
2. Create `handlers.ts` with `http.get/post/...` for each endpoint returning `HttpResponse.json(responseShape)`
3. Create `server.ts`: `export const server = setupServer(...handlers)`
4. In `setupTests.ts`: call `server.listen()` before tests, `server.resetHandlers()` after each, `server.close()` after all
5. Run `pnpm -C apps/frontend test` to verify no unhandled requests

## Handler template

```ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/articles', () => {
    return HttpResponse.json({ articles: [] });
  }),
];
```

## Error conditions

- `E_UNHANDLED_REQUEST`: A fetch in tests has no matching handler → add handler or check URL path

## Reference

See `docs/project-overview.md` → "FE-07 — MSW mocks scaffold for frontend tests".
```

**Step 4: Write fe-08-refactor-fsd/SKILL.md**

```markdown
---
name: fe-08-refactor-fsd
description: This skill should be used when the user asks to "split a feature across FSD layers", "refactor FSD slices", "move a component between FSD layers", "fix FSD import violations", or "reorganize FSD feature into entities/features/widgets".
version: 0.1.0
---

# FE-08: Refactor — split feature → entities/features/widgets

Move FSD slice content between layers, respecting the dependency direction and public API boundaries.

## Inputs

- `from` (required): current slice path (e.g., `pages/billing-invoices`)
- `to` (required): target slice path (e.g., `entities/invoice`)
- `updateImports` (required): `true` to update all imports across the codebase

## Outputs

- Files moved to `apps/frontend/src/<to-layer>/<to-slice>/`
- Updated `index.ts` public APIs in both source and destination
- Updated imports in all files that referenced the moved code

## Preconditions

- ESLint FSD boundary rules enabled (INF-03) — needed to confirm fix
- Destination layer exists or will be created

## Workflow

1. Identify what to move: domain-only types → `entities`, user-action logic → `features`, UI composition → `widgets`
2. Create destination slice if it doesn't exist (FE-01)
3. Move files, updating internal imports within the moved files
4. Update all imports across `apps/frontend/src/` that reference the moved paths
5. Update source `index.ts` to remove moved exports; update destination `index.ts` to add them
6. Run `pnpm -C apps/frontend lint` — boundary violations should be zero after refactor
7. Run `pnpm -C apps/frontend typecheck`

## FSD dependency direction (reference)

```
app → pages → widgets → features → entities → shared
```

Moving code downward (e.g., pages → entities) is always safe. Moving upward requires checking all consumers.

## Error conditions

- `E_LAYER_VIOLATION`: A moved file tries to import from a higher layer → move the dependency too, or inject it via props

## Reference

See `docs/project-overview.md` → "FE-08 — Refactor: split feature → entities/features/widgets".
```

**Step 5: Validate all 4 files have frontmatter**

Run: `for f in fe-05-react-router fe-06-unit-tests-rtl fe-07-msw-mocks fe-08-refactor-fsd; do grep -c "^name:" .claude/plugins/news-agregator-skills/skills/$f/SKILL.md; done`
Expected: `1` four times

**Step 6: Commit**

```bash
git add .claude/plugins/news-agregator-skills/skills/fe-05-react-router/SKILL.md \
  .claude/plugins/news-agregator-skills/skills/fe-06-unit-tests-rtl/SKILL.md \
  .claude/plugins/news-agregator-skills/skills/fe-07-msw-mocks/SKILL.md \
  .claude/plugins/news-agregator-skills/skills/fe-08-refactor-fsd/SKILL.md
git commit -m "feat(skills): add FE-05 through FE-08 skills"
```

---

## Task 7: INF-01 through INF-04 (ESLint, Prettier, boundaries, Dockerfile)

**Files:**
- Create: `.claude/plugins/news-agregator-skills/skills/inf-01-eslint/SKILL.md`
- Create: `.claude/plugins/news-agregator-skills/skills/inf-02-prettier/SKILL.md`
- Create: `.claude/plugins/news-agregator-skills/skills/inf-03-boundaries/SKILL.md`
- Create: `.claude/plugins/news-agregator-skills/skills/inf-04-dockerfile/SKILL.md`

**Step 1: Write inf-01-eslint/SKILL.md**

```markdown
---
name: inf-01-eslint
description: This skill should be used when the user asks to "configure ESLint", "add ESLint flat config", "set up TypeScript linting", "add eslint.config.mjs", or "configure monorepo linting".
version: 0.1.0
---

# INF-01: ESLint flat config + TS ESLint recommended

Set up ESLint flat config for the monorepo with TypeScript ESLint recommended rules.

## Inputs

- `scope` (required): `'root'`, `'backend'`, or `'frontend'`
- `typedLinting` (optional): `true` to enable type-aware rules (requires `tsconfig.json` with `projectService`)

## Outputs

Creates/modifies:

- `eslint.config.mjs` (at appropriate scope: root, apps/backend, or apps/frontend)
- `package.json` — adds `"lint": "eslint ."` script

## Preconditions

- `eslint` and `typescript-eslint` installed in scope package

## Workflow

1. Install if not present: `pnpm add -D eslint typescript-eslint @eslint/js`
2. Create `eslint.config.mjs` using flat config format:

```js
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: { projectService: true }  // only if typedLinting: true
    },
    rules: { 'no-console': 'warn' }
  },
  { ignores: ['**/dist/**', '**/.turbo/**', '**/node_modules/**'] }
];
```

3. Add `"lint": "eslint ."` to `package.json` scripts
4. Run `pnpm lint` to verify zero errors on clean codebase

## Error conditions

- `E_ESLINT_CONFIG_INVALID`: Config file has syntax errors → check import paths
- `E_TYPESCRIPT_PROJECT_MISSING`: `typedLinting: true` but no `tsconfig.json` found → create tsconfig first

## Reference

See `docs/project-overview.md` → "INF-01 — ESLint flat config + TS ESLint recommended" for the full config template.
```

**Step 2: Write inf-02-prettier/SKILL.md**

```markdown
---
name: inf-02-prettier
description: This skill should be used when the user asks to "configure Prettier", "add Tailwind class sorting", "set up the code formatter", "add .prettierrc", or "add prettier-plugin-tailwindcss".
version: 0.1.0
---

# INF-02: Prettier config + Tailwind class sorting

Configure Prettier with consistent settings and Tailwind CSS class sorting plugin.

## Inputs

- `printWidth` (optional): defaults to `100`
- `semi` (optional): defaults to `true`
- `singleQuote` (optional): defaults to `true`
- `tailwind` (required): `true` to add `prettier-plugin-tailwindcss`

## Outputs

Creates:

- `.prettierrc` — Prettier configuration
- `.prettierignore` — files to exclude from formatting

Modifies:

- `package.json` — adds `"format": "prettier --write ."` and `"format:check": "prettier --check ."` scripts

## Preconditions

- Prettier v3+ installed

## Workflow

1. Install if not present: `pnpm add -D prettier prettier-plugin-tailwindcss`
2. Create `.prettierrc`:

```json
{
  "printWidth": 100,
  "singleQuote": true,
  "semi": true,
  "trailingComma": "all",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

3. Create `.prettierignore` with `dist/`, `node_modules/`, `.turbo/`
4. Add format scripts to `package.json`
5. Run `pnpm format:check` — should report 0 differences on a fresh codebase

## Error conditions

- `E_PRETTIER_PLUGIN_MISSING`: Plugin not installed → run `pnpm add -D prettier-plugin-tailwindcss`

## Reference

See `docs/project-overview.md` → "INF-02 — Prettier config + Tailwind class sorting".
```

**Step 3: Write inf-03-boundaries/SKILL.md**

```markdown
---
name: inf-03-boundaries
description: This skill should be used when the user asks to "add boundary rules", "configure FSD ESLint rules", "enforce import boundaries", "add eslint-plugin-boundaries", or "set up architecture import enforcement".
version: 0.1.0
---

# INF-03: Boundary rules — FSD + eslint-plugin-boundaries

Enforce FSD layer import rules (frontend) and module boundary rules (backend) via ESLint to prevent architectural drift.

## Inputs

- `fsdLayersConfig` (required): `true` to add FSD layer/public-API rules for `apps/frontend`
- `beModulesConfig` (required): `true` to add module boundary rules for `apps/backend`

## Outputs

Modifies:

- `apps/frontend/eslint.config.mjs` — adds `@feature-sliced/eslint-config` rules
- `apps/backend/eslint.config.mjs` — adds `eslint-plugin-boundaries` element types and allow matrix

## Preconditions

- ESLint flat config already set up (INF-01)
- `@feature-sliced/eslint-config` and `eslint-plugin-boundaries` installed

## Workflow

**Frontend (FSD):**
1. Install: `pnpm -C apps/frontend add -D @feature-sliced/eslint-config`
2. Add FSD rules to `apps/frontend/eslint.config.mjs`:
   - `import-order`: enforces FSD layer import direction
   - `public-api`: forbids importing from slice internals (must use `index.ts`)
   - `layers-slices`: enforces layer hierarchy

**Backend (module boundaries):**
1. Install: `pnpm add -D eslint-plugin-boundaries`
2. Define element types in `eslint.config.mjs` (one per bounded-context module)
3. Add `boundaries/element-types` rule with the allow matrix

3. Run `pnpm lint` on both apps — confirm only real violations appear, not false positives

## Error conditions

- `E_BOUNDARY_RULES_TOO_BROAD`: False positives on `shared/` — add `shared` as an allowed import in all element types

## Reference

See `docs/project-overview.md` → "INF-03 — Boundary rules: FSD + boundaries plugin".
```

**Step 4: Write inf-04-dockerfile/SKILL.md**

```markdown
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
- `apps/<target>/.dockerignore` — excludes node_modules, dist, .env

## Preconditions

- Build script (`pnpm build`) produces output in `dist/`
- Lockfile exists (`pnpm-lock.yaml`)

## Workflow

1. Create `.dockerignore` excluding `node_modules/`, `dist/`, `.env`, `.turbo/`
2. Create `Dockerfile`:

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

3. Build locally to verify: `docker build -f apps/backend/Dockerfile -t app-backend .`
4. Run briefly to verify startup: `docker run --rm -e DATABASE_URL=... -p 3000:3000 app-backend`

## Error conditions

- `E_BUILD_FAIL`: TypeScript build fails in Docker → check tsconfig paths and build output dir
- `E_MISSING_LOCKFILE`: No `pnpm-lock.yaml` found → commit the lockfile before building

## Reference

See `docs/project-overview.md` → "INF-04 — Dockerfile multi-stage" for the full Dockerfile template.
```

**Step 5: Validate all 4 files have frontmatter**

Run: `for f in inf-01-eslint inf-02-prettier inf-03-boundaries inf-04-dockerfile; do grep -c "^name:" .claude/plugins/news-agregator-skills/skills/$f/SKILL.md; done`
Expected: `1` four times

**Step 6: Commit**

```bash
git add .claude/plugins/news-agregator-skills/skills/inf-01-eslint/SKILL.md \
  .claude/plugins/news-agregator-skills/skills/inf-02-prettier/SKILL.md \
  .claude/plugins/news-agregator-skills/skills/inf-03-boundaries/SKILL.md \
  .claude/plugins/news-agregator-skills/skills/inf-04-dockerfile/SKILL.md
git commit -m "feat(skills): add INF-01 through INF-04 skills"
```

---

## Task 8: INF-05 through INF-08 (docker-compose, CI, Railway, Turbo)

**Files:**
- Create: `.claude/plugins/news-agregator-skills/skills/inf-05-docker-compose/SKILL.md`
- Create: `.claude/plugins/news-agregator-skills/skills/inf-06-github-actions/SKILL.md`
- Create: `.claude/plugins/news-agregator-skills/skills/inf-07-railway/SKILL.md`
- Create: `.claude/plugins/news-agregator-skills/skills/inf-08-turbo/SKILL.md`

**Step 1: Write inf-05-docker-compose/SKILL.md**

```markdown
---
name: inf-05-docker-compose
description: This skill should be used when the user asks to "create a docker-compose file", "add a local dev stack", "spin up Postgres locally with Docker", "add development docker-compose", or "compose backend and database".
version: 0.1.0
---

# INF-05: docker-compose dev stack (Postgres + backend)

Create a `docker-compose.yml` for the local development stack with Postgres and the backend service, controlling startup order with healthchecks.

## Inputs

- `services` (required): array of services to include (e.g., `['db', 'backend']`)
- `ports` (optional): port mappings (defaults: Postgres `5432:5432`, backend `3000:3000`)
- `envFiles` (optional): `.env` files to include (defaults to `apps/backend/.env`)

## Outputs

Creates:

- `docker-compose.yml` at the monorepo root
- `apps/backend/.env.example` if no `.env.example` exists

## Preconditions

- Docker Engine and Compose v2 installed (`docker compose version`)

## Workflow

1. Create `docker-compose.yml`:

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
```

2. Run `docker compose up -d db` to verify Postgres starts and passes healthcheck
3. Run `docker compose up backend` to verify backend starts

## Error conditions

- `E_PORT_IN_USE`: Port already bound on host → change the host-side port mapping
- `E_DB_HEALTHCHECK_FAIL`: Postgres does not become healthy → check image pull and disk space

## Reference

See `docs/project-overview.md` → "INF-05 — docker-compose (Postgres + BE) dev stack".
```

**Step 2: Write inf-06-github-actions/SKILL.md**

```markdown
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
- All lint/test scripts working locally

## Workflow

1. Create `.github/` and `.github/workflows/` directories if absent
2. Create `ci.yml`:

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

3. Push to a branch and verify the workflow appears in GitHub Actions and passes

## Error conditions

- `E_DB_CONNECT_CI`: Backend cannot reach Postgres → verify service container port mapping (`localhost:5432` in CI)
- `E_MIGRATIONS_FAIL`: `migrate deploy` fails → ensure all migration files are committed

## Reference

See `docs/project-overview.md` → "INF-06 — GitHub Actions CI" for the full workflow template.
```

**Step 3: Write inf-07-railway/SKILL.md**

```markdown
---
name: inf-07-railway
description: This skill should be used when the user asks to "deploy to Railway", "configure Railway deployment", "set up Railway for the backend", "add railway.toml", or "configure Railway for a monorepo service".
version: 0.1.0
---

# INF-07: Railway deploy — Dockerfile/Start command/Variables

Configure Railway to deploy the backend from the monorepo using the Dockerfile.

## Inputs

- `serviceName` (required): Railway service name (e.g., `news-agregator-backend`)
- `rootDir` (optional): for monorepo — set to `/apps/backend` (Railway root directory setting)
- `startCmd` (required): start command (e.g., `node dist/main.js`)
- `envVars` (required): array of required environment variable names (e.g., `DATABASE_URL`, `PORT`, `NODE_ENV`)

## Outputs

Creates (optional, Railway also accepts manual UI config):

- `apps/backend/railway.toml` — Config-as-Code for Railway

## Railway deployment steps

1. Create Railway project and add service
2. In service Settings → Source: set **Root Directory** to `apps/backend`
3. Railway will auto-detect `Dockerfile` in the root directory and use it for builds
4. In service Settings → Variables: add all env vars from `envVars` input
   - `DATABASE_URL`: Railway Postgres connection string (from Railway Postgres service)
   - `PORT`: Railway sets this automatically; set to `3000` for local clarity
   - `NODE_ENV`: `production`
5. For Prisma migrations: set **Start Command** to `prisma migrate deploy && node dist/main.js`
   OR add a pre-deploy script in railway.toml

## Optional railway.toml

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "prisma migrate deploy && node dist/main.js"
healthcheckPath = "/health"
restartPolicyType = "ON_FAILURE"
```

## Error conditions

- `E_START_CMD_INVALID`: Railway does not accept env var expansion in start command via `$VAR` directly with Dockerfile builder → use a shell entrypoint script instead
- `E_ENV_MISSING`: Build or runtime fails with missing env → check Railway Variables panel

## Reference

See `docs/project-overview.md` → "INF-07 — Railway deploy" for the full deploy flow.
```

**Step 4: Write inf-08-turbo/SKILL.md**

```markdown
---
name: inf-08-turbo
description: This skill should be used when the user asks to "add Turborepo", "configure turbo.json", "set up the monorepo task graph", "add turbo caching", or "configure a Turborepo pipeline".
version: 0.1.0
---

# INF-08: Monorepo task graph (turbo.json)

Configure Turborepo to orchestrate lint/test/build/typecheck tasks across all workspace packages with caching.

## Inputs

- `packages` (required): array of workspace package paths (e.g., `['apps/frontend', 'apps/backend', 'packages/contracts']`)
- `tasks` (required): subset of `['build', 'lint', 'test', 'typecheck']`
- `outputsMap` (required): per-task output globs for cache (e.g., `{build: ['dist/**']}`)

## Outputs

Creates/modifies:

- `turbo.json` — task graph at monorepo root
- `package.json` (root) — adds `turbo` dev dependency and top-level `lint`, `test`, `build`, `typecheck` scripts that delegate to `turbo run <task>`

## Preconditions

- `pnpm-workspace.yaml` exists and includes all packages
- Each package has the requested scripts in its own `package.json`

## Workflow

1. Install Turborepo: `pnpm add -D turbo -w`
2. Create `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "lint": {
      "dependsOn": [],
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "test": {
      "dependsOn": [],
      "outputs": ["coverage/**"]
    }
  }
}
```

3. Update root `package.json` scripts:
   `"lint": "turbo run lint"`, `"test": "turbo run test"`, `"build": "turbo run build"`, `"typecheck": "turbo run typecheck"`
4. Run `pnpm lint` from the root to verify Turborepo orchestrates both apps
5. Run again to verify cache hits (`FULL TURBO`)

## Error conditions

- `E_TASK_CYCLE`: Circular `dependsOn` → remove the cycle; tasks in the same package cannot depend on each other
- `E_OUTPUTS_MISSING`: Cache invalidates on every run → ensure `outputs` glob matches actual build artifacts

## Reference

See `docs/project-overview.md` → "INF-08 — Monorepo task graph (turbo.json)".
```

**Step 5: Validate all 4 files have frontmatter**

Run: `for f in inf-05-docker-compose inf-06-github-actions inf-07-railway inf-08-turbo; do grep -c "^name:" .claude/plugins/news-agregator-skills/skills/$f/SKILL.md; done`
Expected: `1` four times

**Step 6: Commit**

```bash
git add .claude/plugins/news-agregator-skills/skills/inf-05-docker-compose/SKILL.md \
  .claude/plugins/news-agregator-skills/skills/inf-06-github-actions/SKILL.md \
  .claude/plugins/news-agregator-skills/skills/inf-07-railway/SKILL.md \
  .claude/plugins/news-agregator-skills/skills/inf-08-turbo/SKILL.md
git commit -m "feat(skills): add INF-05 through INF-08 skills"
```

---

## Task 9: Final validation

**Goal:** Verify all 26 skills exist, have valid frontmatter, and count matches the catalog.

**Step 1: Count all SKILL.md files**

Run: `find .claude/plugins/news-agregator-skills/skills -name "SKILL.md" | wc -l`
Expected: `26`

**Step 2: Verify all files have `name:` frontmatter**

Run: `grep -rL "^name:" .claude/plugins/news-agregator-skills/skills/*/SKILL.md`
Expected: (empty — no files missing `name:`)

**Step 3: Verify all files have `description:` frontmatter**

Run: `grep -rL "^description:" .claude/plugins/news-agregator-skills/skills/*/SKILL.md`
Expected: (empty)

**Step 4: Verify all files have `## Workflow` section**

Run: `grep -rL "## Workflow" .claude/plugins/news-agregator-skills/skills/*/SKILL.md`
Expected: (empty)

**Step 5: List all skill names for spot-check**

Run: `grep "^name:" .claude/plugins/news-agregator-skills/skills/*/SKILL.md`
Expected: 26 lines, one per skill, all matching the IDs in the design doc

**Step 6: Final commit**

```bash
git add docs/plans/
git commit -m "docs: add skills design doc and implementation plan"
```

---

## Summary

| Task | Skills | Files |
|------|--------|-------|
| 1 | — (plugin bootstrap) | 2 |
| 2 | BE-01 | 1 |
| 3 | BE-02…05 | 4 |
| 4 | BE-06…10 | 5 |
| 5 | FE-01…04 | 4 |
| 6 | FE-05…08 | 4 |
| 7 | INF-01…04 | 4 |
| 8 | INF-05…08 | 4 |
| 9 | — (validation) | 0 |
| **Total** | **26 skills** | **28 files** |
