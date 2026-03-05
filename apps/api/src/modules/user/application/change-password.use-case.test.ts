import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ChangePasswordUseCase } from './change-password.use-case.js'
import { InvalidCredentialsError, NotFoundError } from '../../../shared/errors.js'
import type { IUserRepository } from '../../auth/ports/user.repository.port.js'

vi.mock('bcryptjs', () => ({
  default: { compare: vi.fn(), hash: vi.fn() },
  compare: vi.fn(),
  hash: vi.fn(),
}))

import bcrypt from 'bcryptjs'

const mockUserRepo: IUserRepository = {
  findByEmail: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}

const existingUser = {
  id: 'user-1',
  email: 'test@example.com',
  passwordHash: 'hashed-current-password',
  name: 'Test User',
  avatarUrl: null,
}

describe('ChangePasswordUseCase', () => {
  let useCase: ChangePasswordUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    useCase = new ChangePasswordUseCase(mockUserRepo)
  })

  it('updates passwordHash when current password matches', async () => {
    vi.mocked(mockUserRepo.findById).mockResolvedValue(existingUser)
    vi.mocked(mockUserRepo.update).mockResolvedValue({ ...existingUser, passwordHash: 'new-hash' })
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
    vi.mocked(bcrypt.hash).mockResolvedValue('new-hash' as never)

    await useCase.execute({
      userId: 'user-1',
      currentPassword: 'current-password',
      newPassword: 'new-password123',
    })

    expect(mockUserRepo.update).toHaveBeenCalledWith('user-1', { passwordHash: 'new-hash' })
  })

  it('throws InvalidCredentialsError when current password does not match', async () => {
    vi.mocked(mockUserRepo.findById).mockResolvedValue(existingUser)
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never)

    await expect(
      useCase.execute({
        userId: 'user-1',
        currentPassword: 'wrong-password',
        newPassword: 'new-password123',
      }),
    ).rejects.toThrow(InvalidCredentialsError)

    expect(mockUserRepo.update).not.toHaveBeenCalled()
  })

  it('throws NotFoundError when user does not exist', async () => {
    vi.mocked(mockUserRepo.findById).mockResolvedValue(null)

    await expect(
      useCase.execute({
        userId: 'nonexistent',
        currentPassword: 'current-password',
        newPassword: 'new-password123',
      }),
    ).rejects.toThrow(NotFoundError)
  })
})
