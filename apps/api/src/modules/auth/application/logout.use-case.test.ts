import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LogoutUseCase } from './logout.use-case.js'
import type { IRefreshTokenRepository } from '../ports/refresh-token.repository.port.js'

const mockRefreshTokenRepo: IRefreshTokenRepository = {
  create: vi.fn(),
  findByToken: vi.fn(),
  deleteByToken: vi.fn(),
  deleteByUserId: vi.fn(),
}

describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    useCase = new LogoutUseCase(mockRefreshTokenRepo)
  })

  it('deletes the refresh token from the repository', async () => {
    vi.mocked(mockRefreshTokenRepo.deleteByToken).mockResolvedValue(undefined)

    await useCase.execute('some-refresh-token')

    expect(mockRefreshTokenRepo.deleteByToken).toHaveBeenCalledWith('some-refresh-token')
  })

  it('does not throw when token is not found (fire and forget)', async () => {
    vi.mocked(mockRefreshTokenRepo.deleteByToken).mockResolvedValue(undefined)

    await expect(useCase.execute('nonexistent-token')).resolves.toBeUndefined()
  })
})
