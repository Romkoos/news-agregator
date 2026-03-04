---
name: fe-07-msw-mocks
description: This skill should be used when the user asks to "add MSW mocks", "scaffold Mock Service Worker handlers", "add API mocks for frontend tests", "add MSW to Vitest setup", or "mock HTTP endpoints in tests".
version: 0.1.0
---

# FE-07: MSW mocks scaffold for frontend tests

Create Mock Service Worker (MSW) handlers for API endpoints used in frontend tests, in Node mode for Vitest.

## Inputs

- `endpoints` (required): array of `{method, path, responseShape}` (e.g., `{method: "GET", path: "/api/articles", responseShape: {articles: []}}`)
- `mode` (required): `'node'` for Vitest (server-side MSW) — use `'browser'` only for manual testing in the browser

## Outputs

Creates/modifies:

- `apps/frontend/src/shared/api/mocks/handlers.ts` — MSW request handlers
- `apps/frontend/src/shared/api/mocks/server.ts` — `setupServer()` export
- Modifies `apps/frontend/src/setupTests.ts` — starts/resets/closes server in Vitest lifecycle hooks

## Preconditions

- `msw` installed in `apps/frontend` (v2+)
- `setupTests.ts` referenced in `vitest.config.ts` `setupFiles`

## Workflow

1. Install MSW if not present:

```bash
pnpm -C apps/frontend add -D msw
```

2. Create `apps/frontend/src/shared/api/mocks/handlers.ts`:

```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/articles', () => {
    return HttpResponse.json({ articles: [] });
  }),
  // TODO: add one http.<method>('<path>', handler) per endpoint from inputs
];
```

3. Create `apps/frontend/src/shared/api/mocks/server.ts`:

```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

4. Add lifecycle hooks to `apps/frontend/src/setupTests.ts`:

```typescript
import { server } from './shared/api/mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

5. Run `pnpm -C apps/frontend test` to verify no unhandled request warnings appear in the test output

## Error conditions

- `E_UNHANDLED_REQUEST`: A fetch in tests has no matching handler → add the missing handler to `handlers.ts` or check the URL path for typos
- `E_TEST_UNAVAILABLE`: `test` script missing → run `pnpm -C apps/frontend vitest run` directly

## Reference

See `docs/project-overview.md` → "FE-07 — MSW mocks scaffold for frontend tests".
