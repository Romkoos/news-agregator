import { InvalidTokenError, NotFoundError } from '../../../shared/errors.js'
import type { IRefreshTokenRepository } from '../ports/refresh-token.repository.port.js'
import type { ITokenService } from '../ports/token.service.port.js'
import type { IUserRepository } from '../ports/user.repository.port.js'

export interface RefreshTokenResult {
  accessToken: string
  refreshToken: string
}

export class RefreshTokenUseCase {
  constructor(
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly tokenService: ITokenService,
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(token: string): Promise<RefreshTokenResult> {
    const stored = await this.refreshTokenRepo.findByToken(token)
    if (!stored) {
      throw new InvalidTokenError('Refresh token not found')
    }
    if (stored.expiresAt < new Date()) {
      await this.refreshTokenRepo.deleteByToken(token)
      throw new InvalidTokenError('Refresh token has expired')
    }

    const user = await this.userRepo.findById(stored.userId)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    // Rotate: invalidate old token before issuing new one
    await this.refreshTokenRepo.deleteByToken(token)

    const accessToken = this.tokenService.signAccessToken({ userId: user.id, email: user.email })

    const newRefreshToken = crypto
      .getRandomValues(new Uint8Array(32))
      .reduce((acc, b) => acc + b.toString(16).padStart(2, '0'), '')

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await this.refreshTokenRepo.create({ token: newRefreshToken, userId: user.id, expiresAt })

    return { accessToken, refreshToken: newRefreshToken }
  }
}
