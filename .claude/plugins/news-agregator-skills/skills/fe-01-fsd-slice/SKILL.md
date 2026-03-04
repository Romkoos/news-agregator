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

1. Verify `layer` is one of the valid FSD layers: `entities`, `features`, `widgets`, `pages`
2. Verify the slice directory does not already exist
3. Create only the requested segment directories under `apps/frontend/src/<layer>/<sliceName>/`
4. Create `index.ts` with the boundary comment:

```typescript
// Public API for <sliceName> — only export symbols needed outside this slice.
// Never import from segment internals; always go through this file.
export {};
```

5. Run `pnpm -C apps/frontend lint` to verify no boundary violations are introduced

## FSD import rules (enforce these)

- Imports must go downward: `pages → widgets → features → entities → shared`
- Never import from a sibling slice's internals — always via `index.ts` public API
- No imports from higher layers

## Error conditions

- `E_SLICE_EXISTS`: Slice directory already exists → ask to extend or skip
- `E_LAYER_INVALID`: Invalid layer name → list valid layers (`entities`, `features`, `widgets`, `pages`)
- `E_LINT_UNAVAILABLE`: `lint` script missing → run `pnpm -C apps/frontend eslint src/` directly

## Reference

See `docs/project-overview.md` → "FE-01 — Scaffold FSD slice" and "Frontend: FSD Structure" for the directory layout.
