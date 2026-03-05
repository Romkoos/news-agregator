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
