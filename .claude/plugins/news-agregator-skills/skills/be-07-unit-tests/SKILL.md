---
name: be-07-unit-tests
description: This skill should be used when the user asks to "add unit tests for domain", "generate unit tests for a use-case", "test a use-case with Vitest", "scaffold backend unit tests", or "add tests for the application layer".
version: 0.1.0
---

# BE-07: Unit tests for Domain/Application (Vitest)

Scaffold Vitest unit tests for domain entities/policies and application use-cases. Tests must run without a database or HTTP server — use in-memory mocks for ports.

## Inputs

- `moduleName` (required): existing module name
- `target` (required): `'domain'` or `'application'`
- `subjectName` (required): class/function to test (e.g., `CreateArticleUseCase`, `ArticlePolicy`)

## Outputs

Creates adjacent to the implementation file:

- `apps/backend/src/modules/<moduleName>/<target>/<subject-name>.test.ts` — Vitest test file

## Preconditions

- Subject file exists at the expected path
- Vitest configured in `apps/backend/vitest.config.ts` (or `vitest.config.js`)

## Workflow

1. Locate the subject file. For `target=application`, look in `application/use-cases/<subject-name>.usecase.ts`. For `target=domain`, look in `domain/<subject-name>.ts`.

2. Create `<subject-name>.test.ts` adjacent to the subject file:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { <SubjectName> } from './<subject-name>';

describe('<SubjectName>', () => {
  // Happy path: mock all outbound ports with plain objects
  const mockRepo = {
    create: vi.fn().mockResolvedValue({ id: 'id_1' }),
    findById: vi.fn().mockResolvedValue(null),
  };

  it('happy path: [describe the expected outcome]', async () => {
    const subject = new <SubjectName>(mockRepo as any);
    const result = await subject.execute({
      // TODO: valid input matching commandShape
    });
    expect(result).toMatchObject({
      // TODO: expected output matching resultShape
    });
  });

  it('edge case: throws on invalid input', async () => {
    const subject = new <SubjectName>(mockRepo as any);
    await expect(
      subject.execute({} /* missing required fields */)
    ).rejects.toThrow();
  });
});
```

3. Run `pnpm -C apps/backend test` to verify tests are found and pass

## Test design rules (enforce these when writing tests)

- Mock all outbound ports with plain objects or `vi.fn()` — never use real databases in unit tests
- Assert on return values and thrown errors, not on mock call counts
- Name each `it` with a plain-language description of expected behavior, not the implementation

## Error conditions

- `E_SUBJECT_NOT_FOUND`: Subject file does not exist → run BE-01/BE-02 first to create the module and use-case
- `E_TEST_UNAVAILABLE`: `test` script missing from `apps/backend/package.json` → run `pnpm -C apps/backend vitest run` directly

## Reference

See `docs/project-overview.md` → "BE-07 — Unit tests for Domain/Application" and the `CreateInvoiceUseCase` test template.
