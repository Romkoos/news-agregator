---
name: be-04-repo-port
description: This skill should be used when the user asks to "add a repository port", "create a Prisma adapter", "add an outbound port", "add a database repository", or "scaffold a repository interface".
version: 0.1.0
---

# BE-04: Add repository port + Prisma adapter

Declare an outbound repository port (interface) and implement a Prisma adapter with domain-to-DB mapping.

## Inputs

- `moduleName` (required): existing module name
- `repoName` (required): PascalCase (e.g., `ArticleRepository`)
- `entityName` (required): domain entity name (e.g., `Article`)
- `operations` (required): array of method signatures (e.g., `['create', 'findById', 'list']`)

## Outputs

Creates inside `apps/backend/src/modules/<moduleName>/`:

- `ports/outbound/<repo-name>.ts` — TypeScript interface with declared operations
- `adapters/persistence/prisma/<entity-name>.mapper.ts` — domain to Prisma model mapper
- `adapters/persistence/prisma/<repo-name>.prisma.ts` — Prisma implementation of the interface

## Preconditions

- Module exists (BE-01)
- `@prisma/client` installed and generated (`pnpm prisma generate` run)
- The Prisma model for `entityName` exists in `apps/backend/prisma/schema.prisma`

## Workflow

1. Verify module directory and Prisma model exist
2. Create `ports/outbound/<repo-name>.ts`:

```typescript
export interface <RepoName> {
  create(data: Create<EntityName>Data): Promise<<EntityName>>;
  findById(id: string): Promise<<EntityName> | null>;
  // TODO: add operations listed in inputs
}

export type Create<EntityName>Data = {
  // TODO: fields needed to create
};

export type <EntityName> = {
  id: string;
  // TODO: domain entity fields
};
```

3. Create `adapters/persistence/prisma/<entity-name>.mapper.ts`:

```typescript
import type { <PrismaModelName> } from '@prisma/client';
import type { <EntityName> } from '../../../ports/outbound/<repo-name>';

export function toDomain(record: <PrismaModelName>): <EntityName> {
  return {
    id: record.id,
    // TODO: map Prisma fields to domain fields
  };
}

export function toPrismaCreate(data: Create<EntityName>Data): Omit<<PrismaModelName>, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    // TODO: map domain create data to Prisma input fields
  } as any;
}
```

Note: `<PrismaModelName>` is typically the same as `entityName` in PascalCase — verify the exact name in `apps/backend/prisma/schema.prisma`.

4. Create `adapters/persistence/prisma/<repo-name>.prisma.ts`:

```typescript
import type { PrismaClient } from '@prisma/client';
import type { <RepoName>, Create<EntityName>Data, <EntityName> } from '../../../ports/outbound/<repo-name>';
import { toDomain, toPrismaCreate } from './<entity-name>.mapper';

export class Prisma<RepoName> implements <RepoName> {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: Create<EntityName>Data): Promise<<EntityName>> {
    const record = await this.prisma.<modelName>.create({ data: toPrismaCreate(data) });
    return toDomain(record);
  }

  async findById(id: string): Promise<<EntityName> | null> {
    const record = await this.prisma.<modelName>.findUnique({ where: { id } });
    return record ? toDomain(record) : null;
  }
  // TODO: implement remaining operations
}
```

5. Export the port interface from `index.ts`
6. Run `pnpm -C apps/backend typecheck`

## Error conditions

- `E_PRISMA_CLIENT_MISSING`: `@prisma/client` not installed or schema not generated → run `pnpm -C apps/backend prisma generate`
- `E_PORT_EXISTS`: Port interface file already exists → ask user to extend or overwrite
- `E_TYPECHECK_UNAVAILABLE`: `typecheck` script missing → run `pnpm -C apps/backend tsc --noEmit` directly

## Reference

See `docs/project-overview.md` → "BE-04 — Add repository port + Prisma adapter" for the port/adapter/mapper pattern.
