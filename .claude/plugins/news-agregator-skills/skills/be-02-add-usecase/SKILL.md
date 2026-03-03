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

- `application/dto/<use-case-name>.dto.ts` — Zod input/output schemas + inferred TS types
- `application/use-cases/<use-case-name>.usecase.ts` — class with `execute(input): Promise<Result>`
- `ports/outbound/<repo-name>.ts` — outbound port interface stub (if new entity implied)
- Updated `index.ts` — re-exports use-case class

## Preconditions

- Module already exists at `apps/backend/src/modules/<moduleName>/` (run BE-01 first)
- `useCaseName` must be PascalCase
- `zod` installed in `apps/backend`

## Workflow

1. Verify module directory exists at `apps/backend/src/modules/<moduleName>/`
2. Create `application/dto/<use-case-name>.dto.ts` with this starter content:

```typescript
import { z } from 'zod';

// The const and type intentionally share the same name — TypeScript value/type namespace merge.
export const <UseCaseName>Input = z.object({
  // TODO: add fields matching commandShape
});

export type <UseCaseName>Input = z.infer<typeof <UseCaseName>Input>;

export type <UseCaseName>Result = {
  // TODO: add fields matching resultShape
};
```

3. Create `application/use-cases/<use-case-name>.usecase.ts` with this starter content:

```typescript
import type { <RepositoryName> } from '../../ports/outbound/<repo-name>';
import { <UseCaseName>Input, type <UseCaseName>Result } from '../dto/<use-case-name>.dto';

export class <UseCaseName>UseCase {
  constructor(private readonly repo: <RepositoryName>) {}

  async execute(input: <UseCaseName>Input): Promise<<UseCaseName>Result> {
    const parsed = <UseCaseName>Input.parse(input);
    // TODO: implement using `parsed`
    throw new Error('Not implemented');
  }
}
```

4. Create `ports/outbound/<repo-name>.ts` stub if a new repository is implied:

```typescript
export interface <RepositoryName> {
  // TODO: add operation signatures
}
```

5. Add `export { <UseCaseName>UseCase } from './application/use-cases/<use-case-name>.usecase';` to `index.ts`
6. Run `pnpm -C apps/backend typecheck` to verify no type errors

## Error conditions

- `E_MODULE_NOT_FOUND`: Module directory missing → run BE-01 first
- `E_USECASE_EXISTS`: Use-case file already exists → ask user to overwrite or choose a new name
- `E_TYPECHECK_UNAVAILABLE`: `typecheck` script missing → run `pnpm -C apps/backend tsc --noEmit` directly as fallback

## Reference

See `docs/project-overview.md` → "BE-02 — Add use-case + orchestration skeleton" and the `CreateInvoiceUseCase` template for exact patterns.
