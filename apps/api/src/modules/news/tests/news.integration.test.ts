import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql'
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

let container: StartedPostgreSqlContainer
let prisma: ReturnType<typeof createPrismaClient>
let server: FastifyInstance

let userId: string
let categoryId: string
let articleId1: string
let articleId2: string
let articleId3: string
let authToken: string

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:16').start()
  const url = container.getConnectionUri()

  execSync(`pnpm run --filter @repo/db db:push -- --accept-data-loss`, {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'inherit',
  })

  prisma = createPrismaClient(url)

  const category = await prisma.category.create({
    data: {
      slug: 'technology',
      nameEn: 'Technology',
      nameRu: 'Технологии',
      keywords: ['javascript', 'software', 'ai'],
    },
  })
  categoryId = category.id

  const source = await prisma.source.create({
    data: { name: 'Test Feed', feedUrl: 'https://example.com/feed.xml' },
  })

  const a1 = await prisma.article.create({
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
  articleId1 = a1.id

  const a2 = await prisma.article.create({
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
  articleId2 = a2.id

  const a3 = await prisma.article.create({
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
  articleId3 = a3.id

  const bcrypt = await import('bcryptjs')
  const passwordHash = await bcrypt.hash('Password123!', 10)
  const user = await prisma.user.create({
    data: { email: 'news-test@example.com', name: 'News Tester', passwordHash },
  })
  userId = user.id

  server = buildServer({ jwtSecret: 'test-secret', corsOrigin: 'http://localhost:5173' })

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

  authToken = server.jwt.sign({ userId, email: 'news-test@example.com' })
}, 120_000)

afterAll(async () => {
  await server.close()
  await prisma.$disconnect()
  await container.stop()
})

describe('GET /news/categories', () => {
  it('returns 200 with an array of categories (no auth required)', async () => {
    const res = await server.inject({ method: 'GET', url: '/news/categories' })

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

describe('GET /news/articles', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await server.inject({ method: 'GET', url: '/news/articles' })
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
    expect(body).toMatchObject({ total: 3, page: 1, limit: 10 })
    expect(body.items.length).toBe(3)
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

describe('GET /news/articles/:id', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await server.inject({ method: 'GET', url: `/news/articles/${articleId1}` })
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
    const article = body.items.find((a: { id: string }) => a.id === articleId1)
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

describe('GET /news/bookmarks', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await server.inject({ method: 'GET', url: '/news/bookmarks' })
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
    const ids = body.items.map((a: { id: string }) => a.id)
    expect(ids).toContain(articleId2)
    expect(ids).toContain(articleId3)
  })
})
