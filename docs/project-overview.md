# Skills for AI Assistant and Templates for a Full-Stack TypeScript Project

The previous response contained a plan instead of a report. Below is a complete analytical report with a prioritized skills catalog, architectural diagrams, templates, and configurations.

## Summary

The project is defined as a full-stack TypeScript application where the frontend must follow entity["organization","Feature-Sliced Design","frontend architecture method"] (FSD) with strict import boundaries per layer/slice, and the backend — a modular monolith with orchestration and hexagonal architecture (ports & adapters). The correct "skill set" for an AI assistant in such a project is not "generate any files," but reproducible commands/intents that (a) scaffold module/slice structures according to conventions, (b) automatically maintain public APIs and boundaries, (c) add tests and migrations, (d) update CI/CD and deployment configs. FSD documentation explicitly describes layers and slices as code organization rules/conventions. citeturn6search1turn6search4turn6search0

Key choices that are not fixed in the original requirements but are critical for "skills → templates → CI/CD":
- Test runners: in practice it makes sense to unify "BE+FE unit tests" on entity["organization","Vitest","vite-native test runner"] + entity["organization","Testing Library","user-centric ui testing"] (for FE) and Vitest (for BE). Vitest documents coverage (v8/istanbul) and integration with the Vite pipeline. citeturn8search7turn1search1turn1search7
- HTTP framework on the backend is not specified: for hexagonal architecture a "thin" inbound adapter is convenient; entity["organization","Fastify","node http framework"] bets on a schema-based approach and recommends entity["organization","JSON Schema","schema specification"] for validation/serialization. citeturn9search7turn9search3
- Package manager/monorepo not specified: for full-stack TS it makes sense to use workspaces; entity["organization","pnpm","js package manager"] documents `pnpm-workspace.yaml` as the workspace root. citeturn7search3turn7search0
- Task orchestration (lint/test/build) in a monorepo: entity["organization","Turborepo","js build system"] documents `turbo.json`, caching, and remote caching, which directly increases the "automation potential" of skills (including in CI). citeturn8search5turn8search1turn8search2
- Deploy on entity["company","Railway","deployment platform"]: the platform automatically uses a Dockerfile if one is found, and documents root directory settings for monorepos and start command. citeturn4search6turn7search2turn4search19

Base Node version for infrastructure/CI: according to the official release list, the current Active LTS branch at the report date is v24 (while v25 is Current). citeturn1search0

## Architectural Constraints and Target System Shape

Frontend: FSD defines 7 layers (app, processes, pages, widgets, features, entities, shared) and a semantic hierarchy of responsibilities; the Russian documentation separately fixes "layers" as responsibility levels and "slices" as grouping by domain/product value. citeturn6search4turn6search0turn6search1 Segments within slices in FSD separate code by purpose and have naming conventions for typical "purposes". citeturn6search8

Backend: hexagonal architecture (ports & adapters) is originally described as a requirement to design the application so the core works independently of UI/DB, with specific integrations plugged in as adapters. citeturn0search1turn0search22 A modular monolith in this context is a single deployment, but internally divided into modules with explicit interfaces and boundaries; modular monolith practices are described, in particular, as a set of architectural patterns/organizations supporting fast flow of changes. citeturn5search1turn5search14

Below is the target "dependency map" for FE (FSD) and a typical BE module (hex).

```mermaid
flowchart TB
  subgraph FSD["FE: FSD layers (dependency direction top-down)"]
    app["app"]
    pages["pages"]
    widgets["widgets"]
    features["features"]
    entities["entities"]
    shared["shared"]
    app --> pages --> widgets --> features --> entities --> shared
  end

  subgraph BE["BE: module (hexagonal) inside modular monolith"]
    inbound["Inbound adapters\n(HTTP controllers, CLI jobs)"]
    application["Application\n(use-cases, orchestration)"]
    domain["Domain\n(entities, value objects, policies)"]
    ports["Ports\n(in/out interfaces)"]
    outbound["Outbound adapters\n(Prisma repo, external APIs)"]

    inbound --> application
    application --> domain
    application --> ports
    outbound --> ports
    application --> outbound
  end
```

To prevent skills/generators from breaking the architecture, their contract must include "boundaries" as a verifiable artifact: ESLint rules and/or boundary plugins. FSD provides a separate eslint-config with rules (including public-api/layers-slices). citeturn6search6 For more general enforcement, entity["organization","eslint-plugin-boundaries","eslint architecture boundaries"] can be applied, which is designed to describe element types and allowed connections between them. citeturn9search8turn9search22

## Prioritized Skills Catalog for BE, FE, and Infra

Below is a "complete" skills catalog for the given stack (within a typical lifecycle: generation → implementation → tests → migrations → lint/format → CI → deploy). Prioritization:
P0 — daily/blocking development flow; P1 — significantly accelerate; P2 — situational/scaling.
Automation potential: High/Med/Low — how safely the skill can be automated with templates/codemods.

### Skills Registry (priority and potential)

| ID | Area | Skill (intent/command) | Priority | Automation potential |
|---|---|---|---|---|
| BE‑01 | BE | Scaffold bounded-context module (hex) | P0 | High |
| BE‑02 | BE | Add use-case + orchestration skeleton | P0 | High |
| BE‑03 | BE | Add HTTP endpoint (Fastify) + schemas | P0 | High |
| BE‑04 | BE | Add repository port + Prisma adapter | P0 | High |
| BE‑05 | BE | Prisma model + migration workflow | P0 | High |
| BE‑06 | BE | Error taxonomy + HTTP mapping | P0 | Med |
| BE‑07 | BE | Unit tests for Domain/Application | P0 | Med |
| BE‑08 | BE | Integration tests with Postgres (Testcontainers) | P1 | Med |
| BE‑09 | BE | Refactor: move code to module + update public API | P1 | Med |
| BE‑10 | BE | Contract types: Zod schemas shared | P1 | Med |
| FE‑01 | FE | Scaffold FSD slice (entities/features/widgets/pages) | P0 | High |
| FE‑02 | FE | Create feature module (ui/model/api) + public API | P0 | High |
| FE‑03 | FE | Zustand store slice + selectors + persist | P0 | Med |
| FE‑04 | FE | Data fetching layer (TanStack Query) scaffold | P1 | High |
| FE‑05 | FE | React Router route module scaffold | P1 | High |
| FE‑06 | FE | Unit tests with RTL (component + hook) | P0 | Med |
| FE‑07 | FE | MSW mocks scaffold for frontend tests | P1 | High |
| FE‑08 | FE | Refactor: split feature → entities/features/widgets | P1 | Med |
| INF‑01 | Infra | ESLint flat config + TS ESLint recommended | P0 | High |
| INF‑02 | Infra | Prettier config + Tailwind class sorting | P0 | High |
| INF‑03 | Infra | Boundary rules: FSD + boundaries plugin | P0 | Med |
| INF‑04 | Infra | Dockerfile multi-stage (BE/FE) | P1 | High |
| INF‑05 | Infra | docker-compose (Postgres + BE) dev stack | P1 | High |
| INF‑06 | Infra | GitHub Actions CI: lint/typecheck/test + Postgres | P0 | High |
| INF‑07 | Infra | Railway deploy: Dockerfile/Start command/Variables | P0 | Med |
| INF‑08 | Infra | Monorepo task graph (turbo.json) | P1 | Med |

