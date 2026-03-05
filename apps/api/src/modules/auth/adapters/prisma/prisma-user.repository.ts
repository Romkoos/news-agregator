import type { PrismaClient } from '@repo/db'
import type { IUserRepository } from '../../ports/user.repository.port.js'
import type { UserEntity } from '../../domain/user.entity.js'

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { email } })
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { id } })
  }

  async create(data: Omit<UserEntity, 'id'>): Promise<UserEntity> {
    return this.prisma.user.create({ data })
  }

  async update(id: string, data: Partial<Omit<UserEntity, 'id'>>): Promise<UserEntity> {
    return this.prisma.user.update({ where: { id }, data })
  }
}
