import { NotFoundError } from '../../../shared/errors.js'
import type { IUserRepository } from '../../auth/ports/user.repository.port.js'
import type { IUserPreferencesRepository } from '../ports/user-preferences.repository.port.js'

export interface GetProfileResult {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  preferences: { theme: 'LIGHT' | 'DARK'; language: string } | null
}

export class GetProfileUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly prefsRepo: IUserPreferencesRepository,
  ) {}

  async execute(userId: string): Promise<GetProfileResult> {
    const user = await this.userRepo.findById(userId)
    if (!user) {
      throw new NotFoundError(`User ${userId} not found`)
    }

    const preferences = await this.prefsRepo.findByUserId(userId)

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      preferences,
    }
  }
}
