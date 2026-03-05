import type { FastifyInstance } from 'fastify'
import { registerRequestSchema, loginRequestSchema } from '@repo/contracts'
import type { RegisterUseCase } from '../../application/register.use-case.js'
import type { LoginUseCase } from '../../application/login.use-case.js'
import type { RefreshTokenUseCase } from '../../application/refresh-token.use-case.js'
import type { LogoutUseCase } from '../../application/logout.use-case.js'

const REFRESH_COOKIE = 'refreshToken'

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
}

export interface AuthUseCases {
  register: RegisterUseCase
  login: LoginUseCase
  refresh: RefreshTokenUseCase
  logout: LogoutUseCase
}

export function registerAuthRoutes(fastify: FastifyInstance, useCases: AuthUseCases): void {
  fastify.post('/auth/register', async (request, reply) => {
    const dto = registerRequestSchema.parse(request.body)
    const result = await useCases.register.execute(dto)
    reply.setCookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTS)
    return reply.code(201).send({ accessToken: result.accessToken, user: result.user })
  })

  fastify.post('/auth/login', async (request, reply) => {
    const dto = loginRequestSchema.parse(request.body)
    const result = await useCases.login.execute(dto)
    reply.setCookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTS)
    return reply.send({ accessToken: result.accessToken, user: result.user })
  })

  fastify.post('/auth/refresh', async (request, reply) => {
    const token = (request.cookies as Record<string, string | undefined>)[REFRESH_COOKIE]
    if (!token) {
      return reply.code(401).send({ message: 'No refresh token' })
    }
    const result = await useCases.refresh.execute(token)
    reply.setCookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTS)
    return reply.send({ accessToken: result.accessToken })
  })

  fastify.delete('/auth/logout', async (request, reply) => {
    const token = (request.cookies as Record<string, string | undefined>)[REFRESH_COOKIE]
    if (token) {
      await useCases.logout.execute(token)
    }
    reply.clearCookie(REFRESH_COOKIE, { path: '/' })
    return reply.code(204).send()
  })
}
