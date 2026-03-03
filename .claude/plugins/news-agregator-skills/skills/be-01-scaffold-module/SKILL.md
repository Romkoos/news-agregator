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
