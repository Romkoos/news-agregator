import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LoginUseCase } from './login.use-case.js'
import { InvalidCredentialsError } from '../../../shared/errors.js'
import type { IUserRepository } from '../ports/user.repository.port.js'
import type { ITokenService } from '../ports/token.service.port.js'
import type { IRefreshTokenRepository } from '../ports/refresh-token.repository.port.js'

vi.mock('bcryptjs', () => ({
  default: { compare: vi.fn() },
  compare: vi.fn(),
}))

import bcrypt from 'bcryptjs'

const mockUserRepo: IUserRepository = {
  findByEmail: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}

const mockTokenService: ITokenService = {
  signAccessToken: vi.fn().mockReturnValue('access-token-abc'),
  verifyAccessToken: vi.fn(),
}

const mockRefreshTokenRepo: IRefreshTokenRepository = {
  create: vi.fn(),
  findByToken: vi.fn(),
  deleteByToken: vi.fn(),
  deleteByUserId: vi.fn(),
}

const existingUser = {
  id: 'user-1',
  email: 'test@example.com',
  passwordHash: '$2a$10$hash',
  name: 'Test User',
  avatarUrl: null,
}

describe('LoginUseCase', () => {
  let useCase: LoginUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    useCase = new LoginUseCase(mockUserRepo, mockTokenService, mockRefreshTokenRepo)
  })

  it('returns tokens when credentials are valid', async () => {
    vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(existingUser)
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never)

    const result = await useCase.execute({ email: 'test@example.com', password: 'password123' })

    expect(result.accessToken).toBe('access-token-abc')
    expect(result.user.email).toBe('test@example.com')
    expect(mockRefreshTokenRepo.create).toHaveBeenCalledOnce()
  })

  it('throws InvalidCredentialsError when user is not found', async () => {
    vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(null)

    await expect(
      useCase.execute({ email: 'nobody@example.com', password: 'password123' }),
    ).rejects.toThrow(InvalidCredentialsError)
  })

  it('throws InvalidCredentialsError when password does not match', async () => {
    vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(existingUser)
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never)

    await expect(
      useCase.execute({ email: 'test@example.com', password: 'wrongpassword' }),
    ).rejects.toThrow(InvalidCredentialsError)
  })
})
