import bcrypt from 'bcryptjs'
import { InvalidCredentialsError } from '../../../shared/errors.js'
import type { IUserRepository } from '../ports/user.repository.port.js'
import type { ITokenService } from '../ports/token.service.port.js'
import type { IRefreshTokenRepository } from '../ports/refresh-token.repository.port.js'

export interface LoginDto {
  email: string
  password: string
}

export interface LoginResult {
  accessToken: string
  refreshToken: string
  user: { id: string; email: string; name: string; avatarUrl: string | null }
}

export class LoginUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenService: ITokenService,
    private readonly refreshTokenRepo: IRefreshTokenRepository,
  ) {}

  async execute(dto: LoginDto): Promise<LoginResult> {
    const user = await this.userRepo.findByEmail(dto.email)
    if (!user) {
      throw new InvalidCredentialsError('Invalid email or password')
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash)
    if (!passwordMatches) {
      throw new InvalidCredentialsError('Invalid email or password')
    }

    const accessToken = this.tokenService.signAccessToken({ userId: user.id, email: user.email })

    const refreshToken = crypto
      .getRandomValues(new Uint8Array(32))
      .reduce((acc, b) => acc + b.toString(16).padStart(2, '0'), '')

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await this.refreshTokenRepo.create({ token: refreshToken, userId: user.id, expiresAt })

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl },
    }
  }
}
