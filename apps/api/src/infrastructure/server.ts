import Fastify from 'fastify'
import fastifyCookie from '@fastify/cookie'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'
import fastifySensible from '@fastify/sensible'
import { ZodError } from 'zod'
import {
  DomainError,
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  InvalidTokenError,
  NotFoundError,
  ForbiddenError,
} from '../shared/errors.js'

export function buildServer(opts: { jwtSecret: string; corsOrigin: string }) {
  const fastify = Fastify({ logger: true })

  fastify.register(fastifyCors, { origin: opts.corsOrigin, credentials: true })
  fastify.register(fastifyJwt, { secret: opts.jwtSecret })
  fastify.register(fastifyCookie)
  fastify.register(fastifySensible)

  fastify.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ message: 'Validation error', errors: error.errors })
    }
    if (error instanceof EmailAlreadyExistsError) {
      return reply.code(409).send({ message: error.message })
    }
    if (error instanceof InvalidCredentialsError || error instanceof InvalidTokenError) {
      return reply.code(401).send({ message: error.message })
    }
    if (error instanceof NotFoundError) {
      return reply.code(404).send({ message: error.message })
    }
    if (error instanceof ForbiddenError) {
      return reply.code(403).send({ message: error.message })
    }
    if (error instanceof DomainError) {
      return reply.code(400).send({ message: error.message })
    }
    fastify.log.error(error)
    return reply.code(500).send({ message: 'Internal server error' })
  })

  fastify.get('/health', async () => ({ status: 'ok' }))

  return fastify
}
