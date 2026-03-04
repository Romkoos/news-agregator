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

Modifies (only the files corresponding to `true` inputs):

- `apps/frontend/eslint.config.mjs` — adds `@feature-sliced/eslint-config` rules (when `fsdLayersConfig: true`)
- `apps/backend/eslint.config.mjs` — adds `eslint-plugin-boundaries` element types and allow matrix (when `beModulesConfig: true`)

## Preconditions

- ESLint flat config already set up in each app (INF-01)
- At least one of `fsdLayersConfig` or `beModulesConfig` must be `true` — if both are `false`, no work is needed
- `@feature-sliced/eslint-config` installed if `fsdLayersConfig: true`
- `eslint-plugin-boundaries` installed if `beModulesConfig: true`

## Workflow

### Frontend (FSD) — skip this section if `fsdLayersConfig: false`

1. Install the plugin:

```bash
pnpm -C apps/frontend add -D @feature-sliced/eslint-config
```

2. Add the FSD config spread to `apps/frontend/eslint.config.mjs`. The full file with the spread added:

```js
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import fsdConfig from '@feature-sliced/eslint-config';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...fsdConfig.configs.recommended, // adds import-order, public-api, layers-slices rules
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: { 'no-console': 'warn' },
  },
  { ignores: ['**/dist/**', '**/.turbo/**', '**/node_modules/**'] }
);
```

This enables three rule sets:
- `import-order`: enforces FSD layer import direction (`pages → widgets → features → entities → shared`)
- `public-api`: forbids importing from slice internals (must import through `index.ts`)
- `layers-slices`: enforces layer hierarchy

### Backend (module boundaries) — skip this section if `beModulesConfig: false`

1. Install the plugin:

```bash
pnpm -C apps/backend add -D eslint-plugin-boundaries
```

2. Add element types and allow matrix to `apps/backend/eslint.config.mjs`. The full file with boundaries added:

```js
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
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
  { ignores: ['**/dist/**', '**/node_modules/**'] }
);
```

3. Run `pnpm lint` on each modified app — confirm only real violations appear, not false positives on `shared/`

## Error conditions

- `E_BOTH_INPUTS_FALSE`: Both `fsdLayersConfig` and `beModulesConfig` are `false` → no work to do; re-confirm which app needs boundary rules
- `E_BOUNDARY_RULES_TOO_BROAD`: False positives on `shared/` imports → add `{ from: '<element-type>', allow: ['shared'] }` to the allow matrix for every element type that may import `shared`
- `E_LINT_UNAVAILABLE`: `lint` script missing → run `pnpm -C apps/frontend eslint src/` or `pnpm -C apps/backend eslint src/` directly

## Reference

See `docs/project-overview.md` → "INF-03 — Boundary rules: FSD + boundaries plugin".
