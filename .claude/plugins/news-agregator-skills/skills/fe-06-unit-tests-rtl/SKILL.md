---
name: fe-06-unit-tests-rtl
description: This skill should be used when the user asks to "add RTL tests", "add unit tests for a React component", "test a React component with Testing Library", "add Vitest component tests", or "scaffold frontend component tests".
version: 0.1.0
---

# FE-06: Unit tests with RTL (component + hook)

Create Vitest + React Testing Library tests for components and hooks. Test user behavior, not implementation details.

## Inputs

- `componentPath` (required): path to the component or hook file (e.g., `apps/frontend/src/features/billing/pay-invoice/ui/pay-invoice-button.tsx`)
- `scenarios` (required): array of test scenario descriptions (e.g., `"renders button"`, `"disables during loading"`)

## Outputs

Creates `<component-path-without-extension>.test.tsx` adjacent to the component.

## Preconditions

- Vitest configured with `jsdom` environment in `apps/frontend/vitest.config.ts`
- `@testing-library/react` and `@testing-library/user-event` installed

## Workflow

1. Locate the component/hook file at `componentPath`

2. Create `.test.tsx` adjacent to it with one `it()` per scenario:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ComponentName } from './component-name';

// Factory keeps each test isolated with a fresh QueryClient
const makeQc = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

// Generate one it() per entry in the `scenarios` input array.
// Replace '<scenario-N-description>' with the actual scenario string from inputs.
describe('ComponentName', () => {
  it('<scenario-1-description>', async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={makeQc()}>
        <ComponentName />
      </QueryClientProvider>
    );
    // TODO: interact and assert based on the scenario description
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('<scenario-2-description>', async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={makeQc()}>
        <ComponentName />
      </QueryClientProvider>
    );
    // TODO: interact and assert based on the scenario description
    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toBeDisabled();
  });

  // Add one it() block for each remaining item in scenarios[]
});
```

3. Wrap with `QueryClientProvider` and other required providers if the component uses TanStack Query or Router

4. For components using React Router, wrap with `<MemoryRouter>`:

```tsx
import { MemoryRouter } from 'react-router-dom';
// <MemoryRouter initialEntries={['/path']}><ComponentName /></MemoryRouter>
```

5. Run `pnpm -C apps/frontend test` to verify all scenarios pass

## Test principles (enforce these)

- Query by ARIA role or visible text, not test IDs or class names
- Never assert on internal state — only what the user can see
- Use `userEvent.setup()` for interactions (not `fireEvent`)

## Error conditions

- `E_RENDER_FAIL`: Component throws on render → check missing providers and add them to the test wrapper
- `E_QUERY_AMBIGUOUS`: Multiple elements match the query → use `getAllByRole` or add `aria-label` to the element
- `E_TEST_UNAVAILABLE`: `test` script missing → run `pnpm -C apps/frontend vitest run` directly

## Reference

See `docs/project-overview.md` → "FE-06 — Unit tests with RTL" and the `PayInvoiceButton` test template.