### Skill Specifications (contracts, errors, examples)

Below are "skill cards" in a unified format. For mapping to templates, a `tools/generators/` folder in the repository is assumed, with commands of the form `pnpm gen <skill> ...`. This approach allows skills to be invoked both from an IDE agent and from CLI/CI.

**BE‑01 — Scaffold bounded-context module (hex)**
Purpose: create a module (bounded context) in the modular monolith using hexagonal structure (domain/application/ports/adapters) and a public module API. citeturn0search1turn5search1
Inputs: `{ moduleName, httpPrefix?, dbSchema? }`
Outputs: module folder/file tree, index re-exports, DI/registration stubs.
Preconditions: unique module name; path aliases configured.
Error handling:
- `E_MODULE_EXISTS` (if module already exists)
- `E_INVALID_NAME` (if name doesn't follow kebab/camel convention)
Example prompt/usage: "Generate a backend module `billing` as a bounded context: domain model, use-cases, ports, HTTP and Prisma adapters. Add public API and route registration."
Template mapping: `tools/generators/be/module-hex/*` → `apps/backend/src/modules/<moduleName>/...`

**BE‑02 — Add use-case + orchestration skeleton**
Purpose: add an application scenario (use-case) and an "orchestrator" (application service) that coordinates domain operations and ports. This corresponds to the idea of separating the core from adapters and concentrating "policies" in the application. citeturn0search1turn0search22
Inputs: `{ moduleName, useCaseName, commandShape, resultShape }`
Outputs: `UseCase`/`Service` class/function, DTO, port interfaces, wiring point.
Preconditions: module already created (BE‑01).
Errors: `E_MODULE_NOT_FOUND`, `E_USECASE_EXISTS`.
Example: "Add use-case `CreateInvoice`: input `{customerId, items[]}`, output `{invoiceId}`; add port `InvoiceRepo` and adapter stub."
Templates: `tools/generators/be/usecase/*`

**BE‑03 — Add HTTP endpoint (Fastify) + schemas**
Purpose: create an inbound adapter (route/controller) with validation and request/response schemas. Fastify recommends a schema-based approach and JSON Schema for validation/serialization. citeturn9search7turn9search3
Inputs: `{ moduleName, method, path, requestSchema, responseSchema, useCaseName }`
Outputs: route file, schema file(s), registration in the module router.
Preconditions: Fastify app/router already exists; use-case exists.
Errors: `E_ROUTE_CONFLICT`, `E_SCHEMA_INVALID`.
Example: "Add POST `/billing/invoices` → `CreateInvoice`. Request/response schemas and error handling."
Templates: `tools/generators/be/http-endpoint-fastify/*`

**BE‑04 — Add repository port + Prisma adapter**
Purpose: declare an outbound port (repository interface) and implement an adapter on Prisma (including domain↔db mapping). Prisma positions Migrate as a generator of SQL migration history and a mechanism for synchronizing the Prisma schema and DB. citeturn0search19turn0search2
Inputs: `{ moduleName, repoName, entityName, operations[] }`
Outputs: `ports/<repo>.ts`, `adapters/persistence/prisma/<repo>.ts`, mappers.
Preconditions: Prisma client configured.
Errors: `E_PRISMA_CLIENT_MISSING`, `E_PORT_EXISTS`.
Example: "Create port `InvoiceRepository` with methods `create/findById/listByCustomer`, and a Prisma adapter."
Templates: `tools/generators/be/repo-prisma/*`

**BE‑05 — Prisma model + migration workflow**
Purpose: add a model to `schema.prisma`, create a migration, and record commands for dev/prod. Prisma Migrate generates a history of `.sql` migrations, and for production recommends `migrate deploy`, explicitly stating that this is usually part of CI/CD. citeturn0search19turn12search17turn0search15
Inputs: `{ modelName, fields[], relations[] }`
Outputs: updated `schema.prisma`, new migration in `prisma/migrations/*`, updated seed (optional).
Preconditions: dev DB accessible; `DATABASE_URL` variable set.
Errors:
- `E_MIGRATION_CONFLICT` (modified migrations/history divergence) — Prisma warns about history checks on `migrate deploy`. citeturn12search17
- `E_DB_CONNECTION`
Example: "Add model `Invoice` and migration; update Prisma Client generation in postinstall."
Templates: `tools/generators/be/prisma-model/*`

**BE‑06 — Error taxonomy + HTTP mapping**
Purpose: a unified catalog of domain/application errors and mapping to HTTP responses (problem+json or agreed format).
Inputs: `{ moduleName, errors[] (code,httpStatus,messageTemplate) }`
Outputs: `errors.ts`, `http/error-mapper.ts`, mapping tests.
Preconditions: unified error format agreed upon.
Errors: `E_DUPLICATE_ERROR_CODE`.
Example: "Add errors `INVOICE_NOT_FOUND`, `CUSTOMER_BLOCKED` and mapping to 404/409."
Templates: `tools/generators/be/errors/*`

**BE‑07 — Unit tests for Domain/Application**
Purpose: unit test scaffold for domain entities/policies and the application/use-case layer. Vitest supports v8/istanbul coverage and is configured through the `test` section. citeturn1search1turn8search20
Inputs: `{ moduleName, target: 'domain'|'application', subjectName }`
Outputs: test file, fixtures, basic happy/edge cases.
Preconditions: test runner selected (Vitest in this report); tsconfig configured.
Errors: `E_SUBJECT_NOT_FOUND`.
Example: "Generate unit tests for `CreateInvoiceUseCase` and the amount calculation policy."
Templates: `tools/generators/be/tests-unit/*`

**BE‑08 — Integration tests with Postgres (Testcontainers)**
Purpose: spin up a real DB in Docker during tests and run repositories/endpoints without mocks. Prisma explicitly describes the approach of "real DB in Docker" for integration tests. citeturn15search2 Testcontainers describes running throwaway services in Docker for tests, including a PostgreSQL module. citeturn15search14turn15search0
Inputs: `{ moduleName, suiteName, migrationCommand? }`
Outputs: setup (start/stop container), connection variables, minimal tests.
Preconditions: Docker engine available on machine/CI. citeturn15search6
Errors: `E_DOCKER_UNAVAILABLE`, `E_DB_BOOT_TIMEOUT`.
Example: "Create an integration suite: spin up Postgres via @testcontainers/postgresql, apply migrations and test the Prisma repository."
Templates: `tools/generators/be/tests-integration/*`

**BE‑09 — Refactor: move code to module + update public API**
Purpose: move files to the correct module/layer, update re-exports and imports without violating boundaries.
Inputs: `{ fromPaths[], toModuleName, updateImports: true }`
Outputs: moved files, updated imports, updated `public-api` (index).
Preconditions: boundary rules enabled (see INF‑03).
Errors: `E_CYCLE_INTRODUCED`, `E_BOUNDARY_VIOLATION`.
Example: "Move invoice logic from shared to the billing module, fix imports and public API."
Templates/codemods: `tools/codemods/be/move-to-module/*`

**BE‑10 — Contract types: shared Zod schemas**
Purpose: a single runtime contract for DTOs (FE↔BE) with type inference: Zod describes validation schemas and returns a type-safe result after `parse`. citeturn13search2turn13search5
Inputs: `{ contractName, schemas {Input,Output,Error}? }`
Outputs: `packages/contracts` package, TS types, Zod schemas.
Preconditions: monorepo/workspaces configured. citeturn7search3
Errors: `E_CONTRACT_EXISTS`.
Example: "Create contract `Billing.CreateInvoice` (Input/Output) in packages/contracts and connect to BE/FE."
Templates: `tools/generators/contracts/zod/*`

**FE‑01 — Scaffold FSD slice (entities/features/widgets/pages)**
Purpose: create a slice of the required layer according to FSD, including segments and a public API. Russian FSD documentation fixes the meaning of slices and business-oriented naming. citeturn6search0turn6search4
Inputs: `{ layer, sliceName, segments: ['ui','model','api','lib'] }`
Outputs: folders/files, `index.ts` (public API), basic barrel exports.
Preconditions: `src/<layer>/...` structure exists.
Errors: `E_SLICE_EXISTS`, `E_LAYER_INVALID`.
Example: "Generate `features/auth/login` with `ui`, `model`, `api` and public API."
Templates: `tools/generators/fe/fsd-slice/*`

**FE‑02 — Create feature module (ui/model/api) + public API**
Purpose: a typical feature module: UI component, state/side-effects model, API client/hook; export through public API. Segment conventions in FSD are described in the tutorial (purpose-based folders). citeturn6search8
Inputs: `{ featureName, uiComponentName, storeShape?, apiContract? }`
Outputs: `ui/*.tsx`, `model/*`, `api/*`, `index.ts`.
Preconditions: data-fetching approach selected (see FE‑04).
Errors: `E_PUBLIC_API_MISSING` (if the generator could not update index).
Example: "Create feature `billing/pay-invoice`: button, loading state, API call, export from index.ts."
Templates: `tools/generators/fe/feature-module/*`

**FE‑03 — Zustand store slice + selectors + persist**
Purpose: create a Zustand store (local for feature/slice or shared), selectors, and persist configuration. Zustand documents persist middleware as a way to save state to storage. citeturn2search1turn2search13
Inputs: `{ storeName, stateFields[], actions[], persist?: {key, storage} }`
Outputs: `model/store.ts`, `model/selectors.ts`, store tests.
Preconditions: it is defined what belongs to UI-state vs server-state (see FE‑04).
Errors: `E_PERSIST_KEY_REQUIRED` (if persist is enabled without a key).
Example: "Create store `useAuthStore` with persist for token/user and selectors."
Templates: `tools/generators/fe/zustand-store/*`

**FE‑04 — Data fetching layer (TanStack Query) scaffold**
Purpose: standardize server-state: `useQuery/useMutation` hooks, keys, invalidation, typing. TanStack Query describes itself as "async state management / data fetching," and also documents the query key model and hooks. citeturn13search0turn13search6
Inputs: `{ scope (entity/feature), queryName, keyShape, fetcherSignature }`
Outputs: `api/queries.ts`, `api/keys.ts`, basic tests/mocks.
Preconditions: QueryClient provider configured in the app layer.
Errors: `E_QUERY_KEY_CONFLICT`.
Example: "Add query `billing.invoices.list` and mutation `billing.invoice.pay`, with list invalidation."
Templates: `tools/generators/fe/tanstack-query/*`

**FE‑05 — React Router route module scaffold**
Purpose: add a route module, link page, loaders/actions (if data routers are used). React Router documents `createBrowserRouter` as the recommended router for web projects and describes the trade-off: a full route tree upfront increases the initial bundle. citeturn13search4turn13search1
Inputs: `{ routePath, pageSliceName, layout?, authGuard? }`
Outputs: `pages/<page>/ui/page.tsx`, entry in the router tree.
Preconditions: routing style selected (data router vs classic).
Errors: `E_ROUTE_DUPLICATE`.
Example: "Add page `/billing/invoices` and connect as a page-slice."
Templates: `tools/generators/fe/react-router-page/*`

**FE‑06 — Unit tests with RTL (component + hook)**
Purpose: unit tests for components and hooks, focusing on user behavior. Testing Library formulates the guiding principle "the more your tests resemble the way your software is used, the more confidence they can give you," and recommends avoiding testing implementation details. citeturn1search7turn1search3
Inputs: `{ componentPath, scenarios[] }`
Outputs: tests + setup for `@testing-library/jest-dom` (or Vitest equivalent).
Preconditions: environment configured (jsdom) and test setup file.
Errors: `E_RENDER_FAIL` (render error), `E_QUERY_AMBIGUOUS` (ambiguous selectors).
Example: "Write RTL tests for LoginForm: validation, submission, loading/error states."
Templates: `tools/generators/fe/tests-rtl/*`

**FE‑07 — MSW mocks scaffold for frontend tests**
Purpose: network mocking "at the request level" for UI unit/integration tests. entity["organization","Mock Service Worker","api mocking library"] describes itself as client-agnostic API mocking and directly provides a quick start for Vitest in Node tests. citeturn14search3turn14search10
Inputs: `{ endpoints[], mode: 'browser'|'node' }`
Outputs: handlers, server setup, reset between tests.
Preconditions: same fetch clients (fetch/axios) in the application.
Errors: `E_UNHANDLED_REQUEST` (undescribed handler).
Example: "Generate MSW handlers for `/api/billing/invoices` and connect in vitest setup."
Templates: `tools/generators/fe/msw/*`

**FE‑08 — Refactor: split feature → entities/features/widgets**
Purpose: moving components/logic across FSD layers, respecting dependencies. FSD fixes the hierarchy and prohibition of "upward imports". citeturn6search4turn6search1
Inputs: `{ from, to, updateImports }`
Outputs: moved files, updated public APIs.
Preconditions: eslint rules for layers/public APIs enabled (INF‑03). citeturn6search6
Errors: `E_LAYER_VIOLATION`.
Example: "Extract `InvoiceCard` from pages to entities/invoice, and the pay button to features."
Templates/codemods: `tools/codemods/fe/fsd-move/*`

**INF‑01 — ESLint flat config + TS ESLint recommended**
Purpose: reproducible linting based on flat config. ESLint documents flat config and migration, and TypeScript ESLint provides a quickstart for flat format with recommended rules. citeturn3search0turn3search1turn3search11
Inputs: `{ scope: 'root'|'backend'|'frontend', typedLinting?: boolean }`
Outputs: `eslint.config.mjs` (or `eslint.config.js`), `lint` scripts.
Preconditions: ESLint and typescript-eslint installed.
Errors: `E_ESLINT_CONFIG_INVALID`, `E_TYPESCRIPT_PROJECT_MISSING` (for typed lint).
Example: "Generate eslint.config.mjs (flat) for monorepo with TypeScript, include recommended and separate overrides for FE/BE."
Templates: `tools/generators/infra/eslint-flat/*`

**INF‑02 — Prettier config + Tailwind class sorting**
Purpose: a unified formatter. Prettier documents configuration files (`.prettierrc`) and emphasizes the absence of a "global config" for consistency across teams. citeturn3search2turn3search17 Tailwind supports an official prettier plugin that sorts classes in the recommended order. citeturn9search17turn9search0
Inputs: `{ printWidth, semi, singleQuote, tailwind: true }`
Outputs: `.prettierrc`, `.prettierignore`, plugin connection.
Preconditions: Prettier v3+. citeturn9search0
Errors: `E_PRETTIER_PLUGIN_MISSING`.
Example: "Configure Prettier + prettier-plugin-tailwindcss and add format scripts."
Templates: `tools/generators/infra/prettier/*`

**INF‑03 — Boundary rules: FSD + boundaries plugin**
Purpose: enforce architectural import boundaries. FSD provides an eslint-config for public API/layers-slices concepts. citeturn6search6 eslint-plugin-boundaries is designed to define element types and allowed connections. citeturn9search8turn9search22
Inputs: `{ fsdLayersConfig, beModulesConfig }`
Outputs: ESLint boundaries rules, matrix of allowed imports.
Preconditions: path aliases aligned with boundary patterns.
Errors: `E_BOUNDARY_RULES_TOO_BROAD` (false positives/invalid matches).
Example: "Prohibit imports from internal slice segments, allow only through public API."
Templates: `tools/generators/infra/boundaries/*`

**INF‑04 — Dockerfile multi-stage (BE/FE)**
Purpose: production images with build/runtime separation. Docker recommends multi-stage builds and minimal base images to reduce size and vulnerabilities. citeturn4search0turn4search4
Inputs: `{ target: 'backend'|'frontend', nodeVersion, packageManager }`
Outputs: Dockerfile, .dockerignore, build/start commands.
Preconditions: project build in CI is reproducible.
Errors: `E_BUILD_FAIL`, `E_MISSING_LOCKFILE`.
Example: "Generate multi-stage Dockerfile for backend: compile TS → runtime node:24-slim."
Templates: `tools/generators/infra/dockerfile/*`

**INF‑05 — docker-compose dev stack**
Purpose: local dev stack (Postgres + backend), controlling startup order via `depends_on` and healthcheck. Docker Compose documents startup order and dependencies. citeturn4search1turn4search5
Inputs: `{ services: ['db','backend'], ports, envFiles }`
Outputs: `docker-compose.yml`, healthcheck, volumes.
Preconditions: Docker/Compose installed locally.
Errors: `E_PORT_IN_USE`, `E_DB_HEALTHCHECK_FAIL`.
Example: "Create compose: postgres + backend, backend waits for db healthcheck."
Templates: `tools/generators/infra/compose/*`

**INF‑06 — GitHub Actions CI: lint/typecheck/test + Postgres**
Purpose: CI on push/PR: install → lint → typecheck → test; for integration — Postgres service container. GitHub recommends `actions/setup-node` for consistent Node on runners and documents PostgreSQL service containers. citeturn3search14turn4search3turn3search3
Inputs: `{ nodeVersion, packageManager, withPostgres: true }`
Outputs: `.github/workflows/ci.yml`
Preconditions: tests are capable of running in headless CI.
Errors: `E_DB_CONNECT_CI`, `E_MIGRATIONS_FAIL`.
Example: "Generate workflow: pnpm install, prisma migrate deploy, vitest run, frontend vitest run."
Templates: `tools/generators/infra/github-actions/*`

**INF‑07 — Railway deploy: Dockerfile/Start command/Variables**
Purpose: deploy to Railway considering Dockerfile and env vars; Railway documents that with a Dockerfile present it will be used, and variables are available as environment variables on build/run; for monorepo — root directory. citeturn4search6turn12search2turn7search2turn4search19
Inputs: `{ serviceName, rootDir?, startCmd, envVars[] }`
Outputs: `railway.toml`/`railway.json` (optional), configuration instructions. Railway also documents Config-as-Code and Dockerfile priority. citeturn4search16
Preconditions: Dockerfile and start command ready. Railway separately explains the start command and env var expansion. citeturn4search2turn4search10
Errors: `E_START_CMD_INVALID`, `E_ENV_MISSING`.
Example: "Configure Railway for backend in /apps/backend, start `node dist/main.js`, variables DATABASE_URL, PORT."
Templates: `tools/generators/infra/railway/*`

**INF‑08 — Monorepo task graph (turbo.json)**
Purpose: describe tasks (build/lint/test/typecheck) and outputs for caching; Turborepo documents `turbo.json` and the concept of remote caching. citeturn8search1turn8search2
Inputs: `{ packages[], tasks[], outputsMap }`
Outputs: `turbo.json`, root package.json scripts.
Preconditions: workspace configured. citeturn7search3
Errors: `E_TASK_CYCLE`, `E_OUTPUTS_MISSING`.
Example: "Add turbo pipeline: lint/test/typecheck for apps/frontend and apps/backend with caching."
Templates: `tools/generators/infra/turbo/*`

## Recommended Tools and Option Comparison

This section fixes "unspecified details" and provides reasoned options with pros/cons and config snippets.

### Unit Tests for BE and FE

**Default option (recommended): Vitest for both applications**
Vitest is positioned as a Vite-native test runner and can be used even without Vite, and also describes support for v8/istanbul coverage in the config. citeturn8search7turn1search1 This is convenient for full-stack TS: unified commands and reporting.

**Alternative: Jest**
Jest remains widespread, but for TypeScript config `jest.config.ts` by default requires `ts-node` or a loader (Jest documentation explicitly describes this). citeturn1search2

**Alternative: built-in node:test**
Node documents the built-in test runner (`node:test`) and separate guides on its usage. citeturn14search2turn14search6turn14search12 It can be useful for "minimal dependencies," but the ecosystem (mocks, jsdom-world) more often requires additional layers.

Comparison:

| Criterion | Vitest | Jest | node:test |
|---|---|---|---|
| TS-DX in monorepo | High (unified approach, Vite pipeline) citeturn8search7 | Good, but TypeScript configs more complex/varied citeturn1search2turn1search6 | Basic, much added manually citeturn14search6 |
| Coverage | v8/istanbul in config citeturn1search1 | available, but setup depends on transformation | depends on surrounding tools |
| FE + RTL | Excellent (via jsdom + RTL) | Excellent | requires glue code |
| Speed in Vite stack | usually very high | good | good |

### State Management: where entity["organization","Zustand","react state library"], and where else

Zustand is defined as the base "client state". At the same time, for server-state TanStack Query is usually simpler and cleaner, since it is oriented towards working with asynchronous sources and caching. citeturn13search0turn13search6

Comparison of popular options (as a reference table for the team):

| Library | Model | Strengths | Risks/Cons | When to choose |
|---|---|---|---|---|
| Zustand | Store + middleware | Simplicity and low boilerplate; middleware (persist etc.). citeturn2search1turn11search6 | Easy to start storing "server-state" where a cache/invalidation is better | UI state, local caches, ephemeral state |
| entity["organization","Redux Toolkit","official redux toolset"] | Redux with opinionated defaults | `configureStore` gives good defaults. citeturn11search0turn11search7 | More structure/ceremony than Zustand | Very large teams/strict patterns |
| entity["organization","Jotai","react atomic state"] | Atoms | Primitive/derived atoms. citeturn11search1 | Atom model doesn't suit everyone | Fine-grained state composition |
| entity["organization","Recoil","react state graph library"] | Atoms/selectors graph | Data graph atoms→selectors. citeturn11search20 | Dependency on project/ecosystem state | If graph model is specifically needed |

### ORM/DB Access

Prisma + PostgreSQL are fixed in the stack. Prisma Migrate describes the role of migrations and the history of `.sql` files. citeturn0search19 Therefore the recommendation: **Prisma as the primary ORM**, plus an "escape hatch" for complex SQL queries (raw SQL in Prisma or a dedicated query builder in read modules).

Comparison (for understanding trade-offs and possible evolution):

| Tool | Type | Key idea/doc reference | Pros | Cons | Fit for hex |
|---|---|---|---|---|---|
| Prisma | ORM + schema + migrate | Migrate: SQL migration history. citeturn0search19turn0search15 | Type-safety, migrations, DX | Complex queries sometimes simpler outside ORM | Excellent via outbound adapter |
| entity["organization","TypeORM","typescript orm"] | ORM | Supports Active Record and Data Mapper. citeturn10search0turn10search7 | Pattern flexibility, many DBs | More "magic"/variability | Good, but needs discipline |
| entity["organization","MikroORM","typescript data mapper orm"] | ORM (Data Mapper) | Identity Map + Unit of Work. citeturn10search1turn10search11 | Strong DDD friendliness | Steeper learning curve, different philosophy | Excellent under DDD/hex |
| entity["organization","Drizzle ORM","typescript orm"] | Thin typed layer | Positions itself as a lightweight/typed layer over SQL. citeturn10search12turn10search14 | SQL-thinking transparency | Fewer "batteries" than Prisma | Good as adapter/query layer |
| entity["organization","Kysely","type-safe query builder"] | Query builder | Type-safe SQL query builder. citeturn10search15turn10search19 | Control and typing of complex SQL | No ORM model as such | Excellent as read adapter |

### Deployment Platforms: Railway and Alternatives

Railway is chosen. Important: Railway documents environment variables, environments, monorepo root directory, and that a Dockerfile will be used automatically if present. citeturn12search2turn12search16turn7search2turn4search19turn4search6

Comparison (in case of compliance/cost/multi-region requirements):

| Platform | Monorepo | Prisma Migrations | Features |
|---|---|---|---|
| Railway | Root directory + start command. citeturn7search2 | Official Prisma→Railway guide. citeturn0search10turn12search17 | Dockerfile auto-detect. citeturn4search19 Variables as env vars. citeturn12search2 |
| entity["company","Render","hosting platform"] | Yes (as PaaS) | Render describes pre-deploy command for Prisma migrations. citeturn12search0turn12search9 | Strong emphasis on pre-deploy hooks |
| entity["company","Fly.io","app deployment platform"] | Yes | Prisma describes deployment on Fly.io and postinstall `prisma generate`. citeturn12search4turn12search1 | Granular control, but more DevOps work |
| entity["company","Vercel","cloud platform"] | Usually yes | Backend guides and Postgres connection via Marketplace. citeturn12search11turn12search15 | Great for FE/edge, API possible (Express guide). citeturn12search19 |

## Full Tech Stack Mapping and Project Structure Examples

This section provides a "physical" map: packages, configs, folders, and code templates that your skills must generate/maintain.

### Monorepo (recommended)

Reason: shared contracts/types (e.g., Zod contracts) and unified CI commands. pnpm documents workspaces and the fact that a workspace requires `pnpm-workspace.yaml` at the root. citeturn7search3turn7search0 Railway documents monorepo deployment via root directory for each service. citeturn7search2turn7search20

**Example `pnpm-workspace.yaml`:**
```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "tools/*"
```

**Recommended structure:**
```txt
.
├─ apps/
│  ├─ frontend/
│  └─ backend/
├─ packages/
│  ├─ contracts/        # Zod schemas + TS types (FE/BE)
│  ├─ eslint-config/    # shared eslint flat config (optional)
│  └─ tsconfig/         # base tsconfig presets (optional)
├─ tools/
│  └─ generators/       # plop/hygen/nx generators + templates
├─ .github/workflows/
├─ pnpm-workspace.yaml
├─ turbo.json
└─ package.json
```

### Node/TS Versions and Base tsconfig

Node: in CI and production it makes sense to fix **Node 24 LTS**, since the Active LTS branch at the report date is v24. citeturn1search0

TypeScript: the base set of options must include `strict`, since TS describes `strict` as a general toggle for strict flags, including `strictNullChecks`. citeturn2search19 For large repositories, `incremental` is useful, which caches project graph information in `.tsbuildinfo`. citeturn2search5

**Example `tsconfig.base.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "incremental": true,
    "noEmit": true,
    "types": []
  }
}
```

### Backend: Packages, Configs, Folders (Modular Monolith + Hex)

#### Dependencies (example)

`apps/backend/package.json` (conceptually):
- dependencies: `fastify`, `@prisma/client`, `zod`, `pino` (logging), `dotenv` (if needed locally)
- devDependencies: `prisma`, `typescript`, `tsx` (or equivalent), `vitest`, `@vitest/coverage-v8`, `eslint`, `typescript-eslint`

Fastify schema-based approach: if you describe a schema, Fastify validates/serializes and compiles schemas into performant functions. citeturn9search7 Prisma: for production migrations use `prisma migrate deploy` as part of CI/CD. citeturn12search17turn0search6

#### Folder Structure (example)

```txt
apps/backend/src/
├─ app/
│  ├─ bootstrap.ts          # application assembly
│  ├─ http.ts               # fastify instance + plugins
│  └─ modules.ts            # module registration
├─ modules/
│  ├─ billing/
│  │  ├─ domain/
│  │  │  ├─ entities/
│  │  │  ├─ value-objects/
│  │  │  └─ policies/
│  │  ├─ application/
│  │  │  ├─ use-cases/
│  │  │  ├─ orchestration/
│  │  │  └─ dto/
│  │  ├─ ports/
│  │  │  ├─ inbound/
│  │  │  └─ outbound/
│  │  ├─ adapters/
│  │  │  ├─ http/
│  │  │  └─ persistence/prisma/
│  │  └─ index.ts           # module public API
│  └─ ...
├─ shared/
│  ├─ errors/
│  ├─ logging/
│  └─ config/
└─ main.ts
apps/backend/prisma/
├─ schema.prisma
└─ migrations/
```

#### Prisma Schema + Migrations Template

Prisma Migrate supports SQL migration history and schema synchronization. citeturn0search19

**`prisma/schema.prisma` (example model):**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Invoice {
  id         String   @id @default(cuid())
  customerId String
  status     String
  totalCents Int
  createdAt  DateTime @default(now())
}
```

**Commands (dev/prod):**
```bash
# dev: create migration
pnpm prisma migrate dev --name add_invoice

# prod/CI: apply all pending migrations
pnpm prisma migrate deploy
```

`migrate deploy` is intended for staging/production (and is generally recommended as part of CI/CD). citeturn12search17turn0search15

#### Orchestration Use-Case Layer Template (application)

```ts
// apps/backend/src/modules/billing/application/use-cases/create-invoice.usecase.ts
import { z } from "zod";
import type { InvoiceRepository } from "../ports/outbound/invoice-repository";

export const CreateInvoiceInput = z.object({
  customerId: z.string().min(1),
  items: z.array(z.object({ sku: z.string().min(1), qty: z.number().int().positive(), priceCents: z.number().int().nonnegative() }))
});

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceInput>;

export type CreateInvoiceResult = { invoiceId: string };

export class CreateInvoiceUseCase {
  constructor(private readonly invoiceRepo: InvoiceRepository) {}

  async execute(input: CreateInvoiceInput): Promise<CreateInvoiceResult> {
    const parsed = CreateInvoiceInput.parse(input);

    const totalCents = parsed.items.reduce((acc, it) => acc + it.qty * it.priceCents, 0);

    const created = await this.invoiceRepo.create({
      customerId: parsed.customerId,
      totalCents
    });

    return { invoiceId: created.id };
  }
}
```

Zod provides runtime validation and type inference from schema. citeturn13search2turn13search5

#### Unit Test Template (Vitest, BE)

Vitest documents configuration and coverage in `vitest.config.*`. citeturn8search20turn1search1

```ts
// apps/backend/src/modules/billing/application/use-cases/create-invoice.usecase.test.ts
import { describe, it, expect } from "vitest";
import { CreateInvoiceUseCase } from "./create-invoice.usecase";

describe("CreateInvoiceUseCase", () => {
  it("calculates total and calls repo.create", async () => {
    const repo = {
      create: async (data: any) => ({ id: "inv_1", ...data })
    };

    const uc = new CreateInvoiceUseCase(repo as any);

    const res = await uc.execute({
      customerId: "c_1",
      items: [{ sku: "sku", qty: 2, priceCents: 150 }]
    });

    expect(res.invoiceId).toBe("inv_1");
  });
});
```

#### Integration Test Template (Postgres via Testcontainers)

Prisma recommends the approach of using a real DB in Docker for integration tests. citeturn15search2 Testcontainers describes running a throwaway Postgres container. citeturn15search0turn15search14

```ts
// apps/backend/test/integration/postgres.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { PrismaClient } from "@prisma/client";

describe("billing prisma integration", () => {
  let container: PostgreSqlContainer;
  let prisma: PrismaClient;

  beforeAll(async () => {
    container = await new PostgreSqlContainer().start();

    process.env.DATABASE_URL = container.getConnectionUri();
    prisma = new PrismaClient();

    // here typically: prisma migrate deploy
    // or run SQL from prisma/migrations (your choice)
  });

  afterAll(async () => {
    await prisma?.$disconnect();
    await container?.stop();
  });

  it("can write/read Invoice", async () => {
    const created = await prisma.invoice.create({
      data: { customerId: "c1", status: "DRAFT", totalCents: 1000 }
    });

    const found = await prisma.invoice.findUnique({ where: { id: created.id } });
    expect(found?.id).toBe(created.id);
  });
});
```

### Frontend: Packages, Configs, Folders (FSD + Zustand + Tailwind)

#### Dependencies (example)

`apps/frontend/package.json` (conceptually):
- dependencies: `react`, `react-dom`, `zustand`, `@tanstack/react-query`, `react-router-dom`, `zod` (if contracts)
- devDependencies: `vite`, `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`, `tailwindcss`, `postcss`, `autoprefixer`, `prettier`, `prettier-plugin-tailwindcss`

Tailwind documents installation with Vite and emphasizes the "Vite plugin" as the most seamless integration path. citeturn2search2

#### FSD Structure (example)

FSD layers and slices — the primary axis of organization. citeturn6search4turn6search0

```txt
apps/frontend/src/
├─ app/
│  ├─ providers/            # QueryClientProvider, RouterProvider, etc.
│  ├─ styles/               # global styles, tailwind entry
│  └─ index.tsx
├─ pages/
│  ├─ billing-invoices/
│  │  ├─ ui/
│  │  └─ index.ts
├─ widgets/
├─ features/
│  ├─ billing/pay-invoice/
│  │  ├─ ui/
│  │  ├─ model/
│  │  ├─ api/
│  │  └─ index.ts
├─ entities/
│  ├─ invoice/
│  │  ├─ ui/
│  │  ├─ model/
│  │  ├─ api/
│  │  └─ index.ts
└─ shared/
   ├─ api/
   ├─ lib/
   ├─ ui/
   └─ config/
```

#### Zustand Store Template (feature-local)

Persist middleware is described in Zustand documentation as a way to store state in storage. citeturn2search1

```ts
// apps/frontend/src/features/billing/pay-invoice/model/store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type State = {
  lastPaidInvoiceId: string | null;
  setLastPaid: (id: string | null) => void;
};

