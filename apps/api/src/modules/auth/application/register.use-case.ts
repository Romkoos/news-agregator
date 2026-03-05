import bcrypt from 'bcryptjs'
import { EmailAlreadyExistsError } from '../../../shared/errors.js'
import type { IUserRepository } from '../ports/user.repository.port.js'
import type { ITokenService } from '../ports/token.service.port.js'
import type { IRefreshTokenRepository } from '../ports/refresh-token.repository.port.js'
import type { IUserPreferencesRepository } from '../../user/ports/user-preferences.repository.port.js'

export interface RegisterDto {
  email: string
  password: string
  name: string
}

export interface RegisterResult {
  accessToken: string
  refreshToken: string
  user: { id: string; email: string; name: string; avatarUrl: string | null }
}

export class RegisterUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenService: ITokenService,
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly prefsRepo: IUserPreferencesRepository,
  ) {}

  async execute(dto: RegisterDto): Promise<RegisterResult> {
    const existing = await this.userRepo.findByEmail(dto.email)
    if (existing) {
      throw new EmailAlreadyExistsError(`Email ${dto.email} is already registered`)
    }

    const passwordHash = await bcrypt.hash(dto.password, 10)
    const user = await this.userRepo.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
      avatarUrl: null,
    })

    // Create default preferences eagerly — every user always has preferences.
    await this.prefsRepo.upsert(user.id, { theme: 'LIGHT', language: 'en' })

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
