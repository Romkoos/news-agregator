---
name: fe-05-react-router
description: This skill should be used when the user asks to "add a route module", "scaffold a React Router page", "add a page route", "create a page component with routing", or "add a new route to the router".
version: 0.1.0
---

# FE-05: React Router route module scaffold

Add a page slice and wire it into the React Router tree using `createBrowserRouter`.

## Inputs

- `routePath` (required): URL path (e.g., `/feed/articles`, `/billing/invoices/:id`)
- `pageSliceName` (required): kebab-case name (e.g., `feed-articles`, `billing-invoice-detail`)
- `layout` (optional): existing layout component to wrap the page
- `authGuard` (optional): `true` to add an auth redirect check in the route loader

## Outputs

Creates:

- `apps/frontend/src/pages/<page-slice-name>/ui/page.tsx` — page component
- `apps/frontend/src/pages/<page-slice-name>/index.ts` — public API

Modifies:

- `apps/frontend/src/app/router.ts` — adds route entry

## Preconditions

- React Router `createBrowserRouter` configured in `apps/frontend/src/app/router.ts`
- Page slice directory exists or will be created (FE-01 with `layer=pages`)

## Workflow

1. Create `pages/<page-slice-name>/` slice (FE-01 with `layer=pages`, `segments=['ui']`)

2. Create `pages/<page-slice-name>/ui/page.tsx`:

```tsx
import type { FC } from 'react';

const <PageSliceName>Page: FC = () => {
  return (
    <main>
      <h1>{/* TODO: page heading */}</h1>
    </main>
  );
};

export default <PageSliceName>Page;
```

3. Export component from `pages/<page-slice-name>/index.ts`:

```typescript
export { default as <PageSliceName>Page } from './ui/page';
```

4. Add route entry in `apps/frontend/src/app/router.ts`. Declare `lazy` at module scope (not inside the route config), then wrap in `Suspense`:

```typescript
import { lazy, Suspense } from 'react';

// Declare at module scope (before createBrowserRouter call):
const <PageSliceName>Page = lazy(() =>
  import('../../../pages/<page-slice-name>').then((m) => ({ default: m.<PageSliceName>Page }))
);

// Add inside the createBrowserRouter routes array:
{
  path: '<routePath>',
  // If layout input provided, wrap <PageSliceName>Page in the layout component:
  element: (
    <Suspense fallback={null}>
      <<PageSliceName>Page />
    </Suspense>
  ),
  // loader: authGuardLoader,  // uncomment if authGuard: true
}
```

5. If `authGuard: true`: add a loader function that checks auth state and redirects to the login page:

```typescript
import { redirect } from 'react-router-dom';

export const authGuardLoader = () => {
  const token = localStorage.getItem('auth-token'); // TODO: use actual auth store
  if (!token) return redirect('/login');
  return null;
};
```

6. Run `pnpm -C apps/frontend typecheck`

## Error conditions

- `E_ROUTE_DUPLICATE`: Path already registered → list existing routes and ask for a new path
- `E_TYPECHECK_UNAVAILABLE`: `typecheck` script missing → run `pnpm -C apps/frontend tsc --noEmit` directly

## Reference

See `docs/project-overview.md` → "FE-05 — React Router route module scaffold".
