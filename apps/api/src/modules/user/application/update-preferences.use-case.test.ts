import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UpdatePreferencesUseCase } from './update-preferences.use-case.js'
import type { IUserPreferencesRepository } from '../ports/user-preferences.repository.port.js'

const mockPrefsRepo: IUserPreferencesRepository = {
  findByUserId: vi.fn(),
  upsert: vi.fn(),
}

describe('UpdatePreferencesUseCase', () => {
  let useCase: UpdatePreferencesUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    useCase = new UpdatePreferencesUseCase(mockPrefsRepo)
  })

  it('upserts preferences and returns the updated record', async () => {
    vi.mocked(mockPrefsRepo.upsert).mockResolvedValue({ theme: 'DARK', language: 'fr' })

    const result = await useCase.execute({ userId: 'user-1', theme: 'DARK', language: 'fr' })

    expect(result.theme).toBe('DARK')
    expect(result.language).toBe('fr')
    expect(mockPrefsRepo.upsert).toHaveBeenCalledWith('user-1', { theme: 'DARK', language: 'fr' })
  })

  it('passes only provided fields to upsert', async () => {
    vi.mocked(mockPrefsRepo.upsert).mockResolvedValue({ theme: 'LIGHT', language: 'en' })

    await useCase.execute({ userId: 'user-1', theme: 'LIGHT' })

    expect(mockPrefsRepo.upsert).toHaveBeenCalledWith('user-1', { theme: 'LIGHT' })
  })
})