export const usePayInvoiceStore = create<State>()(
  persist(
    (set) => ({
      lastPaidInvoiceId: null,
      setLastPaid: (id) => set({ lastPaidInvoiceId: id })
    }),
    { name: "pay-invoice" }
  )
);
```

#### "Feature module" Template (ui + api + model + public API)

```ts
// apps/frontend/src/features/billing/pay-invoice/index.ts
export { PayInvoiceButton } from "./ui/pay-invoice-button";
export { usePayInvoiceStore } from "./model/store";
```

```tsx
// apps/frontend/src/features/billing/pay-invoice/ui/pay-invoice-button.tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePayInvoiceStore } from "../model/store";
import { payInvoice } from "../api/pay-invoice";

export function PayInvoiceButton(props: { invoiceId: string }) {
  const qc = useQueryClient();
  const setLastPaid = usePayInvoiceStore((s) => s.setLastPaid);

  const m = useMutation({
    mutationFn: () => payInvoice({ invoiceId: props.invoiceId }),
    onSuccess: async (res) => {
      setLastPaid(res.invoiceId);
      await qc.invalidateQueries({ queryKey: ["billing", "invoices"] });
    }
  });

  return (
    <button
      className="rounded px-3 py-2 text-white bg-sky-700 hover:bg-sky-800 disabled:opacity-50"
      disabled={m.isPending}
      onClick={() => m.mutate()}
    >
      {m.isPending ? "Paying..." : "Pay"}
    </button>
  );
}
```

TanStack Query documents queries/mutations, the query model as a dependency on an async source, and `useQuery`. citeturn13search6

#### Unit Test Template (RTL + Vitest)

Testing Library emphasizes the focus on user behavior and the harm of testing implementation details. citeturn1search3turn1search7

```tsx
// apps/frontend/src/features/billing/pay-invoice/ui/pay-invoice-button.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PayInvoiceButton } from "./pay-invoice-button";

