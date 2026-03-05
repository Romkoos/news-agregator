import type { PrismaClient } from '@repo/db'
import type { IUserPreferencesRepository, UserPreferencesData } from '../../ports/user-preferences.repository.port.js'

export class PrismaUserPreferencesRepository implements IUserPreferencesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUserId(userId: string): Promise<UserPreferencesData | null> {
    const prefs = await this.prisma.userPreferences.findUnique({ where: { userId } })
    if (!prefs) return null
    return { theme: prefs.theme, language: prefs.language }
  }

  async upsert(userId: string, data: Partial<UserPreferencesData>): Promise<UserPreferencesData> {
    const prefs = await this.prisma.userPreferences.upsert({
      where: { userId },
      update: data,
      create: { userId, theme: data.theme ?? 'LIGHT', language: data.language ?? 'en' },
    })
    return { theme: prefs.theme, language: prefs.language }
  }
}
