---
name: be-09-refactor-module
description: This skill should be used when the user asks to "move code to a module", "refactor to a bounded context", "update a module's public API", "fix module boundaries", or "extract logic into a separate module".
version: 0.1.0
---

# BE-09: Refactor — move code to module + update public API

Move files to the correct module/layer, update re-exports and imports, and verify no boundary violations are introduced.

## Inputs

- `fromPaths` (required): array of current file paths to move (relative to project root)
- `toModuleName` (required): destination module name (must exist)
- `updateImports` (required): set `true` to update all import paths across the codebase

## Outputs

- Files moved to correct locations under `apps/backend/src/modules/<toModuleName>/`
- Updated `index.ts` public API in the destination module
- All import paths updated across `apps/backend/src/`

## Preconditions

- Destination module exists (BE-01)
- ESLint boundary rules enabled (INF-03) — needed to detect violations after move

## Workflow

1. For each file in `fromPaths`, determine the correct destination layer based on content:
   - Domain entities/value objects/policies → `domain/`
   - Use-cases/DTOs → `application/`
   - Interfaces → `ports/inbound/` or `ports/outbound/`
   - HTTP handlers/schemas → `adapters/http/`
   - Prisma repos/mappers → `adapters/persistence/prisma/`

2. Move each file using the editor (Read + Write, not shell mv) to preserve file content

3. Search for all imports referencing the moved files:

```bash
grep -r "from '.*<filename-without-ext>'" apps/backend/src/ --include="*.ts"
```

Update each import path to the new location.

4. Update destination `index.ts` — add exports for any publicly needed symbols:

```typescript
// Add to apps/backend/src/modules/<toModuleName>/index.ts
export { MovedClass } from './domain/<moved-file>';
```

5. Run `pnpm -C apps/backend typecheck` to find any remaining broken imports
6. Run `pnpm -C apps/backend lint` to verify no boundary violations remain

## Error conditions

- `E_CYCLE_INTRODUCED`: Move creates a circular import → report the cycle, suggest moving the dependency too or routing through public API
- `E_BOUNDARY_VIOLATION`: Import crosses forbidden layer boundary → move the file to the correct layer or route through `index.ts`
- `E_TYPECHECK_UNAVAILABLE`: `typecheck` script missing → run `pnpm -C apps/backend tsc --noEmit` directly
- `E_LINT_UNAVAILABLE`: `lint` script missing → run `pnpm -C apps/backend eslint src/` directly

## Reference

See `docs/project-overview.md` → "BE-09 — Refactor: move code to module + update public API".
