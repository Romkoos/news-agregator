import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GetProfileUseCase } from './get-profile.use-case.js'
import { NotFoundError } from '../../../shared/errors.js'
import type { IUserRepository } from '../../auth/ports/user.repository.port.js'
import type { IUserPreferencesRepository } from '../ports/user-preferences.repository.port.js'

const mockUserRepo: IUserRepository = {
  findByEmail: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}

const mockPrefsRepo: IUserPreferencesRepository = {
  findByUserId: vi.fn(),
  upsert: vi.fn(),
}

const existingUser = {
  id: 'user-1',
  email: 'test@example.com',
  passwordHash: 'hashed',
  name: 'Test User',
  avatarUrl: null,
}

describe('GetProfileUseCase', () => {
  let useCase: GetProfileUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    useCase = new GetProfileUseCase(mockUserRepo, mockPrefsRepo)
  })

  it('returns combined profile with preferences', async () => {
    vi.mocked(mockUserRepo.findById).mockResolvedValue(existingUser)
    vi.mocked(mockPrefsRepo.findByUserId).mockResolvedValue({ theme: 'DARK', language: 'en' })

    const result = await useCase.execute('user-1')

    expect(result.id).toBe('user-1')
    expect(result.email).toBe('test@example.com')
    expect(result.preferences?.theme).toBe('DARK')
  })

  it('returns null preferences when none are stored', async () => {
    vi.mocked(mockUserRepo.findById).mockResolvedValue(existingUser)
    vi.mocked(mockPrefsRepo.findByUserId).mockResolvedValue(null)

    const result = await useCase.execute('user-1')

    expect(result.preferences).toBeNull()
  })

  it('throws NotFoundError when user does not exist', async () => {
    vi.mocked(mockUserRepo.findById).mockResolvedValue(null)

    await expect(useCase.execute('nonexistent-id')).rejects.toThrow(NotFoundError)
  })
})
