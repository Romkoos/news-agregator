---
name: be-10-shared-contracts
description: This skill should be used when the user asks to "create a shared contract", "add a Zod contract", "share types between frontend and backend", "add a shared schema package", or "create a contracts package".
version: 0.1.0
---

# BE-10: Contract types — shared Zod schemas

Create a `packages/contracts` workspace package holding Zod schemas and inferred TypeScript types shared between frontend and backend.

## Inputs

- `contractName` (required): dot-namespaced name (e.g., `Billing.CreateInvoice`, `Feed.GetArticles`)
- `schemas` (optional): `{Input?, Output?, Error?}` — Zod schema shapes for each

## Outputs

Creates/modifies:

- `packages/contracts/src/<domain>/<contract-name>.ts` — Zod schemas + inferred types
- `packages/contracts/src/index.ts` — re-exports all contracts
- `packages/contracts/package.json` — workspace package (if not existing)
- `packages/contracts/tsconfig.json` — TypeScript config (if not existing)
- Updated `apps/backend/package.json` and `apps/frontend/package.json` — add `@app/contracts` workspace dependency

## Preconditions

- pnpm workspace configured (`pnpm-workspace.yaml` includes `packages/*`)
- Root `tsconfig.base.json` exists (the generated `packages/contracts/tsconfig.json` extends it)

## Workflow

1. Create `packages/contracts/` package structure if not present:

```json
// packages/contracts/package.json
{
  "name": "@app/contracts",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  }
}
```

> Note: `main`, `types`, and `exports` intentionally point to `.ts` source — backend and frontend share the same TypeScript compilation pipeline via tsconfig project references, so no pre-compilation step is needed.

```json
// packages/contracts/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

2. Parse `contractName` into `<domain>` and `<ContractName>` (e.g., `Feed.GetArticles` → domain=`feed`, name=`GetArticles`).

3. Create `packages/contracts/src/<domain>/<contract-name>.ts`:

```typescript
import { z } from 'zod';

export const <ContractName>Input = z.object({
  // TODO: add fields matching schemas.Input
});

export type <ContractName>Input = z.infer<typeof <ContractName>Input>;

export const <ContractName>Output = z.object({
  // TODO: add fields matching schemas.Output
});

export type <ContractName>Output = z.infer<typeof <ContractName>Output>;

// Omit if schemas.Error was not provided
export const <ContractName>Error = z.object({
  code: z.string(),
  message: z.string(),
  // TODO: add extra fields from schemas.Error
});

export type <ContractName>Error = z.infer<typeof <ContractName>Error>;
```

4. Export from `packages/contracts/src/index.ts`:

```typescript
export * from './<domain>/<contract-name>';
```

5. Add to both `apps/backend/package.json` and `apps/frontend/package.json`:

```json
"dependencies": {
  "@app/contracts": "workspace:*"
}
```

6. Run `pnpm install` from the workspace root to link the new package

## Error conditions

- `E_CONTRACT_EXISTS`: Contract file already exists → ask user to version (e.g., `GetArticlesV2`) or extend
- `E_WORKSPACE_NOT_CONFIGURED`: `pnpm-workspace.yaml` missing or doesn't include `packages/*` → add `- "packages/*"` to the packages list first
- `E_INSTALL_FAIL`: `pnpm install` fails → run `pnpm install --prefer-offline` first; if lockfile conflicts exist, run `pnpm install --no-frozen-lockfile` and commit the updated `pnpm-lock.yaml`

## Reference

See `docs/project-overview.md` → "BE-10 — Contract types: shared Zod schemas" and the monorepo structure section.
