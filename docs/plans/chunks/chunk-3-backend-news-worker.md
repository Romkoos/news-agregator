## Phase 3: Backend — News Module & Worker (Tasks 11–13)

---

### Task 11: News module — ports, use-cases, routes, integration tests

**Files:**
- Create: `apps/api/src/modules/news/ports/article.repository.port.ts`
- Create: `apps/api/src/modules/news/ports/bookmark.repository.port.ts`
- Create: `apps/api/src/modules/news/ports/category.repository.port.ts`
- Create: `apps/api/src/modules/news/application/list-articles.use-case.ts`
- Create: `apps/api/src/modules/news/application/get-article.use-case.ts`
- Create: `apps/api/src/modules/news/application/toggle-bookmark.use-case.ts`
- Create: `apps/api/src/modules/news/application/get-bookmarks.use-case.ts`
- Create: `apps/api/src/modules/news/application/list-categories.use-case.ts`
- Create: `apps/api/src/modules/news/adapters/prisma/prisma-article.repository.ts`
- Create: `apps/api/src/modules/news/adapters/prisma/prisma-bookmark.repository.ts`
- Create: `apps/api/src/modules/news/adapters/prisma/prisma-category.repository.ts`
- Create: `apps/api/src/modules/news/adapters/http/news.routes.ts`
- Create: `apps/api/src/modules/news/tests/news.integration.test.ts`

---

**Step 1: Write failing test**

