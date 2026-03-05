import jwt from 'jsonwebtoken'
import type { ITokenService } from '../../ports/token.service.port.js'
import { InvalidTokenError } from '../../../../shared/errors.js'

export class JwtTokenService implements ITokenService {
  constructor(private readonly secret: string) {}

  signAccessToken(payload: { userId: string; email: string }): string {
    return jwt.sign(payload, this.secret, { expiresIn: '15m' })
  }

  verifyAccessToken(token: string): { userId: string; email: string } {
    try {
      return jwt.verify(token, this.secret) as { userId: string; email: string }
    } catch {
      throw new InvalidTokenError('Invalid or expired token')
    }
  }
}
