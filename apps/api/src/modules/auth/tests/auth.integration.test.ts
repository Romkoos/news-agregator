import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { execSync } from 'child_process'
import { createPrismaClient } from '@repo/db'
import { buildServer } from '../../../infrastructure/server.js'
import { PrismaUserRepository } from '../adapters/prisma/prisma-user.repository.js'
import { PrismaRefreshTokenRepository } from '../adapters/prisma/prisma-refresh-token.repository.js'
import { PrismaUserPreferencesRepository } from '../../user/adapters/prisma/prisma-user-preferences.repository.js'
import { JwtTokenService } from '../adapters/jwt/jwt-token.service.js'
import { RegisterUseCase } from '../application/register.use-case.js'
import { LoginUseCase } from '../application/login.use-case.js'
import { RefreshTokenUseCase } from '../application/refresh-token.use-case.js'
import { LogoutUseCase } from '../application/logout.use-case.js'
import { registerAuthRoutes } from '../adapters/http/auth.routes.js'
import type { FastifyInstance } from 'fastify'

let container: StartedPostgreSqlContainer
let prisma: ReturnType<typeof createPrismaClient>
let server: FastifyInstance

const JWT_SECRET = 'integration-test-secret'

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:16').start()
  const url = container.getConnectionUri()

  execSync(`pnpm --filter @repo/db prisma migrate deploy`, {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'inherit',
  })

  prisma = createPrismaClient(url)

  const userRepo = new PrismaUserRepository(prisma)
  const refreshTokenRepo = new PrismaRefreshTokenRepository(prisma)
  const tokenService = new JwtTokenService(JWT_SECRET)
  const prefsRepo = new PrismaUserPreferencesRepository(prisma)

  server = buildServer({ jwtSecret: JWT_SECRET, corsOrigin: '*' })

  registerAuthRoutes(server, {
    register: new RegisterUseCase(userRepo, tokenService, refreshTokenRepo, prefsRepo),
    login: new LoginUseCase(userRepo, tokenService, refreshTokenRepo),
    refresh: new RefreshTokenUseCase(refreshTokenRepo, tokenService, userRepo),
    logout: new LogoutUseCase(refreshTokenRepo),
  })

  await server.ready()
}, 60_000)

afterAll(async () => {
  await server.close()
  await prisma.$disconnect()
  await container.stop()
})

beforeEach(async () => {
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()
})

describe('POST /auth/register', () => {
  it('creates a user and returns 201 with accessToken and refreshToken cookie', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'alice@example.com', password: 'password123', name: 'Alice' },
    })

    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.accessToken).toBeDefined()
    expect(body.user.email).toBe('alice@example.com')
    expect(body.user.id).toBeDefined()
    expect(res.cookies.find((c) => c.name === 'refreshToken')).toBeDefined()
  })

  it('returns 409 when email is already registered', async () => {
    await server.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'alice@example.com', password: 'password123', name: 'Alice' },
    })

    const res = await server.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'alice@example.com', password: 'password123', name: 'Alice' },
    })

    expect(res.statusCode).toBe(409)
  })

  it('returns 400 when request body is invalid', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'not-an-email', password: '123', name: '' },
    })

    expect(res.statusCode).toBe(400)
  })
})

describe('POST /auth/login', () => {
  it('returns 200 with accessToken and refreshToken cookie on valid credentials', async () => {
    await server.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'bob@example.com', password: 'password123', name: 'Bob' },
    })

    const res = await server.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'bob@example.com', password: 'password123' },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.accessToken).toBeDefined()
    expect(body.user.email).toBe('bob@example.com')
    expect(res.cookies.find((c) => c.name === 'refreshToken')).toBeDefined()
  })

  it('returns 401 on wrong password', async () => {
    await server.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'bob@example.com', password: 'password123', name: 'Bob' },
    })

    const res = await server.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'bob@example.com', password: 'wrongpassword' },
    })

    expect(res.statusCode).toBe(401)
  })

  it('returns 401 when user does not exist', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'nobody@example.com', password: 'password123' },
    })

    expect(res.statusCode).toBe(401)
  })
})

describe('POST /auth/refresh', () => {
  it('returns 200 with new accessToken given a valid refreshToken cookie', async () => {
    const regRes = await server.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'carol@example.com', password: 'password123', name: 'Carol' },
    })
    const refreshCookie = regRes.cookies.find((c) => c.name === 'refreshToken')!

    const res = await server.inject({
      method: 'POST',
      url: '/auth/refresh',
      cookies: { refreshToken: refreshCookie.value },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().accessToken).toBeDefined()
    expect(res.cookies.find((c) => c.name === 'refreshToken')).toBeDefined()
  })

  it('returns 401 when no refreshToken cookie is present', async () => {
    const res = await server.inject({ method: 'POST', url: '/auth/refresh' })
    expect(res.statusCode).toBe(401)
  })

  it('returns 401 when refreshToken is invalid', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/auth/refresh',
      cookies: { refreshToken: 'invalid-token-value' },
    })
    expect(res.statusCode).toBe(401)
  })
})

describe('DELETE /auth/logout', () => {
  it('returns 204 and clears the refreshToken cookie', async () => {
    const regRes = await server.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'dave@example.com', password: 'password123', name: 'Dave' },
    })
    const refreshCookie = regRes.cookies.find((c) => c.name === 'refreshToken')!

    const res = await server.inject({
      method: 'DELETE',
      url: '/auth/logout',
      cookies: { refreshToken: refreshCookie.value },
    })

    expect(res.statusCode).toBe(204)
    const clearedCookie = res.cookies.find((c) => c.name === 'refreshToken')
    expect(clearedCookie?.value).toBe('')
  })

  it('returns 204 even when no refreshToken cookie is present', async () => {
    const res = await server.inject({ method: 'DELETE', url: '/auth/logout' })
    expect(res.statusCode).toBe(204)
  })
})
