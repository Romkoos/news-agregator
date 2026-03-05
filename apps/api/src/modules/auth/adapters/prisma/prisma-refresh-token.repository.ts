import type { PrismaClient } from '@repo/db'
import type { IRefreshTokenRepository } from '../../ports/refresh-token.repository.port.js'

export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: { token: string; userId: string; expiresAt: Date }): Promise<void> {
    await this.prisma.refreshToken.create({ data })
  }

  async findByToken(token: string): Promise<{ userId: string; expiresAt: Date } | null> {
    const rt = await this.prisma.refreshToken.findUnique({ where: { token } })
    if (!rt) return null
    return { userId: rt.userId, expiresAt: rt.expiresAt }
  }

  async deleteByToken(token: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { token } })
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { userId } })
  }
}
