import { PrismaClient } from '@prisma/client'

export * from '@prisma/client'

export function createPrismaClient(url?: string): PrismaClient {
  return new PrismaClient({
    datasources: url ? { db: { url } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}