describe("PayInvoiceButton", () => {
  it("renders button and reacts to click", async () => {
    const qc = new QueryClient();
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={qc}>
        <PayInvoiceButton invoiceId="inv_1" />
      </QueryClientProvider>
    );

    expect(screen.getByRole("button", { name: "Pay" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Pay" }));
  });
});
```

## Development Infrastructure, Linting, Docker, Railway, and CI/CD

### ESLint (flat config) + TypeScript ESLint

ESLint documents flat config and the structure of configuration files. citeturn3search0turn3search11 TypeScript ESLint provides a quickstart specifically for flat config and recommended rules. citeturn3search1

**Example root `eslint.config.mjs` (simplified):**
```js
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        projectService: true
      }
    },
    rules: {
      "no-console": "warn"
    }
  },
  {
    ignores: ["**/dist/**", "**/.turbo/**", "**/node_modules/**"]
  }
];
```

### Prettier + Tailwind Class Sorting

Prettier documents `.prettierrc` and emphasizes that there is no global configuration so that behavior is consistent when moving a project. citeturn3search2 Tailwind documents the official prettier plugin for class sorting. citeturn9search17turn9search0

**`.prettierrc`:**
```json
{
  "printWidth": 100,
  "singleQuote": true,
  "semi": true,
  "trailingComma": "all",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### Boundary Enforcement (FSD + boundaries)

- FSD eslint-config: rules `import-order`, `public-api`, `layers-slices`. citeturn6search6
- eslint-plugin-boundaries: rule `boundaries/element-types` for describing element types and allowed connections. citeturn9search8turn9search22
- (optional, if using Nx): rule `@nx/enforce-module-boundaries` is documented as a way to prevent "unplanned cross-dependencies". citeturn9search14

Practical meaning for skills: any generator/codemod must automatically:
1) create `index.ts` as a public API,
2) import neighboring slices/modules only through public API,
3) fail with an error (or suggest a fix) if the layer/module matrix is violated.