Create `apps/api/src/modules/news/tests/news.integration.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { execSync } from 'child_process'
import { createPrismaClient } from '@repo/db'
import { buildServer } from '../../../infrastructure/server.js'
import { PrismaArticleRepository } from '../adapters/prisma/prisma-article.repository.js'
import { PrismaBookmarkRepository } from '../adapters/prisma/prisma-bookmark.repository.js'
import { PrismaCategoryRepository } from '../adapters/prisma/prisma-category.repository.js'
import { ListCategoriesUseCase } from '../application/list-categories.use-case.js'
import { ListArticlesUseCase } from '../application/list-articles.use-case.js'
import { GetArticleUseCase } from '../application/get-article.use-case.js'
import { ToggleBookmarkUseCase } from '../application/toggle-bookmark.use-case.js'
import { GetBookmarksUseCase } from '../application/get-bookmarks.use-case.js'
import { registerNewsRoutes } from '../adapters/http/news.routes.js'
import type { FastifyInstance } from 'fastify'

let container: any
let prisma: ReturnType<typeof createPrismaClient>
let server: FastifyInstance

let userId: string
let categoryId: string
let sourceId: string
let articleId1: string
let articleId2: string
let articleId3: string
let authToken: string

beforeAll(async () => {
  // Start PostgreSQL container
  container = await new PostgreSqlContainer().start()
  const url = container.getConnectionUri()

  // Run migrations
  execSync(`pnpm --filter @repo/db prisma migrate deploy`, {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'inherit',
  })

  prisma = createPrismaClient(url)

  // Seed: Category
  const category = await prisma.category.create({
    data: {
      slug: 'technology',
      nameEn: 'Technology',
      nameRu: 'Технологии',
      keywords: ['javascript', 'software', 'ai'],
    },
  })
  categoryId = category.id

  // Seed: Source
  const source = await prisma.source.create({
    data: {
      name: 'Test Feed',
      feedUrl: 'https://example.com/feed.xml',
    },
  })
  sourceId = source.id

  // Seed: Articles
  const article1 = await prisma.article.create({
    data: {
      guid: 'guid-1',
      title: 'JavaScript is amazing',
      summary: 'A deep dive into JS',
      url: 'https://example.com/article-1',
      publishedAt: new Date('2024-01-01T10:00:00Z'),
      sourceId: source.id,
      categoryId: category.id,
    },
  })
  articleId1 = article1.id

  const article2 = await prisma.article.create({
    data: {
      guid: 'guid-2',
      title: 'Node.js performance tips',
      summary: 'How to make Node faster',
      url: 'https://example.com/article-2',
      publishedAt: new Date('2024-01-02T10:00:00Z'),
      sourceId: source.id,
      categoryId: category.id,
    },
  })
  articleId2 = article2.id

  const article3 = await prisma.article.create({
    data: {
      guid: 'guid-3',
      title: 'General news article',
      summary: 'Something unrelated',
      url: 'https://example.com/article-3',
      publishedAt: new Date('2024-01-03T10:00:00Z'),
      sourceId: source.id,
      categoryId: null,
    },
  })
  articleId3 = article3.id

  // Seed: User
  const bcrypt = await import('bcryptjs')
  const passwordHash = await bcrypt.hash('Password123!', 10)
  const user = await prisma.user.create({
    data: {
      email: 'news-test@example.com',
      name: 'News Tester',
      passwordHash,
    },
  })
  userId = user.id

  // Build server and register routes
  server = buildServer({
    jwtSecret: 'test-secret',
    corsOrigin: 'http://localhost:5173',
  })

  const articleRepo = new PrismaArticleRepository(prisma)
  const bookmarkRepo = new PrismaBookmarkRepository(prisma)
  const categoryRepo = new PrismaCategoryRepository(prisma)

  registerNewsRoutes(server, {
    listCategories: new ListCategoriesUseCase(categoryRepo),
    listArticles: new ListArticlesUseCase(articleRepo, bookmarkRepo),
    getArticle: new GetArticleUseCase(articleRepo, bookmarkRepo),
    toggleBookmark: new ToggleBookmarkUseCase(bookmarkRepo, articleRepo),
    getBookmarks: new GetBookmarksUseCase(bookmarkRepo, articleRepo),
  })

  await server.ready()

  // Obtain JWT token by signing directly
  authToken = server.jwt.sign({ userId, email: 'news-test@example.com' })
}, 120_000)

afterAll(async () => {
  await server.close()
  await prisma.$disconnect()
  await container.stop()
})

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

describe('GET /news/categories', () => {
  it('returns 200 with an array of categories (no auth required)', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/news/categories',
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBeGreaterThanOrEqual(1)
    expect(body[0]).toMatchObject({
      id: categoryId,
      slug: 'technology',
      nameEn: 'Technology',
      nameRu: 'Технологии',
    })
  })
})

// ---------------------------------------------------------------------------
// Articles — auth guard
// ---------------------------------------------------------------------------

describe('GET /news/articles', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/news/articles',
    })
    expect(res.statusCode).toBe(401)
  })

  it('returns 200 with paginated articles when authenticated', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/news/articles?page=1&limit=10',
      headers: { authorization: `Bearer ${authToken}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toMatchObject({
      total: 3,
      page: 1,
      limit: 10,
    })
    expect(Array.isArray(body.items)).toBe(true)
    expect(body.items.length).toBe(3)

    // All articles should have isBookmarked = false initially
    for (const item of body.items) {
      expect(item.isBookmarked).toBe(false)
    }
  })

  it('filters articles by categoryId', async () => {
    const res = await server.inject({
      method: 'GET',
      url: `/news/articles?categoryId=${categoryId}&page=1&limit=10`,
      headers: { authorization: `Bearer ${authToken}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    // article3 has no category, so only 2 match
    expect(body.total).toBe(2)
    expect(body.items.length).toBe(2)
    for (const item of body.items) {
      expect(item.category?.id).toBe(categoryId)
    }
  })

  it('returns correct pagination metadata', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/news/articles?page=1&limit=2',
      headers: { authorization: `Bearer ${authToken}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.total).toBe(3)
    expect(body.page).toBe(1)
    expect(body.limit).toBe(2)
    expect(body.items.length).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// Single Article
// ---------------------------------------------------------------------------

describe('GET /news/articles/:id', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await server.inject({
      method: 'GET',
      url: `/news/articles/${articleId1}`,
    })
    expect(res.statusCode).toBe(401)
  })

  it('returns 200 with article and isBookmarked=false', async () => {
    const res = await server.inject({
      method: 'GET',
      url: `/news/articles/${articleId1}`,
      headers: { authorization: `Bearer ${authToken}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.id).toBe(articleId1)
    expect(body.title).toBe('JavaScript is amazing')
    expect(body.isBookmarked).toBe(false)
  })

  it('returns 404 for a non-existent article', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/news/articles/non-existent-id',
      headers: { authorization: `Bearer ${authToken}` },
    })
    expect(res.statusCode).toBe(404)
  })
})

// ---------------------------------------------------------------------------
// Bookmarks — toggle
// ---------------------------------------------------------------------------

describe('POST /news/articles/:id/bookmark', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await server.inject({
      method: 'POST',
      url: `/news/articles/${articleId1}/bookmark`,
    })
    expect(res.statusCode).toBe(401)
  })

  it('returns 204 and adds bookmark', async () => {
    const res = await server.inject({
      method: 'POST',
      url: `/news/articles/${articleId1}/bookmark`,
      headers: { authorization: `Bearer ${authToken}` },
    })
    expect(res.statusCode).toBe(204)
  })

  it('returns 204 idempotently when bookmark already exists', async () => {
    const res = await server.inject({
      method: 'POST',
      url: `/news/articles/${articleId1}/bookmark`,
      headers: { authorization: `Bearer ${authToken}` },
    })
    expect(res.statusCode).toBe(204)
  })

  it('GET /news/articles now shows isBookmarked=true for the bookmarked article', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/news/articles?page=1&limit=10',
      headers: { authorization: `Bearer ${authToken}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    const article = body.items.find((a: any) => a.id === articleId1)
    expect(article).toBeDefined()
    expect(article.isBookmarked).toBe(true)
  })

  it('GET /news/articles/:id shows isBookmarked=true', async () => {
    const res = await server.inject({
      method: 'GET',
      url: `/news/articles/${articleId1}`,
      headers: { authorization: `Bearer ${authToken}` },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().isBookmarked).toBe(true)
  })
})

describe('DELETE /news/articles/:id/bookmark', () => {
  it('returns 204 and removes the bookmark', async () => {
    const res = await server.inject({
      method: 'DELETE',
      url: `/news/articles/${articleId1}/bookmark`,
      headers: { authorization: `Bearer ${authToken}` },
    })
    expect(res.statusCode).toBe(204)
  })

  it('returns 204 idempotently when bookmark does not exist', async () => {
    const res = await server.inject({
      method: 'DELETE',
      url: `/news/articles/${articleId1}/bookmark`,
      headers: { authorization: `Bearer ${authToken}` },
    })
    expect(res.statusCode).toBe(204)
  })

  it('GET /news/articles now shows isBookmarked=false again', async () => {
    const res = await server.inject({
      method: 'GET',
      url: `/news/articles/${articleId1}`,
      headers: { authorization: `Bearer ${authToken}` },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().isBookmarked).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Bookmarks list
// ---------------------------------------------------------------------------

describe('GET /news/bookmarks', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/news/bookmarks',
    })
    expect(res.statusCode).toBe(401)
  })

  it('returns empty list when user has no bookmarks', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/news/bookmarks?page=1&limit=20',
      headers: { authorization: `Bearer ${authToken}` },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.items.length).toBe(0)
  })

  it('returns bookmarked articles with isBookmarked=true', async () => {
    // Add two bookmarks first
    await server.inject({
      method: 'POST',
      url: `/news/articles/${articleId2}/bookmark`,
      headers: { authorization: `Bearer ${authToken}` },
    })
    await server.inject({
      method: 'POST',
      url: `/news/articles/${articleId3}/bookmark`,
      headers: { authorization: `Bearer ${authToken}` },
    })

    const res = await server.inject({
      method: 'GET',
      url: '/news/bookmarks?page=1&limit=20',
      headers: { authorization: `Bearer ${authToken}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.items.length).toBe(2)
    for (const item of body.items) {
      expect(item.isBookmarked).toBe(true)
    }
    const ids = body.items.map((a: any) => a.id)
    expect(ids).toContain(articleId2)
    expect(ids).toContain(articleId3)
  })
})
```

**Step 2: Run (expect FAIL)**

```bash
pnpm --filter api vitest run src/modules/news/tests/news.integration.test.ts
```

Expected: FAIL — modules do not exist yet.

---

**Step 3: Implement**

**`apps/api/src/modules/news/ports/article.repository.port.ts`**

```ts
export interface ArticleWithRelations {
  id: string
  title: string
  summary: string | null
  url: string
  imageUrl: string | null
  publishedAt: Date
  source: { id: string; name: string }
  category: { id: string; slug: string; nameEn: string; nameRu: string } | null
}

export interface IArticleRepository {
  findMany(params: {
    categoryId?: string
    page: number
    limit: number
  }): Promise<{ items: ArticleWithRelations[]; total: number }>
  findById(id: string): Promise<ArticleWithRelations | null>
}
```

**`apps/api/src/modules/news/ports/bookmark.repository.port.ts`**

```ts
export interface IBookmarkRepository {
  findByUserAndArticle(userId: string, articleId: string): Promise<{ id: string } | null>
  create(userId: string, articleId: string): Promise<void>
  delete(userId: string, articleId: string): Promise<void>
  findByUserId(userId: string): Promise<Array<{ articleId: string }>>
}
```

**`apps/api/src/modules/news/ports/category.repository.port.ts`**

```ts
export interface CategoryEntity {
  id: string
  slug: string
  nameEn: string
  nameRu: string
}

export interface ICategoryRepository {
  findAll(): Promise<CategoryEntity[]>
}
```

**`apps/api/src/modules/news/application/list-categories.use-case.ts`**

```ts
import type { ICategoryRepository, CategoryEntity } from '../ports/category.repository.port.js'

export class ListCategoriesUseCase {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(): Promise<CategoryEntity[]> {
    return this.categoryRepo.findAll()
  }
}
```

**`apps/api/src/modules/news/application/list-articles.use-case.ts`**

```ts
import type { IArticleRepository, ArticleWithRelations } from '../ports/article.repository.port.js'
import type { IBookmarkRepository } from '../ports/bookmark.repository.port.js'

export interface ListArticlesParams {
  categoryId?: string
  page: number
  limit: number
  userId: string
}

export interface ArticleWithBookmark extends ArticleWithRelations {
  isBookmarked: boolean
}

export interface ListArticlesResult {
  items: ArticleWithBookmark[]
  total: number
  page: number
  limit: number
}

export class ListArticlesUseCase {
  constructor(
    private readonly articleRepo: IArticleRepository,
    private readonly bookmarkRepo: IBookmarkRepository,
  ) {}

  async execute(params: ListArticlesParams): Promise<ListArticlesResult> {
    const { categoryId, page, limit, userId } = params

    const [{ items, total }, bookmarks] = await Promise.all([
      this.articleRepo.findMany({ categoryId, page, limit }),
      this.bookmarkRepo.findByUserId(userId),
    ])

    const bookmarkedIds = new Set(bookmarks.map(b => b.articleId))

    return {
      items: items.map(item => ({
        ...item,
        isBookmarked: bookmarkedIds.has(item.id),
      })),
      total,
      page,
      limit,
    }
  }
}
```

**`apps/api/src/modules/news/application/get-article.use-case.ts`**

```ts
import type { IArticleRepository, ArticleWithRelations } from '../ports/article.repository.port.js'
import type { IBookmarkRepository } from '../ports/bookmark.repository.port.js'
import { NotFoundError } from '../../../shared/errors.js'

export interface GetArticleParams {
  id: string
  userId: string
}

export interface ArticleWithBookmark extends ArticleWithRelations {
  isBookmarked: boolean
}

export class GetArticleUseCase {
  constructor(
    private readonly articleRepo: IArticleRepository,
    private readonly bookmarkRepo: IBookmarkRepository,
  ) {}

  async execute(params: GetArticleParams): Promise<ArticleWithBookmark> {
    const { id, userId } = params

    const article = await this.articleRepo.findById(id)
    if (!article) {
      throw new NotFoundError(`Article with id "${id}" not found`)
    }

    const bookmark = await this.bookmarkRepo.findByUserAndArticle(userId, id)

    return {
      ...article,
      isBookmarked: bookmark !== null,
    }
  }
}
```

**`apps/api/src/modules/news/application/toggle-bookmark.use-case.ts`**

```ts
import type { IArticleRepository } from '../ports/article.repository.port.js'
import type { IBookmarkRepository } from '../ports/bookmark.repository.port.js'
import { NotFoundError } from '../../../shared/errors.js'

export interface ToggleBookmarkParams {
  userId: string
  articleId: string
  action: 'add' | 'remove'
}

export class ToggleBookmarkUseCase {
  constructor(
    private readonly bookmarkRepo: IBookmarkRepository,
    private readonly articleRepo: IArticleRepository,
  ) {}

  async execute(params: ToggleBookmarkParams): Promise<void> {
    const { userId, articleId, action } = params

    if (action === 'add') {
      const article = await this.articleRepo.findById(articleId)
      if (!article) {
        throw new NotFoundError(`Article with id "${articleId}" not found`)
      }
      // upsert — idempotent, no error if already exists
      await this.bookmarkRepo.create(userId, articleId)
    } else {
      // deleteMany — idempotent, no error if not found
      await this.bookmarkRepo.delete(userId, articleId)
    }
  }
}
```

**`apps/api/src/modules/news/application/get-bookmarks.use-case.ts`**

```ts
import type { IArticleRepository } from '../ports/article.repository.port.js'
import type { IBookmarkRepository } from '../ports/bookmark.repository.port.js'
import type { ArticleWithBookmark } from './list-articles.use-case.js'

export interface GetBookmarksParams {
  userId: string
  page: number
  limit: number
}

export interface GetBookmarksResult {
  items: ArticleWithBookmark[]
  total: number
  page: number
  limit: number
}

export class GetBookmarksUseCase {
  constructor(
    private readonly bookmarkRepo: IBookmarkRepository,
    private readonly articleRepo: IArticleRepository,
  ) {}

  async execute(params: GetBookmarksParams): Promise<GetBookmarksResult> {
    const { userId, page, limit } = params

    const bookmarks = await this.bookmarkRepo.findByUserId(userId)
    const articleIds = bookmarks.map(b => b.articleId)

    // Fetch all bookmarked articles in parallel, filter out any nulls
    const articleResults = await Promise.all(
      articleIds.map(id => this.articleRepo.findById(id)),
    )
    const articles = articleResults.filter((a): a is NonNullable<typeof a> => a !== null)

    const total = articles.length
    const start = (page - 1) * limit
    const pageItems = articles.slice(start, start + limit)

    return {
      items: pageItems.map(article => ({ ...article, isBookmarked: true })),
      total,
      page,
      limit,
    }
  }
}
```

**`apps/api/src/modules/news/adapters/prisma/prisma-article.repository.ts`**

```ts
import type { PrismaClient } from '@repo/db'
import type { IArticleRepository, ArticleWithRelations } from '../../ports/article.repository.port.js'

export class PrismaArticleRepository implements IArticleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany(params: {
    categoryId?: string
    page: number
    limit: number
  }): Promise<{ items: ArticleWithRelations[]; total: number }> {
    const { categoryId, page, limit } = params
    const where = categoryId ? { categoryId } : {}

    const [items, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: {
          source: { select: { id: true, name: true } },
          category: { select: { id: true, slug: true, nameEn: true, nameRu: true } },
        },
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.article.count({ where }),
    ])

    return { items, total }
  }

  async findById(id: string): Promise<ArticleWithRelations | null> {
    return this.prisma.article.findUnique({
      where: { id },
      include: {
        source: { select: { id: true, name: true } },
        category: { select: { id: true, slug: true, nameEn: true, nameRu: true } },
      },
    })
  }
}
```

**`apps/api/src/modules/news/adapters/prisma/prisma-bookmark.repository.ts`**

```ts
import type { PrismaClient } from '@repo/db'
import type { IBookmarkRepository } from '../../ports/bookmark.repository.port.js'

export class PrismaBookmarkRepository implements IBookmarkRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUserAndArticle(userId: string, articleId: string): Promise<{ id: string } | null> {
    return this.prisma.bookmark.findUnique({
      where: { userId_articleId: { userId, articleId } },
      select: { id: true },
    })
  }

  async create(userId: string, articleId: string): Promise<void> {
    await this.prisma.bookmark.upsert({
      where: { userId_articleId: { userId, articleId } },
      create: { userId, articleId },
      update: {},
    })
  }

  async delete(userId: string, articleId: string): Promise<void> {
    await this.prisma.bookmark.deleteMany({ where: { userId, articleId } })
  }

  async findByUserId(userId: string): Promise<Array<{ articleId: string }>> {
    return this.prisma.bookmark.findMany({
      where: { userId },
      select: { articleId: true },
    })
  }
}
```

**`apps/api/src/modules/news/adapters/prisma/prisma-category.repository.ts`**

```ts
import type { PrismaClient } from '@repo/db'
import type { ICategoryRepository, CategoryEntity } from '../../ports/category.repository.port.js'

export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<CategoryEntity[]> {
    return this.prisma.category.findMany({
      select: { id: true, slug: true, nameEn: true, nameRu: true },
      orderBy: { slug: 'asc' },
    })
  }
}
```

**`apps/api/src/modules/news/adapters/http/news.routes.ts`**

```ts
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { articleListQuerySchema } from '@repo/contracts'
import type { ListCategoriesUseCase } from '../../application/list-categories.use-case.js'
import type { ListArticlesUseCase } from '../../application/list-articles.use-case.js'
import type { GetArticleUseCase } from '../../application/get-article.use-case.js'
import type { ToggleBookmarkUseCase } from '../../application/toggle-bookmark.use-case.js'
import type { GetBookmarksUseCase } from '../../application/get-bookmarks.use-case.js'

export interface NewsUseCases {
  listCategories: ListCategoriesUseCase
  listArticles: ListArticlesUseCase
  getArticle: GetArticleUseCase
  toggleBookmark: ToggleBookmarkUseCase
  getBookmarks: GetBookmarksUseCase
}

export function registerNewsRoutes(
  fastify: FastifyInstance,
  useCases: NewsUseCases,
): void {
  // Public — no auth required
  fastify.get('/news/categories', async () => {
    return useCases.listCategories.execute()
  })

  // Protected — requires auth
  fastify.get(
    '/news/articles',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const query = articleListQuerySchema.parse(request.query)
      return useCases.listArticles.execute({
        ...query,
        userId: request.user.userId,
      })
    },
  )

  fastify.get(
    '/news/articles/:id',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { id } = request.params as { id: string }
      return useCases.getArticle.execute({ id, userId: request.user.userId })
    },
  )

  fastify.post(
    '/news/articles/:id/bookmark',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await useCases.toggleBookmark.execute({
        userId: request.user.userId,
        articleId: id,
        action: 'add',
      })
      return reply.code(204).send()
    },
  )

  fastify.delete(
    '/news/articles/:id/bookmark',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await useCases.toggleBookmark.execute({
        userId: request.user.userId,
        articleId: id,
        action: 'remove',
      })
      return reply.code(204).send()
    },
  )

  fastify.get(
    '/news/bookmarks',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const query = z
        .object({
          page: z.coerce.number().int().min(1).default(1),
          limit: z.coerce.number().int().min(1).max(100).default(20),
        })
        .parse(request.query)
      return useCases.getBookmarks.execute({
        userId: request.user.userId,
        ...query,
      })
    },
  )
}
```

**Step 4: Run (expect PASS)**

```bash
pnpm --filter api vitest run src/modules/news/tests/news.integration.test.ts
```

Expected: PASS — all test groups pass.

**Step 5: Commit**

```bash
git add apps/api/src/modules/news
git commit -m "feat(news): add news module with articles, categories, bookmarks"
```

---

### Task 12: apps/api — Composition root (wire all modules in server.ts)

**Files:**
- Modify: `apps/api/src/main.ts`

---

**Step 1: No failing test (wiring/glue code)**

This task has no TDD step. The wiring is verified by starting the server and hitting the health endpoint.

**Step 2: Implement**

Replace the contents of `apps/api/src/main.ts` with the full composition root:

```ts
// apps/api/src/main.ts
import { buildServer } from './infrastructure/server.js'
import { createPrismaClient } from '@repo/db'

// Auth adapters
import { PrismaUserRepository } from './modules/auth/adapters/prisma/prisma-user.repository.js'
import { PrismaRefreshTokenRepository } from './modules/auth/adapters/prisma/prisma-refresh-token.repository.js'
import { JwtTokenService } from './modules/auth/adapters/jwt/jwt-token.service.js'

// Auth use-cases
import { RegisterUseCase } from './modules/auth/application/register.use-case.js'
import { LoginUseCase } from './modules/auth/application/login.use-case.js'
import { RefreshTokenUseCase } from './modules/auth/application/refresh-token.use-case.js'
import { LogoutUseCase } from './modules/auth/application/logout.use-case.js'

// Auth routes
import { registerAuthRoutes } from './modules/auth/adapters/http/auth.routes.js'

// User adapters
import { PrismaUserPreferencesRepository } from './modules/user/adapters/prisma/prisma-user-preferences.repository.js'

// User use-cases
import { GetProfileUseCase } from './modules/user/application/get-profile.use-case.js'
import { UpdateProfileUseCase } from './modules/user/application/update-profile.use-case.js'
import { UpdatePreferencesUseCase } from './modules/user/application/update-preferences.use-case.js'
import { ChangePasswordUseCase } from './modules/user/application/change-password.use-case.js'

// User routes
import { registerUserRoutes } from './modules/user/adapters/http/user.routes.js'

// News adapters
import { PrismaArticleRepository } from './modules/news/adapters/prisma/prisma-article.repository.js'
import { PrismaBookmarkRepository } from './modules/news/adapters/prisma/prisma-bookmark.repository.js'
import { PrismaCategoryRepository } from './modules/news/adapters/prisma/prisma-category.repository.js'

// News use-cases
import { ListCategoriesUseCase } from './modules/news/application/list-categories.use-case.js'
import { ListArticlesUseCase } from './modules/news/application/list-articles.use-case.js'
import { GetArticleUseCase } from './modules/news/application/get-article.use-case.js'
import { ToggleBookmarkUseCase } from './modules/news/application/toggle-bookmark.use-case.js'
import { GetBookmarksUseCase } from './modules/news/application/get-bookmarks.use-case.js'

// News routes
import { registerNewsRoutes } from './modules/news/adapters/http/news.routes.js'

// ---------------------------------------------------------------------------
// Infrastructure
// ---------------------------------------------------------------------------

const prisma = createPrismaClient(process.env.DATABASE_URL)

// ---------------------------------------------------------------------------
// Auth layer
// ---------------------------------------------------------------------------

const userRepo = new PrismaUserRepository(prisma)
const refreshTokenRepo = new PrismaRefreshTokenRepository(prisma)
const tokenService = new JwtTokenService(process.env.JWT_SECRET ?? 'dev-secret')

// ---------------------------------------------------------------------------
// User layer
// ---------------------------------------------------------------------------

const prefsRepo = new PrismaUserPreferencesRepository(prisma)

// ---------------------------------------------------------------------------
// News layer
// ---------------------------------------------------------------------------

const articleRepo = new PrismaArticleRepository(prisma)
const bookmarkRepo = new PrismaBookmarkRepository(prisma)
const categoryRepo = new PrismaCategoryRepository(prisma)

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const server = buildServer({
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
})

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

registerAuthRoutes(server, {
  // prefsRepo passed here so RegisterUseCase creates default UserPreferences on every registration
  register: new RegisterUseCase(userRepo, tokenService, refreshTokenRepo, prefsRepo),
  login: new LoginUseCase(userRepo, tokenService, refreshTokenRepo),
  refresh: new RefreshTokenUseCase(refreshTokenRepo, tokenService),
  logout: new LogoutUseCase(refreshTokenRepo),
})

registerUserRoutes(server, {
  getProfile: new GetProfileUseCase(userRepo, prefsRepo),
  updateProfile: new UpdateProfileUseCase(userRepo),
  updatePreferences: new UpdatePreferencesUseCase(prefsRepo),
  changePassword: new ChangePasswordUseCase(userRepo),
})

registerNewsRoutes(server, {
  listCategories: new ListCategoriesUseCase(categoryRepo),
  listArticles: new ListArticlesUseCase(articleRepo, bookmarkRepo),
  getArticle: new GetArticleUseCase(articleRepo, bookmarkRepo),
  toggleBookmark: new ToggleBookmarkUseCase(bookmarkRepo, articleRepo),
  getBookmarks: new GetBookmarksUseCase(bookmarkRepo, articleRepo),
})

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const port = Number(process.env.PORT ?? 3001)
server.listen({ port, host: '0.0.0.0' }, (err) => {
  if (err) {
    server.log.error(err)
    process.exit(1)
  }
})
```

**Step 3: Verify server starts**

```bash
pnpm --filter api dev
```

In a second terminal:

```bash
curl http://localhost:3001/health
# Expected: {"status":"ok"}
```

**Step 4: Commit**

```bash
git add apps/api/src/main.ts
git commit -m "feat(api): wire all modules in composition root"
```

---

### Task 13: apps/worker-news-fetch — RSS fetch worker

**Files:**
- Create: `apps/worker-news-fetch/package.json`
- Create: `apps/worker-news-fetch/tsconfig.json`
- Create: `apps/worker-news-fetch/vitest.config.ts`
- Create: `apps/worker-news-fetch/src/categorizer.ts`
- Create: `apps/worker-news-fetch/src/categorizer.test.ts`
- Create: `apps/worker-news-fetch/src/fetcher.ts`
- Create: `apps/worker-news-fetch/src/main.ts`

---

**Step 1: Write failing test**

Create `apps/worker-news-fetch/src/categorizer.test.ts` before implementing `categorizer.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { categorize } from './categorizer.js'

const categories = [
  { id: 'tech-id', keywords: ['javascript', 'software', 'ai'] },
  { id: 'science-id', keywords: ['research', 'study', 'biology'] },
]

describe('categorize', () => {
  it('returns categoryId when keyword matches in title', () => {
    expect(
      categorize('New JavaScript framework released', null, categories),
    ).toBe('tech-id')
  })

  it('matches keyword in summary when title has no match', () => {
    expect(
      categorize('Interesting findings', 'A new biology study reveals...', categories),
    ).toBe('science-id')
  })

  it('is case-insensitive for both keyword and text', () => {
    expect(
      categorize('AI Is Changing Everything', null, categories),
    ).toBe('tech-id')
  })

  it('returns null when no keyword matches title or summary', () => {
    expect(
      categorize('Sports results', 'Football game results', categories),
    ).toBeNull()
  })

  it('returns null when categories array is empty', () => {
    expect(categorize('JavaScript news', null, [])).toBeNull()
  })

  it('returns null when title and summary are both empty strings', () => {
    expect(categorize('', '', categories)).toBeNull()
  })

  it('returns the first matching category (order matters)', () => {
    // "software" matches tech-id (index 0) before science-id (index 1)
    expect(
      categorize('software research', null, categories),
    ).toBe('tech-id')
  })

  it('matches across title and summary concatenated', () => {
    // "research" is in summary, "javascript" is in title — tech-id comes first
    expect(
      categorize('javascript tips', 'research-backed approach', categories),
    ).toBe('tech-id')
  })

  it('handles null summary gracefully', () => {
    expect(
      categorize('biology breakthroughs', null, categories),
    ).toBe('science-id')
  })
})
```

**Step 2: Run (expect FAIL)**

First, create `package.json`, `tsconfig.json`, and `vitest.config.ts` so the workspace recognises the package and Vitest can run, but do NOT create `categorizer.ts` yet.

`apps/worker-news-fetch/package.json`:

```json
{
  "name": "worker-news-fetch",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node dist/main.js",
    "dev": "tsx src/main.ts",
    "build": "tsc --noEmit && esbuild src/main.ts --bundle --platform=node --target=node24 --outfile=dist/main.js --external:@prisma/client --external:.prisma",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@repo/db": "workspace:*",
    "rss-parser": "^3.13.0"
  },
  "devDependencies": {
    "@repo/config": "workspace:*",
    "@types/node": "^22.10.5",
    "esbuild": "^0.25.0",
    "tsx": "^4.19.2",
    "typescript": "^5.7.3",
    "vitest": "^2.1.8"
  }
}
```

`apps/worker-news-fetch/tsconfig.json`:

```json
{
  "extends": "@repo/config/tsconfig",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

`apps/worker-news-fetch/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

Install the new workspace package:

```bash
pnpm install
```

Run the test (categorizer.ts does not exist yet):

```bash
pnpm --filter worker-news-fetch vitest run src/categorizer.test.ts
```

Expected: FAIL — `Cannot find module './categorizer.js'`.

---

**Step 3: Implement**

**`apps/worker-news-fetch/src/categorizer.ts`**

```ts
export interface CategoryRule {
  id: string
  keywords: string[]
}

/**
 * Returns the id of the first category whose keywords appear in the
 * concatenation of title + summary (case-insensitive).
 * Returns null if no category matches.
 */
export function categorize(
  title: string,
  summary: string | null,
  categories: CategoryRule[],
): string | null {
  const text = `${title} ${summary ?? ''}`.toLowerCase()

  for (const category of categories) {
    for (const keyword of category.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return category.id
      }
    }
  }

  return null
}
```

**`apps/worker-news-fetch/src/fetcher.ts`**

```ts
import Parser from 'rss-parser'

export interface ParsedArticle {
  guid: string
  title: string
  summary: string | null
  url: string
  imageUrl: string | null
  publishedAt: Date
}

const parser = new Parser()

/**
 * Fetches and parses an RSS feed URL.
 * Returns an empty array on network or parse errors (soft failure —
 * the worker continues with remaining feeds).
 */
export async function fetchFeed(feedUrl: string): Promise<ParsedArticle[]> {
  try {
    const feed = await parser.parseURL(feedUrl)

    return feed.items
      .filter(item => item.link && item.title)
      .map(item => ({
        guid: item.guid ?? item.link!,
        title: item.title!,
        summary: item.contentSnippet ?? item.summary ?? null,
        url: item.link!,
        imageUrl: item.enclosure?.url ?? null,
        publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
      }))
  } catch (error) {
    console.error(`[worker] Failed to fetch feed ${feedUrl}:`, error)
    return []
  }
}
```

**`apps/worker-news-fetch/src/main.ts`**

```ts
import { createPrismaClient } from '@repo/db'
import { fetchFeed } from './fetcher.js'
import { categorize } from './categorizer.js'

async function run(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('[worker] DATABASE_URL environment variable is not set')
    process.exit(1)
  }

  const prisma = createPrismaClient(databaseUrl)

  try {
    console.log('[worker] Starting news fetch...')

    const [sources, categories] = await Promise.all([
      prisma.source.findMany(),
      prisma.category.findMany({ select: { id: true, keywords: true } }),
    ])

    console.log(`[worker] ${sources.length} source(s), ${categories.length} categorie(s) loaded`)

    let upserted = 0
    let skipped = 0

    for (const source of sources) {
      const articles = await fetchFeed(source.feedUrl)
      console.log(`[worker] "${source.name}": ${articles.length} article(s) fetched`)

      for (const article of articles) {
        const categoryId = categorize(article.title, article.summary, categories)

        try {
          await prisma.article.upsert({
            where: { guid: article.guid },
            create: {
              guid: article.guid,
              title: article.title,
              summary: article.summary,
              url: article.url,
              imageUrl: article.imageUrl,
              publishedAt: article.publishedAt,
              sourceId: source.id,
              categoryId,
            },
            update: {
              title: article.title,
              summary: article.summary,
              categoryId,
            },
          })
          upserted++
        } catch (err) {
          console.warn(`[worker] Skipping article guid="${article.guid}":`, err)
          skipped++
        }
      }
    }

    console.log(`[worker] Done. Upserted: ${upserted}, Skipped: ${skipped}`)
  } finally {
    await prisma.$disconnect()
  }
}

run().catch(err => {
  console.error('[worker] Fatal error:', err)
  process.exit(1)
})
```

**Step 4: Run (expect PASS)**

```bash
pnpm --filter worker-news-fetch vitest run src/categorizer.test.ts
```

Expected: PASS — all 9 `categorize` tests pass.

**Step 5: Verify dev run (optional — requires a running database)**

```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/newsdb" pnpm --filter worker-news-fetch dev
```

Expected output (no crash):

```
[worker] Starting news fetch...
[worker] N source(s), M categorie(s) loaded
[worker] Done. Upserted: X, Skipped: 0
```

**Step 6: Commit**

```bash
git add apps/worker-news-fetch
git commit -m "feat(worker): add RSS fetch worker with keyword categorizer"
```
