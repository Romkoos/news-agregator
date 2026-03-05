export interface ITokenService {
  signAccessToken(payload: { userId: string; email: string }): string
  verifyAccessToken(token: string): { userId: string; email: string }
}
