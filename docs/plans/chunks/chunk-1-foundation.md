## Phase 1: Monorepo Foundation (Tasks 1–5)

---

### Task 1: Init Monorepo Root

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.npmrc`
- Create: `.gitignore`
- Create: `.env.example`

**Step 1: Create `package.json`**

```json
{
  "name": "news-agregator",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "test": "turbo run test",
    "test:integration": "turbo run test:integration",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "format": "prettier --write \"**/*.{ts,tsx,json,md}\""
  },
  "devDependencies": {
    "turbo": "^2.3.3",
    "prettier": "^3.4.2",
    "prettier-plugin-tailwindcss": "^0.6.11"
  },
  "packageManager": "pnpm@9.15.4"
}
```

**Step 2: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**Step 3: Create `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "test": { "dependsOn": ["^build"] },
    "test:integration": { "dependsOn": ["^build"] },
    "lint": {},
    "typecheck": { "dependsOn": ["^build"] }
  }
}
```

**Step 4: Create `.npmrc`**

```
shamefully-hoist=false
strict-peer-dependencies=false
```

**Step 5: Create `.gitignore`**

```
node_modules
dist
.turbo
*.env
.env.*
!.env.example
generated
```

**Step 6: Create `.env.example`**

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/newsaggregator?schema=public
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

**Step 7: Run to verify**

```bash
pnpm install
```

Expected: Lock file is generated, `node_modules` is created at the root, no peer-dependency errors.

**Step 8: Commit**

```bash
git add package.json pnpm-workspace.yaml turbo.json .npmrc .gitignore .env.example
git commit -m "chore(root): init monorepo with pnpm workspaces and Turborepo"
```

---

### Task 2: packages/config — Shared TypeScript, ESLint, Prettier

**Files:**
- Create: `packages/config/package.json`
- Create: `packages/config/tsconfig.base.json`
- Create: `packages/config/prettier.config.js`
- Create: `packages/config/eslint.config.js`

**Step 1: Create `packages/config/package.json`**

```json
{
  "name": "@repo/config",
  "version": "0.0.1",
  "private": true,
  "exports": {
    "./eslint": "./eslint.config.js",
    "./tsconfig": "./tsconfig.base.json",
    "./prettier": "./prettier.config.js"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^8.20.0",
    "@typescript-eslint/parser": "^8.20.0",
    "eslint": "^9.17.0",
    "eslint-plugin-boundaries": "^5.0.1",
    "typescript-eslint": "^8.20.0",
    "prettier": "^3.4.2",
    "prettier-plugin-tailwindcss": "^0.6.11"
  }
}
```

**Step 2: Create `packages/config/tsconfig.base.json`**

This is the base TypeScript configuration extended by every app and package in the monorepo. `moduleResolution: "bundler"` is used because both the API (esbuild) and web (Vite) use bundlers rather than Node's native resolver.

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "exactOptionalPropertyTypes": false,
    "skipLibCheck": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

**Step 3: Create `packages/config/prettier.config.js`**

```js
/** @type {import('prettier').Config} */
export default {
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  plugins: ['prettier-plugin-tailwindcss'],
}
```

**Step 4: Create `packages/config/eslint.config.js`**

This is the base ESLint flat config for backend packages. Frontend apps will extend it and add React-specific rules.

```js
import tseslint from 'typescript-eslint'

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
)
```

**Step 5: Run to verify**

```bash
pnpm install
```

Expected: `@repo/config` is linked into the workspace, no errors.

**Step 6: Commit**

```bash
git add packages/config/
git commit -m "chore(config): add shared TypeScript, ESLint, and Prettier configs"
```

---

### Task 3: packages/db — Prisma Schema and Client Factory

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/prisma/schema.prisma`
- Create: `packages/db/src/index.ts`
- Create: `packages/db/prisma/seed.ts`

**Step 1: Create `packages/db/package.json`**

```json
{
  "name": "@repo/db",
  "version": "0.0.1",
  "private": true,
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^6.3.0"
  },
  "devDependencies": {
    "prisma": "^6.3.0",
    "tsx": "^4.19.2",
    "typescript": "^5.7.3"
  }
}
```