### Dockerfile and docker-compose

Docker documents Node.js containerization and best practices, including multi-stage builds. citeturn4search0turn4search4

**Example `apps/backend/Dockerfile` (multi-stage, conceptually):**
```dockerfile
# build
FROM node:24-slim AS build
WORKDIR /app
COPY . .
RUN corepack enable
RUN pnpm install --frozen-lockfile
RUN pnpm -C apps/backend build

# runtime
FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/backend/dist ./dist
COPY --from=build /app/apps/backend/package.json ./package.json
RUN corepack enable && pnpm install --prod --frozen-lockfile
CMD ["node", "dist/main.js"]
```

Docker Compose: for controlled service startup, `depends_on` and healthcheck are used; Docker Compose directly describes startup order management. citeturn4search1turn4search5

**`docker-compose.yml` (dev):**
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

### Railway: Deploy, Variables, Monorepo

Railway documents:
- Dockerfile auto-detect and use of Dockerfile when present. citeturn4search19turn4search6
- Variables as env vars (available for build/run and `railway run`). citeturn12search2
- Monorepo deployment via root directory and different start commands for services. citeturn7search2turn7search5
- Start command and the nuance of env var expansion (for Dockerfile/image). citeturn4search2turn4search10
- Config-as-code and Dockerfile priority. citeturn4search16

