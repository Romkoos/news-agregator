import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RefreshTokenUseCase } from './refresh-token.use-case.js'
import { InvalidTokenError } from '../../../shared/errors.js'
import type { IRefreshTokenRepository } from '../ports/refresh-token.repository.port.js'
import type { ITokenService } from '../ports/token.service.port.js'
import type { IUserRepository } from '../ports/user.repository.port.js'

const mockRefreshTokenRepo: IRefreshTokenRepository = {
  create: vi.fn(),
  findByToken: vi.fn(),
  deleteByToken: vi.fn(),
  deleteByUserId: vi.fn(),
}

const mockTokenService: ITokenService = {
  signAccessToken: vi.fn().mockReturnValue('new-access-token'),
  verifyAccessToken: vi.fn(),
}

const mockUserRepo: IUserRepository = {
  findByEmail: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    useCase = new RefreshTokenUseCase(mockRefreshTokenRepo, mockTokenService, mockUserRepo)
  })

  it('returns new tokens when refresh token is valid and not expired', async () => {
    vi.mocked(mockRefreshTokenRepo.findByToken).mockResolvedValue({
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 60_000),
    })
    vi.mocked(mockUserRepo.findById).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hash',
      name: 'Test User',
      avatarUrl: null,
    })

    const result = await useCase.execute('valid-refresh-token')

    expect(result.accessToken).toBe('new-access-token')
    expect(result.refreshToken).toBeDefined()
    expect(typeof result.refreshToken).toBe('string')
    expect(mockRefreshTokenRepo.deleteByToken).toHaveBeenCalledWith('valid-refresh-token')
    expect(mockRefreshTokenRepo.create).toHaveBeenCalledOnce()
  })

  it('throws InvalidTokenError when refresh token is not found', async () => {
    vi.mocked(mockRefreshTokenRepo.findByToken).mockResolvedValue(null)

    await expect(useCase.execute('unknown-token')).rejects.toThrow(InvalidTokenError)
  })

  it('throws InvalidTokenError when refresh token is expired', async () => {
    vi.mocked(mockRefreshTokenRepo.findByToken).mockResolvedValue({
      userId: 'user-1',
      expiresAt: new Date(Date.now() - 1000),
    })

    await expect(useCase.execute('expired-token')).rejects.toThrow(InvalidTokenError)
  })
})
