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

- ESLint FSD boundary rules enabled (INF-03) — needed to confirm the fix
- Destination layer exists or will be created (FE-01)

## Workflow

1. Identify what to move by content type:
   - Domain-only types/entities → `entities`
   - User-action logic (mutations, event handlers) → `features`
   - UI composition (combines multiple features/entities) → `widgets`

2. Create destination slice if it does not exist (FE-01 with the appropriate `layer`)

3. Move files from `from` to `to` using the editor (Read + Write, not shell `mv`) to preserve content, updating internal relative imports within the moved files

4. If `updateImports: true`, search for all imports referencing the moved paths and update them:

```bash
grep -r "from '.*<from-slice>'" apps/frontend/src/ --include="*.ts" --include="*.tsx"
```

Update each import to point to the new location (or to the destination slice's `index.ts`). If `updateImports: false`, skip this step — note that imports will remain broken until updated manually.

5. Update source `index.ts` to remove moved exports; update destination `index.ts` to add them:

```typescript
// destination index.ts — add:
export { MovedComponent } from './ui/moved-component';

// source index.ts — remove the corresponding line
```

6. Run `pnpm -C apps/frontend lint` — boundary violation count should be zero after the refactor

7. Run `pnpm -C apps/frontend typecheck` to confirm no broken imports remain

## FSD dependency direction (reference)

```
app → pages → widgets → features → entities → shared
```

Moving code downward (e.g., pages → entities) is always safe. Moving upward requires checking all consumers for new boundary violations.

## Error conditions

- `E_LAYER_VIOLATION`: A moved file tries to import from a higher layer → move the dependency too, or inject it via props
- `E_LINT_UNAVAILABLE`: `lint` script missing → run `pnpm -C apps/frontend eslint src/` directly
- `E_TYPECHECK_UNAVAILABLE`: `typecheck` script missing → run `pnpm -C apps/frontend tsc --noEmit` directly

## Reference

See `docs/project-overview.md` → "FE-08 — Refactor: split feature → entities/features/widgets".