**Practical "skill flow" for deploying backend to Railway (minimum):**
1) Service Settings → Root Directory = `/apps/backend` (for monorepo). citeturn7search2
2) Variables: `DATABASE_URL`, `PORT`, `NODE_ENV=production`. citeturn12search2
3) Build uses Dockerfile automatically (if `Dockerfile` is in the root of the selected source directory). citeturn4search19
4) Prisma: apply migrations via `prisma migrate deploy` as part of the pipeline/start script (CI/CD preferred). citeturn12search17turn0search6
5) If needed: configure environments (preview/staging/prod). citeturn12search16

### GitHub Actions CI (example)

GitHub documents `actions/setup-node` as the recommended way to use Node in Actions (consistent behavior), and also a separate guide on PostgreSQL service containers. citeturn3search14turn4search3 setup-node also supports built-in dependency caching. citeturn3search3

**`.github/workflows/ci.yml` (example for pnpm + Postgres):**
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
          --health-interval=5s
          --health-timeout=5s
          --health-retries=10

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: "pnpm"

      - name: Install
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Typecheck
        run: pnpm typecheck

      - name: Backend migrate
        env:
          DATABASE_URL: postgresql://app:app@localhost:5432/app_test
        run: pnpm -C apps/backend prisma migrate deploy

      - name: Unit tests
        run: pnpm test
