---
name: fe-03-zustand-store
description: This skill should be used when the user asks to "create a Zustand store", "add a store slice", "add a persist store", "scaffold state management", or "add Zustand state with selectors".
version: 0.1.0
---

# FE-03: Zustand store slice + selectors + persist

Create a Zustand store (feature-local or shared) with typed state, actions, selectors, and optional `persist` middleware.

## Inputs

- `storeName` (required): camelCase hook name (e.g., `useAuthStore`, `usePayInvoiceStore`)
- `stateFields` (required): array of `{name, type, defaultValue}` (e.g., `{name: "token", type: "string | null", defaultValue: "null"}`)
- `actions` (required): array of action names (e.g., `setToken`, `clearAuth`)
- `persist` (optional): `{key: string, storage: 'localStorage' | 'sessionStorage'}` — omit to skip persist middleware

## Outputs

Creates inside the slice's `model/` directory:

- `store.ts` — Zustand store with full TypeScript types
- `selectors.ts` — derived selector functions (e.g., `selectIsAuthenticated`)

## Preconditions

- `zustand` installed in `apps/frontend`
- Slice directory exists (FE-01 or FE-02)

## Workflow

1. Create `store.ts` — with persist middleware if `persist` input provided:

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type State = {
  // TODO: add fields from stateFields input
  // action signatures
};

// With persist:
export const <storeName> = create<State>()(
  persist(
    (set) => ({
      // TODO: default values from stateFields[*].defaultValue
      // TODO: action implementations
    }),
    {
      name: '<persist.key>',
      // Use persist.storage to select the storage engine:
      storage: createJSONStorage(() => localStorage), // replace with sessionStorage if persist.storage === 'sessionStorage'
    }
  )
);

// Without persist (use when persist input is omitted):
// export const <storeName> = create<State>()((set) => ({
//   // TODO: default values and action implementations
// }));
```

2. If `persist` is omitted, use the bare `create<State>()((set) => ({ ... }))` pattern (no middleware wrapper)

3. Create `selectors.ts` with pure functions operating on the store state. Type the `state` parameter using the `State` type exported from `store.ts`:

```typescript
// Import the State type from the store file
import type { State } from './store';
// Or re-export State from store.ts: export type { State };

// Example selector — replace with fields from stateFields input
export const selectIsAuthenticated = (state: State): boolean =>
  state.token !== null;
```

4. Export the store hook from the slice's `index.ts`:

```typescript
export { <storeName> } from './model/store';
export { selectIsAuthenticated } from './model/selectors';
```

5. Run `pnpm -C apps/frontend typecheck`

## Error conditions

- `E_PERSIST_KEY_REQUIRED`: `persist.key` missing → Zustand requires a unique storage key; pass `{ name: 'unique-key' }` to the persist options
- `E_TYPECHECK_UNAVAILABLE`: `typecheck` script missing → run `pnpm -C apps/frontend tsc --noEmit` directly

## Reference

See `docs/project-overview.md` → "FE-03 — Zustand store slice" and the `usePayInvoiceStore` template.
