---
name: fe-02-feature-module
description: This skill should be used when the user asks to "create a feature module", "add a feature", "scaffold a feature with ui/model/api", "create a feature with store and API", or "add a full FSD feature".
version: 0.1.0
---

# FE-02: Create feature module (ui/model/api) + public API

Create a complete FSD feature slice with a UI component, state/model, API fetching hook, and public API export.

## Inputs

- `featureName` (required): kebab-case path inside features (e.g., `billing/pay-invoice`)
- `uiComponentName` (required): PascalCase component name (e.g., `PayInvoiceButton`)
- `storeShape` (optional): Zustand store state fields — omit to skip `model/store.ts`
- `apiContract` (optional): contract type from `packages/contracts`

## Outputs

Creates `apps/frontend/src/features/<featureName>/`:

```
<featureName>/
├── ui/
│   └── <component-name>.tsx     # React component
├── model/
│   └── store.ts                 # Zustand store (if storeShape provided)
├── api/
│   └── <feature-name>.ts        # TanStack Query mutation/query
└── index.ts                     # Public API: export component + store hooks
```

## Preconditions

- `apps/frontend/src/features/` directory exists
- TanStack Query `QueryClient` configured in `app/` layer

## Workflow

1. Create all four directories (`ui/`, `model/`, `api/`) plus `index.ts`

2. Create `ui/<component-name>.tsx`:

```tsx
import type { FC } from 'react';

interface <ComponentName>Props {
  // TODO: add props matching the feature's requirements
}

export const <ComponentName>: FC<<ComponentName>Props> = (props) => {
  return (
    <button type="button" className="rounded px-4 py-2 font-medium">
      {/* TODO: render content using props */}
    </button>
  );
};
```

3. If `storeShape` provided, create `model/store.ts` (see FE-03 for the full persist variant):

```typescript
import { create } from 'zustand';

type State = {
  // TODO: add fields from storeShape
};

export const use<FeatureName>Store = create<State>()((set) => ({
  // TODO: default values and action implementations
}));
```

4. Create `api/<feature-name>.ts` with a `useMutation` hook:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function use<FeatureName>Mutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: unknown /* TODO: use contract type */) => {
      // TODO: call the API endpoint
    },
    onSuccess: () => {
      // TODO: invalidate related queries
      // queryClient.invalidateQueries({ queryKey: ['<scope>'] });
    },
  });
}
```

5. Export component and store hook from `index.ts`:

```typescript
export { <ComponentName> } from './ui/<component-name>';
// export { use<FeatureName>Store } from './model/store'; // uncomment if store created
// export { use<FeatureName>Mutation } from './api/<feature-name>'; // export if needed outside
```

6. Run `pnpm -C apps/frontend lint`

## Error conditions

- `E_PUBLIC_API_MISSING`: Forgot to add exports to `index.ts` → re-run lint, boundary rules will catch imports bypassing public API
- `E_LINT_UNAVAILABLE`: `lint` script missing → run `pnpm -C apps/frontend eslint src/` directly

## Reference

See `docs/project-overview.md` → "FE-02 — Create feature module" and the `PayInvoiceButton` template.
