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
