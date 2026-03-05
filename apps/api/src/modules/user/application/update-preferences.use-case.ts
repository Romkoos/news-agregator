import type { IUserPreferencesRepository } from '../ports/user-preferences.repository.port.js'

export interface UpdatePreferencesDto {
  userId: string
  theme?: 'LIGHT' | 'DARK'
  language?: string
}

export interface UpdatePreferencesResult {
  theme: 'LIGHT' | 'DARK'
  language: string
}

export class UpdatePreferencesUseCase {
  constructor(private readonly prefsRepo: IUserPreferencesRepository) {}

  async execute(dto: UpdatePreferencesDto): Promise<UpdatePreferencesResult> {
    const updateData: { theme?: 'LIGHT' | 'DARK'; language?: string } = {}

    if (dto.theme !== undefined) updateData.theme = dto.theme
    if (dto.language !== undefined) updateData.language = dto.language

    return this.prefsRepo.upsert(dto.userId, updateData)
  }
}
