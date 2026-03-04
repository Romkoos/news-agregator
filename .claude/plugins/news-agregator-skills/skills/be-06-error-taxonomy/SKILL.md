---
name: be-06-error-taxonomy
description: This skill should be used when the user asks to "add an error taxonomy", "create domain error types", "add HTTP error mapping", "define module errors", or "add an error catalog to a module".
version: 0.1.0
---

# BE-06: Error taxonomy + HTTP mapping

Create a unified catalog of domain/application errors for a module and map them to HTTP responses.

## Inputs

- `moduleName` (required): existing module name
- `errors` (required): array of `{code, httpStatus, messageTemplate}` (e.g., `{code: "ARTICLE_NOT_FOUND", httpStatus: 404, messageTemplate: "Article {id} not found"}`)

## Outputs

Creates inside `apps/backend/src/modules/<moduleName>/`:

- `domain/errors.ts` — typed error classes keyed by code
- `adapters/http/error-mapper.ts` — maps domain errors to Fastify HTTP responses

## Preconditions

- Module exists (BE-01)
- Error codes must follow `SCREAMING_SNAKE_CASE`
- `httpStatus` values must be valid HTTP status codes

## Workflow

1. Create `domain/errors.ts`:

```typescript
export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly httpStatus: number = 500,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class ArticleNotFoundError extends DomainError {
  constructor(id: string) {
    super('ARTICLE_NOT_FOUND', `Article ${id} not found`, 404, { id });
  }
}
// TODO: add one class per error code from inputs
```

2. Create `adapters/http/error-mapper.ts`:

```typescript
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { DomainError } from '../../domain/errors';

export async function domainErrorHandler(
  error: FastifyError | DomainError,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (error instanceof DomainError) {
    return await reply.status(error.httpStatus).send({ error: error.code, message: error.message });
  }
  return await reply.status(500).send({ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' });
}
```

3. Register the error handler in `adapters/http/router.ts`:

```typescript
import { domainErrorHandler } from './error-mapper';

// Inside the register function:
app.setErrorHandler(domainErrorHandler);
```

4. Export error classes from `index.ts`:

```typescript
export { DomainError, ArticleNotFoundError } from './domain/errors';
// TODO: export all error classes defined in errors.ts
```

5. Run `pnpm -C apps/backend typecheck`

## Error conditions

- `E_DUPLICATE_ERROR_CODE`: Same error code defined twice in `errors.ts` → search for duplicates and remove
- `E_TYPECHECK_UNAVAILABLE`: `typecheck` script missing → run `pnpm -C apps/backend tsc --noEmit` directly

## Reference

See `docs/project-overview.md` → "BE-06 — Error taxonomy + HTTP mapping".
