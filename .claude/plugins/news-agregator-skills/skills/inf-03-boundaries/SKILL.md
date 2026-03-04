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

- ESLint flat config already set up in each app (INF-01)
- `@feature-sliced/eslint-config` and `eslint-plugin-boundaries` installed

## Workflow

### Frontend (FSD) — when `fsdLayersConfig: true`

1. Install the plugin:

```bash
pnpm -C apps/frontend add -D @feature-sliced/eslint-config
```

2. Add to `apps/frontend/eslint.config.mjs`:

```js
import fsdConfig from '@feature-sliced/eslint-config';

// Add inside the tseslint.config() call:
...fsdConfig.configs.recommended,
```

This enables three rule sets:
- `import-order`: enforces FSD layer import direction (`pages → widgets → features → entities → shared`)
- `public-api`: forbids importing from slice internals (must import through `index.ts`)
- `layers-slices`: enforces layer hierarchy

### Backend (module boundaries) — when `beModulesConfig: true`

1. Install the plugin:

```bash
pnpm -C apps/backend add -D eslint-plugin-boundaries
```

2. Add element types and allow matrix to `apps/backend/eslint.config.mjs`:

```js
import boundaries from 'eslint-plugin-boundaries';

// Add inside the tseslint.config() call:
{
  plugins: { boundaries },
  settings: {
    'boundaries/elements': [
      { type: 'shared', pattern: 'src/shared/*' },
      { type: 'module', pattern: 'src/modules/*' },
    ],
  },
  rules: {
    'boundaries/element-types': ['error', {
      default: 'disallow',
      rules: [
        { from: 'module', allow: ['shared'] },
        { from: 'shared', allow: ['shared'] },
      ],
    }],
  },
},
```

3. Run `pnpm lint` on both apps — confirm only real violations appear, not false positives on `shared/`

## Error conditions

- `E_BOUNDARY_RULES_TOO_BROAD`: False positives on `shared/` imports → add `{ from: '<element-type>', allow: ['shared'] }` to the allow matrix for any element type that should be able to import from `shared`
- `E_LINT_UNAVAILABLE`: `lint` script missing → run `pnpm -C apps/frontend eslint src/` or `pnpm -C apps/backend eslint src/` directly

## Reference

See `docs/project-overview.md` → "INF-03 — Boundary rules: FSD + boundaries plugin".
