---
name: fe-04-tanstack-query
description: This skill should be used when the user asks to "add a TanStack Query hook", "scaffold data fetching", "add a useQuery hook", "add React Query hooks", or "add a data fetching layer".
version: 0.1.0
---

# FE-04: Data fetching layer (TanStack Query) scaffold

Create standardized `useQuery`/`useMutation` hooks with query keys and cache invalidation patterns.

## Inputs

- `scope` (required): entity or feature scope (e.g., `billing.invoices`, `feed.articles`)
- `queryName` (required): camelCase operation (e.g., `listArticles`, `getArticle`)
- `keyShape` (required): query key structure (e.g., `['feed', 'articles', { page }]`)
- `fetcherSignature` (required): async fetcher function signature

## Outputs

Creates inside the slice's `api/` directory:

- `queries.ts` — `useQuery`/`useMutation` hooks
- `keys.ts` — query key factory (typed)

## Preconditions

- `@tanstack/react-query` installed
- `QueryClientProvider` configured in `apps/frontend/src/app/providers/`

## Workflow

1. Parse `keyShape` to decide which factory methods to generate. Use the shape elements as the key prefix and add `list`/`detail` variants for dynamic params:

```typescript
// api/keys.ts — replace '<scope>' with the scope input (e.g., 'articles')
// keyShape example: ['feed', 'articles', { page }] → generates list factory
export const <scope>Keys = {
  all: ['<scope>'] as const,
  // Add list() if keyShape includes dynamic params (e.g., page, filters):
  list: (params: Record<string, unknown>) => [...<scope>Keys.all, 'list', params] as const,
  // Add detail() if keyShape includes an id segment:
  detail: (id: string) => [...<scope>Keys.all, 'detail', id] as const,
};
```

2. Create `queries.ts`. Use `fetcherSignature` as the async function body for `queryFn` — wire it in directly rather than inlining a raw `fetch` call:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { <scope>Keys } from './keys';

// Replace the lambda body with the fetcherSignature input:
// fetcherSignature example: (params) => articlesApi.list(params)
export function use<QueryName>(params: Record<string, unknown>) {
  return useQuery({
    queryKey: <scope>Keys.list(params),
    queryFn: () => /* <fetcherSignature>(params) — paste the fetcher here */ Promise.resolve(null),
  });
}

// Write hook — add one useMutation per write operation
export function use<QueryName>Mutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: unknown /* TODO: use contract type */) => {
      const res = await fetch('/api/<scope>', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: <scope>Keys.all });
    },
  });
}
```

3. In `useMutation` `onSuccess`: invalidate related queries via `queryClient.invalidateQueries` using the appropriate key factory

4. Export hooks from the slice's `index.ts`:

```typescript
export { use<QueryName>, use<QueryName>Mutation } from './api/queries';
export { <scope>Keys } from './api/keys';
```

5. Run `pnpm -C apps/frontend typecheck`

## Error conditions

- `E_QUERY_KEY_CONFLICT`: Same key shape used in another query → use scoped prefixes (add the scope string as the first element)
- `E_TYPECHECK_UNAVAILABLE`: `typecheck` script missing → run `pnpm -C apps/frontend tsc --noEmit` directly

## Reference

See `docs/project-overview.md` → "FE-04 — Data fetching layer (TanStack Query) scaffold".
