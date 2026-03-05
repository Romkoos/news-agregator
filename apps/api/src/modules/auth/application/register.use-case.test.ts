import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RegisterUseCase } from './register.use-case.js'
import { EmailAlreadyExistsError } from '../../../shared/errors.js'
import type { IUserRepository } from '../ports/user.repository.port.js'
import type { ITokenService } from '../ports/token.service.port.js'
import type { IRefreshTokenRepository } from '../ports/refresh-token.repository.port.js'
import type { IUserPreferencesRepository } from '../../user/ports/user-preferences.repository.port.js'

const mockUserRepo: IUserRepository = {
  findByEmail: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}

const mockTokenService: ITokenService = {
  signAccessToken: vi.fn().mockReturnValue('access-token-xyz'),
  verifyAccessToken: vi.fn(),
}

const mockRefreshTokenRepo: IRefreshTokenRepository = {
  create: vi.fn(),
  findByToken: vi.fn(),
  deleteByToken: vi.fn(),
  deleteByUserId: vi.fn(),
}

const mockPrefsRepo: IUserPreferencesRepository = {
  findByUserId: vi.fn(),
  upsert: vi.fn().mockResolvedValue({ theme: 'LIGHT', language: 'en' }),
}

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    useCase = new RegisterUseCase(mockUserRepo, mockTokenService, mockRefreshTokenRepo, mockPrefsRepo)
  })

  it('creates user and returns tokens when email is unique', async () => {
    vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(null)
    vi.mocked(mockUserRepo.create).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hashed',
      name: 'Test User',
      avatarUrl: null,
    })

    const result = await useCase.execute({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    })

    expect(result.accessToken).toBe('access-token-xyz')
    expect(result.user.email).toBe('test@example.com')
    expect(mockRefreshTokenRepo.create).toHaveBeenCalledOnce()
    // Default preferences must be created on every registration
    expect(mockPrefsRepo.upsert).toHaveBeenCalledWith('user-1', { theme: 'LIGHT', language: 'en' })
  })

  it('throws EmailAlreadyExistsError when email is taken', async () => {
    vi.mocked(mockUserRepo.findByEmail).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hashed',
      name: 'Test User',
      avatarUrl: null,
    })

    await expect(
      useCase.execute({ email: 'test@example.com', password: 'password123', name: 'Test User' }),
    ).rejects.toThrow(EmailAlreadyExistsError)
  })
})