```

## Onboarding and Resources

### Onboarding Checklist (focus on P0 skills)

- Read and adopt FSD layer/slice rules (layers + slices). citeturn6search4turn6search0
- Learn to create a new FSD slice via FE‑01 and add a public API. citeturn6search8
- Understand hexagonal structure: ports & adapters, core independence from UI/DB. citeturn0search1turn0search22
- Create module BE‑01 and use-case BE‑02, then endpoint BE‑03 (Fastify + schema). citeturn9search7turn9search3
- Master Prisma migrations (dev vs deploy) and the rule: in production — `migrate deploy` in CI/CD. citeturn12search17turn0search15
- Set up and run unit tests on Vitest, understand v8/istanbul coverage. citeturn1search1turn8search20
- Adopt the Testing Library philosophy (test behavior, not implementation details). citeturn1search7turn1search3
- Adopt formatting rules and Tailwind class sorting via Prettier plugin. citeturn3search2turn9search17
- Understand CI workflow (setup-node, Postgres service container) and be able to debug migration/test failures. citeturn3search14turn4search3
- Understand Railway: Variables, root directory for monorepo, Dockerfile detection. citeturn12search2turn7search2turn4search19

### Recommended Resources for the Team (priority: official and localized where available)

- FSD Documentation: "Layers" and "Slices and Segments". citeturn6search4turn6search0
- Hexagonal architecture (original) and neutral description: Alistair Cockburn (hexagonal architecture) and AWS Prescriptive Guidance (ports/adapters, 2005). citeturn0search1turn0search22
- Prisma Migrate: overview, `migrate deploy`, and "development vs production". citeturn0search19turn0search15turn12search17
- Vitest: configuration and coverage. citeturn8search20turn1search1
- Testing Library: introduction and guiding principles. citeturn1search3turn1search7
- Fastify: Validation & Serialization, TypeScript reference. citeturn9search7turn9search3
- ESLint flat config + migration guide; TypeScript ESLint quickstart. citeturn3search0turn3search11turn3search1
- Prettier configuration and Tailwind class sorting plugin. citeturn3search2turn9search0turn9search17
- Railway docs: builds/Dockerfiles, variables, monorepo deployment. citeturn4search6turn4search19turn12search2turn7search2
- GitHub Actions: building & testing Node.js, PostgreSQL service containers. citeturn3search14turn4search3
- FSD overview (as an "entry text" for the team): FSD article on Habr and talks/links. citeturn6search7