**Step 2: Create `packages/db/tsconfig.json`**

```json
{
  "extends": "@repo/config/tsconfig",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src/**/*", "prisma/**/*"]
}
```

**Step 3: Create `packages/db/prisma/schema.prisma`**

The schema models:
- `User` — application user with hashed password.
- `RefreshToken` — stored refresh tokens; cascades on user delete.
- `UserPreferences` — one-to-one extension of User for theme/language settings.
- `Source` — RSS feed source.
- `Category` — bilingual category with keyword list used by the worker for classification.
- `Article` — fetched news item; `guid` is unique to deduplicate across fetches.
- `Bookmark` — many-to-many join between User and Article with a composite unique constraint.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  avatarUrl    String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  refreshTokens RefreshToken[]
  bookmarks     Bookmark[]
  preferences   UserPreferences?
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model UserPreferences {
  id       String @id @default(cuid())
  userId   String @unique
  theme    Theme  @default(LIGHT)
  language String @default("en")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Source {
  id       String    @id @default(cuid())
  name     String
  feedUrl  String    @unique
  articles Article[]
}

model Category {
  id       String   @id @default(cuid())
  slug     String   @unique
  nameEn   String
  nameRu   String
  keywords String[]

  articles Article[]
}

model Article {
  id          String   @id @default(cuid())
  guid        String   @unique
  title       String
  summary     String?
  url         String
  imageUrl    String?
  publishedAt DateTime
  fetchedAt   DateTime @default(now())
  sourceId    String
  categoryId  String?

  source    Source    @relation(fields: [sourceId], references: [id])
  category  Category? @relation(fields: [categoryId], references: [id])
  bookmarks Bookmark[]
}

model Bookmark {
  id        String   @id @default(cuid())
  userId    String
  articleId String
  createdAt DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  article Article @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@unique([userId, articleId])
}

enum Theme {
  LIGHT
  DARK
}
```

**Step 4: Create `packages/db/src/index.ts`**

The factory function accepts an optional `url` override, which is required for integration tests that spin up isolated containers with dynamic connection strings.

```ts
import { PrismaClient } from '@prisma/client'

export * from '@prisma/client'

export function createPrismaClient(url?: string): PrismaClient {
  return new PrismaClient({
    datasources: url ? { db: { url } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}
```

**Step 5: Create `packages/db/prisma/seed.ts`**

```ts
import { createPrismaClient } from '../src/index'

const prisma = createPrismaClient()

const categories = [
  {
    slug: 'technology',
    nameEn: 'Technology',
    nameRu: 'Технологии',
    keywords: [
      'tech', 'software', 'ai', 'programming', 'code', 'developer',
      'startup', 'app', 'digital', 'cyber', 'robot', 'machine learning',
      'javascript', 'python',
    ],
  },
  {
    slug: 'science',
    nameEn: 'Science',
    nameRu: 'Наука',
    keywords: [
      'science', 'research', 'study', 'discovery', 'biology', 'physics',
      'chemistry', 'climate', 'space', 'nasa', 'experiment',
    ],
  },
  {
    slug: 'business',
    nameEn: 'Business',
    nameRu: 'Бизнес',
    keywords: [
      'business', 'economy', 'market', 'stock', 'finance', 'trade',
      'investment', 'startup', 'company', 'revenue', 'profit', 'gdp',
    ],
  },
  {
    slug: 'politics',
    nameEn: 'Politics',
    nameRu: 'Политика',
    keywords: [
      'politics', 'government', 'election', 'president', 'congress',
      'senate', 'law', 'policy', 'democrat', 'republican', 'vote',
    ],
  },
  {
    slug: 'health',
    nameEn: 'Health',
    nameRu: 'Здоровье',
    keywords: [
      'health', 'medical', 'disease', 'vaccine', 'hospital', 'doctor',
      'medicine', 'virus', 'cancer', 'mental health', 'wellness',
    ],
  },
  {
    slug: 'world',
    nameEn: 'World',
    nameRu: 'Мир',
    keywords: [
      'world', 'international', 'global', 'country', 'war', 'conflict',
      'united nations', 'europe', 'asia', 'africa', 'diplomacy',
    ],
  },
]

const sources = [
  { name: 'BBC News', feedUrl: 'https://feeds.bbci.co.uk/news/rss.xml' },
  { name: 'Reuters', feedUrl: 'https://feeds.reuters.com/reuters/topNews' },
  { name: 'Hacker News', feedUrl: 'https://hnrss.org/frontpage' },
  { name: 'TechCrunch', feedUrl: 'https://techcrunch.com/feed/' },
]

async function main() {
  console.log('Seeding categories...')
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
  }

  console.log('Seeding sources...')
  for (const src of sources) {
    await prisma.source.upsert({
      where: { feedUrl: src.feedUrl },
      update: {},
      create: src,
    })
  }

  console.log('Seed complete.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

**Step 6: Run to verify — generate Prisma client**

Requires `DATABASE_URL` to be set in the shell environment (copy from `.env.example` and fill in real values).

```bash
pnpm --filter @repo/db db:generate
```

Expected: `Generated Prisma Client` message. A `node_modules/.prisma/client` directory is created.

**Step 7: Run to verify — create initial migration**

```bash
pnpm --filter @repo/db db:migrate
```

When prompted for a migration name, enter: `init`

Expected: `Your database is now in sync with your schema.`

**Step 8: Run to verify — seed the database**

```bash
pnpm --filter @repo/db db:seed
```

Expected:
```
Seeding categories...
Seeding sources...
Seed complete.
```

**Step 9: Commit**

```bash
git add packages/db/
git commit -m "feat(db): add Prisma schema, client factory, and seed data"
```

---

### Task 4: packages/contracts — Zod Schemas

**Files:**
- Create: `packages/contracts/package.json`
- Create: `packages/contracts/tsconfig.json`
- Create: `packages/contracts/src/auth.ts`
- Create: `packages/contracts/src/user.ts`
- Create: `packages/contracts/src/news.ts`
- Create: `packages/contracts/src/index.ts`

**Step 1: Create `packages/contracts/package.json`**

```json
{
  "name": "@repo/contracts",
  "version": "0.0.1",
  "private": true,
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "typescript": "^5.7.3"
  }
}
```

**Step 2: Create `packages/contracts/tsconfig.json`**

```json
{
  "extends": "@repo/config/tsconfig",
  "compilerOptions": { "outDir": "./dist" },
  "include": ["src/**/*"]
}
```

**Step 3: Create `packages/contracts/src/auth.ts`**

Request/response shapes for registration and login. `authResponseSchema` is shared between the API response serializer and the web client's fetch layer.

```ts
import { z } from 'zod'

export const registerRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100),
})

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const authResponseSchema = z.object({
  accessToken: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
    avatarUrl: z.string().nullable(),
  }),
})

export type RegisterRequest = z.infer<typeof registerRequestSchema>
export type LoginRequest = z.infer<typeof loginRequestSchema>
export type AuthResponse = z.infer<typeof authResponseSchema>
```

**Step 4: Create `packages/contracts/src/user.ts`**

```ts
import { z } from 'zod'

export const userProfileSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
  preferences: z
    .object({
      theme: z.enum(['LIGHT', 'DARK']),
      language: z.string(),
    })
    .nullable(),
})

export const updateProfileRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().nullable().optional(),
})

export const updatePreferencesRequestSchema = z.object({
  theme: z.enum(['LIGHT', 'DARK']).optional(),
  language: z.string().min(2).max(10).optional(),
})

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8).max(100),
})

export type UserProfile = z.infer<typeof userProfileSchema>
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>
export type UpdatePreferencesRequest = z.infer<typeof updatePreferencesRequestSchema>
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>
```

**Step 5: Create `packages/contracts/src/news.ts`**

`articleListQuerySchema` uses `z.coerce.number()` so that URL query-string values (which arrive as strings) are automatically coerced to numbers by Fastify before route handler execution.

```ts
import { z } from 'zod'

export const categorySchema = z.object({
  id: z.string(),
  slug: z.string(),
  nameEn: z.string(),
  nameRu: z.string(),
})

export const articleSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string().nullable(),
  url: z.string(),
  imageUrl: z.string().nullable(),
  publishedAt: z.string(),
  source: z.object({ id: z.string(), name: z.string() }),
  category: categorySchema.nullable(),
  isBookmarked: z.boolean(),
})

export const articleListQuerySchema = z.object({
  categoryId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export const articleListResponseSchema = z.object({
  items: z.array(articleSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

export type Category = z.infer<typeof categorySchema>
export type Article = z.infer<typeof articleSchema>
export type ArticleListQuery = z.infer<typeof articleListQuerySchema>
export type ArticleListResponse = z.infer<typeof articleListResponseSchema>
```

**Step 6: Create `packages/contracts/src/index.ts`**

```ts
export * from './auth'
export * from './user'
export * from './news'
```

**Step 7: Run to verify**

```bash
pnpm install
pnpm --filter @repo/contracts tsc --noEmit
```

Expected: No TypeScript errors, no output.

**Step 8: Commit**

```bash
git add packages/contracts/
git commit -m "feat(contracts): add Zod schemas for auth, user, and news domains"
```

---

### Task 5: apps/api — Fastify Server Foundation

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/eslint.config.js`
- Create: `apps/api/vitest.config.ts`
- Create: `apps/api/vitest.integration.config.ts`
- Create: `apps/api/src/shared/errors.ts`
- Create: `apps/api/src/infrastructure/server.ts`
- Create: `apps/api/src/infrastructure/server.test.ts`
- Create: `apps/api/src/main.ts`

**Step 1: Create `apps/api/package.json`**

```json
{
  "name": "api",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/main.ts",
    "build": "tsc --noEmit && esbuild src/main.ts --bundle --platform=node --target=node24 --outfile=dist/main.js --external:@prisma/client --external:.prisma",
    "start": "node dist/main.js",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:integration": "vitest run --config vitest.integration.config.ts"
  },
  "dependencies": {
    "@fastify/cookie": "^11.0.1",
    "@fastify/cors": "^10.0.1",
    "@fastify/jwt": "^9.0.1",
    "@fastify/sensible": "^6.0.2",
    "@repo/contracts": "workspace:*",
    "@repo/db": "workspace:*",
    "bcryptjs": "^2.4.3",
    "fastify": "^5.2.1",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@repo/config": "workspace:*",
    "@testcontainers/core": "^10.16.0",
    "@testcontainers/postgresql": "^10.16.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^22.10.5",
    "esbuild": "^0.25.0",
    "tsx": "^4.19.2",
    "typescript": "^5.7.3",
    "vitest": "^2.1.8"
  }
}
```

**Step 2: Create `apps/api/tsconfig.json`**

```json
{
  "extends": "@repo/config/tsconfig",
  "compilerOptions": {
    "outDir": "./dist",
    "baseUrl": ".",
    "lib": ["ES2022"]
  },
  "include": ["src/**/*"]
}
```

**Step 3: Create `apps/api/eslint.config.js`**

Extends the shared base config. The `tsconfigRootDir` points to the app's own `tsconfig.json` so that typed linting rules (`@typescript-eslint/recommended-type-checked`) resolve the project correctly.

```js
import baseConfig from '@repo/config/eslint'
import tseslint from 'typescript-eslint'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default tseslint.config(
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
)
```

**Step 4: Create `apps/api/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['src/**/*.integration.test.ts'],
  },
})
```

**Step 5: Create `apps/api/vitest.integration.config.ts`**

`pool: 'forks'` with `singleFork: true` ensures integration tests run serially in a single child process, which is required when each test file manages its own PostgreSQL container lifecycle.

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.integration.test.ts'],
    testTimeout: 60000,
    hookTimeout: 60000,
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
  },
})
```

**Step 6: Create `apps/api/src/shared/errors.ts`**

All domain errors extend a single `DomainError` base so the Fastify error handler can discriminate them with `instanceof` checks without importing each subclass individually.

```ts
export class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}

export class EmailAlreadyExistsError extends DomainError {}
export class InvalidCredentialsError extends DomainError {}
export class InvalidTokenError extends DomainError {}
export class NotFoundError extends DomainError {}
export class ForbiddenError extends DomainError {}
export class ValidationError extends DomainError {}
```

**Step 7 (TDD — RED): Create the failing test `apps/api/src/infrastructure/server.test.ts`**

Write the test before implementing the server module. At this point the import will fail because `server.ts` does not exist yet.

```ts
import { describe, it, expect } from 'vitest'
import { buildServer } from './server.js'

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const server = buildServer({ jwtSecret: 'test-secret', corsOrigin: '*' })
    const response = await server.inject({ method: 'GET', url: '/health' })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
  })
})
```

**Step 8: Run to verify (expect FAIL)**

```bash
pnpm --filter api vitest run src/infrastructure/server.test.ts
```

Expected: Test run fails with a module resolution error — `Cannot find module './server.js'`. This confirms the test is wired up correctly and is genuinely failing for the right reason.

**Step 9 (TDD — GREEN): Create `apps/api/src/infrastructure/server.ts`**

The error handler maps domain errors to the correct HTTP status codes before falling back to a generic 500 response. Fastify's own validation errors (from JSON Schema) bubble up as 400s automatically, but Zod errors thrown inside route handlers must be caught here explicitly.

```ts
import Fastify from 'fastify'
import fastifyCookie from '@fastify/cookie'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'
import fastifySensible from '@fastify/sensible'
import { ZodError } from 'zod'
import {
  DomainError,
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  InvalidTokenError,
  NotFoundError,
  ForbiddenError,
} from '../shared/errors.js'

export function buildServer(opts: { jwtSecret: string; corsOrigin: string }) {
  const fastify = Fastify({ logger: true })

  fastify.register(fastifyCors, { origin: opts.corsOrigin, credentials: true })
  fastify.register(fastifyJwt, { secret: opts.jwtSecret })
  fastify.register(fastifyCookie)
  fastify.register(fastifySensible)

  fastify.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ message: 'Validation error', errors: error.errors })
    }
    if (error instanceof EmailAlreadyExistsError) {
      return reply.code(409).send({ message: error.message })
    }
    if (error instanceof InvalidCredentialsError || error instanceof InvalidTokenError) {
      return reply.code(401).send({ message: error.message })
    }
    if (error instanceof NotFoundError) {
      return reply.code(404).send({ message: error.message })
    }
    if (error instanceof ForbiddenError) {
      return reply.code(403).send({ message: error.message })
    }
    if (error instanceof DomainError) {
      return reply.code(400).send({ message: error.message })
    }
    fastify.log.error(error)
    return reply.code(500).send({ message: 'Internal server error' })
  })

  fastify.get('/health', async () => ({ status: 'ok' }))

  return fastify
}
```

**Step 10: Create `apps/api/src/main.ts`**

```ts
import { buildServer } from './infrastructure/server.js'

const server = buildServer({
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
})

const port = Number(process.env.PORT ?? 3001)

server.listen({ port, host: '0.0.0.0' }, (err) => {
  if (err) {
    server.log.error(err)
    process.exit(1)
  }
})
```

**Step 11: Install dependencies**

```bash
pnpm install
```

**Step 12: Run to verify (expect PASS)**

```bash
pnpm --filter api vitest run src/infrastructure/server.test.ts
```

Expected:
```
 PASS  src/infrastructure/server.test.ts
  GET /health
    ✓ returns 200 with status ok
```

**Step 13: Run TypeScript check**

```bash
pnpm --filter api typecheck
```

Expected: No errors, no output.

**Step 14: Smoke-test the dev server**

```bash
pnpm --filter api dev
```

In a separate terminal:

```bash
curl http://localhost:3001/health
```

Expected:
```json
{"status":"ok"}
```

Stop the dev server with `Ctrl+C`.

**Step 15: Commit**

```bash
git add apps/api/
git commit -m "feat(api): scaffold Fastify server with health endpoint"
```
