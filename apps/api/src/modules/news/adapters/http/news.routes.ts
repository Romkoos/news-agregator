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

export function registerNewsRoutes(fastify: FastifyInstance, useCases: NewsUseCases): void {
  // Public — no auth required
  fastify.get('/news/categories', async () => {
    return useCases.listCategories.execute()
  })

  // Protected — requires auth
  fastify.get('/news/articles', { preHandler: [fastify.authenticate] }, async (request) => {
    const query = articleListQuerySchema.parse(request.query)
    const { userId } = request.user as { userId: string; email: string }
    return useCases.listArticles.execute({ ...query, userId })
  })

  fastify.get(
    '/news/articles/:id',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { id } = request.params as { id: string }
      const { userId } = request.user as { userId: string; email: string }
      return useCases.getArticle.execute({ id, userId })
    },
  )

  fastify.post(
    '/news/articles/:id/bookmark',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const { userId } = request.user as { userId: string; email: string }
      await useCases.toggleBookmark.execute({ userId, articleId: id, action: 'add' })
      return reply.code(204).send()
    },
  )

  fastify.delete(
    '/news/articles/:id/bookmark',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const { userId } = request.user as { userId: string; email: string }
      await useCases.toggleBookmark.execute({ userId, articleId: id, action: 'remove' })
      return reply.code(204).send()
    },
  )

  fastify.get('/news/bookmarks', { preHandler: [fastify.authenticate] }, async (request) => {
    const { userId } = request.user as { userId: string; email: string }
    const query = z
      .object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
      })
      .parse(request.query)
    return useCases.getBookmarks.execute({ userId, ...query })
  })
}
