---
name: be-03-http-endpoint
description: This skill should be used when the user asks to "add an HTTP endpoint", "create a Fastify route", "add an API route", "scaffold a route handler", or "create a REST endpoint" in the backend.
version: 0.1.0
---

# BE-03: Add HTTP endpoint (Fastify) + schemas

Create an inbound adapter (Fastify route) with JSON Schema validation and connect it to an existing use-case.

## Inputs

- `moduleName` (required): existing module name
- `method` (required): HTTP method (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`)
- `path` (required): route path (e.g., `/articles/:id`)
- `requestSchema` (required): JSON Schema object for the request body/params
- `responseSchema` (required): JSON Schema object for the success response
- `useCaseName` (required): existing use-case to call (must exist, see BE-02)

## Outputs

Creates/modifies inside `apps/backend/src/modules/<moduleName>/adapters/http/`:

- `schemas/<route-name>.schema.ts` — typed JSON Schema objects for request and response
- `handlers/<route-name>.handler.ts` — Fastify route handler calling the use-case
- Updated `router.ts` — registers the new route with its schema

## Preconditions

- Module exists (BE-01)
- Use-case exists (BE-02)
- Fastify instance configured in `apps/backend/src/app/http.ts`

## Workflow

1. Verify module and use-case files exist
2. Create `schemas/<route-name>.schema.ts` with this starter content:

```typescript
import type { FastifySchema } from 'fastify';

export const <routeName>Schema = {
  body: {
    type: 'object',
    properties: {
      // TODO: add request body properties
    },
    required: [],
  },
  response: {
    200: {
      type: 'object',
      properties: {
        // TODO: add response properties
      },
    },
  },
} satisfies FastifySchema;
```

3. Create `handlers/<route-name>.handler.ts` with this starter content:

```typescript
import type { FastifyRequest, FastifyReply } from 'fastify';
import { <UseCaseName>UseCase } from '../../../application/use-cases/<use-case-name>.usecase';

export async function <routeName>Handler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // TODO: instantiate use-case with dependencies
  const useCase = new <UseCaseName>UseCase(/* inject repo */);
  const result = await useCase.execute(request.body);
  await reply.send(result);
}
```

4. Register the route in `router.ts` by adding:

```typescript
app.route({
  method: '<METHOD>',
  url: '<path>',
  schema: <routeName>Schema,
  handler: <routeName>Handler,
});
```

5. Run `pnpm -C apps/backend typecheck`

## Error conditions

- `E_ROUTE_CONFLICT`: Route method+path already registered in `router.ts` → report the conflict line
- `E_SCHEMA_INVALID`: Schema properties missing `type` field → Fastify requires typed JSON Schema
- `E_TYPECHECK_UNAVAILABLE`: `typecheck` script missing → run `pnpm -C apps/backend tsc --noEmit` directly

## Reference

See `docs/project-overview.md` → "BE-03 — Add HTTP endpoint (Fastify) + schemas" for the schema-based approach pattern.
