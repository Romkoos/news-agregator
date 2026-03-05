import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UpdateProfileUseCase } from './update-profile.use-case.js'
import type { IUserRepository } from '../../auth/ports/user.repository.port.js'

const mockUserRepo: IUserRepository = {
  findByEmail: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}

describe('UpdateProfileUseCase', () => {
  let useCase: UpdateProfileUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    useCase = new UpdateProfileUseCase(mockUserRepo)
  })

  it('updates user name and returns updated profile', async () => {
    vi.mocked(mockUserRepo.update).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hashed',
      name: 'New Name',
      avatarUrl: null,
    })

    const result = await useCase.execute({ userId: 'user-1', name: 'New Name' })

    expect(result.name).toBe('New Name')
    expect(mockUserRepo.update).toHaveBeenCalledWith('user-1', { name: 'New Name' })
  })

  it('updates avatarUrl when provided', async () => {
    vi.mocked(mockUserRepo.update).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hashed',
      name: 'Test User',
      avatarUrl: 'https://example.com/avatar.png',
    })

    const result = await useCase.execute({
      userId: 'user-1',
      avatarUrl: 'https://example.com/avatar.png',
    })

    expect(result.avatarUrl).toBe('https://example.com/avatar.png')
    expect(mockUserRepo.update).toHaveBeenCalledWith('user-1', {
      avatarUrl: 'https://example.com/avatar.png',
    })
  })
})
