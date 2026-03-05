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
