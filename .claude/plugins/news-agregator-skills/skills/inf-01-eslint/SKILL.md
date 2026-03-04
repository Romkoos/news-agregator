---
name: inf-01-eslint
description: This skill should be used when the user asks to "configure ESLint", "add ESLint flat config", "set up TypeScript linting", "add eslint.config.mjs", or "configure monorepo linting".
version: 0.1.0
---

# INF-01: ESLint flat config + TS ESLint recommended

Set up ESLint flat config for the monorepo with TypeScript ESLint recommended rules.

## Inputs

- `scope` (required): `'root'`, `'backend'`, or `'frontend'` — determines where `eslint.config.mjs` is created
- `typedLinting` (optional): `true` to enable type-aware rules (requires `tsconfig.json` with `projectService`)

## Outputs

Creates/modifies:

- `eslint.config.mjs` at the appropriate scope directory (root, `apps/backend/`, or `apps/frontend/`)
- `package.json` at the same scope — adds `"lint": "eslint ."` script

## Preconditions

- `eslint` and `typescript-eslint` installed in the scope package

## Workflow

1. Install if not present:

```bash
pnpm add -D eslint typescript-eslint @eslint/js
```

2. Create `eslint.config.mjs` using flat config format.

   **If `typedLinting: true`**, include the `languageOptions` block:

```js
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: { projectService: true },
    },
    rules: { 'no-console': 'warn' },
  },
  { ignores: ['**/dist/**', '**/.turbo/**', '**/node_modules/**'] }
);
```

   **If `typedLinting: false`**, omit the `languageOptions` block entirely:

```js
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: { 'no-console': 'warn' },
  },
  { ignores: ['**/dist/**', '**/.turbo/**', '**/node_modules/**'] }
);
```

3. Add `"lint": "eslint ."` to `package.json` scripts at the target scope

4. Run `pnpm lint` (or `pnpm -C apps/backend lint` / `pnpm -C apps/frontend lint`) to verify zero errors on a clean codebase

## Error conditions

- `E_ESLINT_CONFIG_INVALID`: Config file has syntax errors → check all import paths resolve and the `tseslint.config()` wrapper is used (not a bare array export)
- `E_TYPESCRIPT_PROJECT_MISSING`: `typedLinting: true` but no `tsconfig.json` found → create a tsconfig first or set `typedLinting: false`
- `E_LINT_FAIL`: Lint reports violations on the clean codebase → the violations are pre-existing; fix them or add them to a temporary `eslint-disable` comment, then re-run

## Reference

See `docs/project-overview.md` → "INF-01 — ESLint flat config + TS ESLint recommended" for the full config template.
