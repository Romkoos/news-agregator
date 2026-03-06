import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { execSync } from 'child_process'
import { createPrismaClient } from '@repo/db'
import { buildServer } from '../../../infrastructure/server.js'
import { PrismaUserRepository } from '../../auth/adapters/prisma/prisma-user.repository.js'
import { PrismaRefreshTokenRepository } from '../../auth/adapters/prisma/prisma-refresh-token.repository.js'
import { PrismaUserPreferencesRepository } from '../adapters/prisma/prisma-user-preferences.repository.js'
import { JwtTokenService } from '../../auth/adapters/jwt/jwt-token.service.js'
import { RegisterUseCase } from '../../auth/application/register.use-case.js'
import { LoginUseCase } from '../../auth/application/login.use-case.js'
import { RefreshTokenUseCase } from '../../auth/application/refresh-token.use-case.js'
import { LogoutUseCase } from '../../auth/application/logout.use-case.js'
import { GetProfileUseCase } from '../application/get-profile.use-case.js'
import { UpdateProfileUseCase } from '../application/update-profile.use-case.js'
import { UpdatePreferencesUseCase } from '../application/update-preferences.use-case.js'
import { ChangePasswordUseCase } from '../application/change-password.use-case.js'
import { registerAuthRoutes } from '../../auth/adapters/http/auth.routes.js'
import { registerUserRoutes } from '../adapters/http/user.routes.js'
import type { FastifyInstance } from 'fastify'

let container: StartedPostgreSqlContainer
let prisma: ReturnType<typeof createPrismaClient>
let server: FastifyInstance

const JWT_SECRET = 'user-integration-test-secret'

async function registerUser(
  srv: FastifyInstance,
  email: string,
  password: string,
  name: string,
): Promise<{ accessToken: string; userId: string }> {
  const res = await srv.inject({
    method: 'POST',
    url: '/auth/register',
    payload: { email, password, name },
  })
  const body = res.json()
  return { accessToken: body.accessToken, userId: body.user.id }
}

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:16').start()
  const url = container.getConnectionUri()

  execSync(`pnpm run --filter @repo/db db:push -- --accept-data-loss`, {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'inherit',
  })

  prisma = createPrismaClient(url)

  const userRepo = new PrismaUserRepository(prisma)
  const refreshTokenRepo = new PrismaRefreshTokenRepository(prisma)
  const prefsRepo = new PrismaUserPreferencesRepository(prisma)
  const tokenService = new JwtTokenService(JWT_SECRET)

  server = buildServer({ jwtSecret: JWT_SECRET, corsOrigin: '*' })

  registerAuthRoutes(server, {
    register: new RegisterUseCase(userRepo, tokenService, refreshTokenRepo, prefsRepo),
    login: new LoginUseCase(userRepo, tokenService, refreshTokenRepo),
    refresh: new RefreshTokenUseCase(refreshTokenRepo, tokenService, userRepo),
    logout: new LogoutUseCase(refreshTokenRepo),
  })

  registerUserRoutes(server, {
    getProfile: new GetProfileUseCase(userRepo, prefsRepo),
    updateProfile: new UpdateProfileUseCase(userRepo),
    updatePreferences: new UpdatePreferencesUseCase(prefsRepo),
    changePassword: new ChangePasswordUseCase(userRepo),
  })

  await server.ready()
}, 60_000)

afterAll(async () => {
  await server.close()
  await prisma.$disconnect()
  await container.stop()
})

beforeEach(async () => {
  await prisma.userPreferences.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()
})

describe('GET /users/me', () => {
  it('returns 401 without an Authorization header', async () => {
    const res = await server.inject({ method: 'GET', url: '/users/me' })
    expect(res.statusCode).toBe(401)
  })

  it('returns the user profile with preferences when authenticated', async () => {
    const { accessToken } = await registerUser(server, 'alice@example.com', 'password123', 'Alice')

    const res = await server.inject({
      method: 'GET',
      url: '/users/me',
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.email).toBe('alice@example.com')
    expect(body.name).toBe('Alice')
    expect(body.preferences).toBeDefined()
    expect(body.preferences.theme).toBe('LIGHT')
  })
})

describe('PATCH /users/me', () => {
  it('updates the user name', async () => {
    const { accessToken } = await registerUser(server, 'bob@example.com', 'password123', 'Bob')

    const res = await server.inject({
      method: 'PATCH',
      url: '/users/me',
      headers: { Authorization: `Bearer ${accessToken}` },
      payload: { name: 'Bobby' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().name).toBe('Bobby')
  })
})

describe('PATCH /users/me/preferences', () => {
  it('updates user theme preference', async () => {
    const { accessToken } = await registerUser(server, 'carol@example.com', 'password123', 'Carol')

    const res = await server.inject({
      method: 'PATCH',
      url: '/users/me/preferences',
      headers: { Authorization: `Bearer ${accessToken}` },
      payload: { theme: 'DARK' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().theme).toBe('DARK')
  })
})

describe('PATCH /users/me/password', () => {
  it('returns 204 when current password is correct', async () => {
    const { accessToken } = await registerUser(server, 'dave@example.com', 'password123', 'Dave')

    const res = await server.inject({
      method: 'PATCH',
      url: '/users/me/password',
      headers: { Authorization: `Bearer ${accessToken}` },
      payload: { currentPassword: 'password123', newPassword: 'newpassword456' },
    })

    expect(res.statusCode).toBe(204)
  })

  it('returns 401 when current password is wrong', async () => {
    const { accessToken } = await registerUser(server, 'eve@example.com', 'password123', 'Eve')

    const res = await server.inject({
      method: 'PATCH',
      url: '/users/me/password',
      headers: { Authorization: `Bearer ${accessToken}` },
      payload: { currentPassword: 'wrongpassword', newPassword: 'newpassword456' },
    })

    expect(res.statusCode).toBe(401)
  })
})
