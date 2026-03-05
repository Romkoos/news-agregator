import type { IRefreshTokenRepository } from '../ports/refresh-token.repository.port.js'

export class LogoutUseCase {
  constructor(private readonly refreshTokenRepo: IRefreshTokenRepository) {}

  async execute(token: string): Promise<void> {
    // Fire and forget — do not throw if the token does not exist
    await this.refreshTokenRepo.deleteByToken(token)
  }
}
