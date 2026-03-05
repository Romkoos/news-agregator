import type { FastifyInstance } from 'fastify'
import {
  updateProfileRequestSchema,
  updatePreferencesRequestSchema,
  changePasswordRequestSchema,
} from '@repo/contracts'
import type { GetProfileUseCase } from '../../application/get-profile.use-case.js'
import type { UpdateProfileUseCase } from '../../application/update-profile.use-case.js'
import type { UpdatePreferencesUseCase } from '../../application/update-preferences.use-case.js'
import type { ChangePasswordUseCase } from '../../application/change-password.use-case.js'

export interface UserUseCases {
  getProfile: GetProfileUseCase
  updateProfile: UpdateProfileUseCase
  updatePreferences: UpdatePreferencesUseCase
  changePassword: ChangePasswordUseCase
}

export function registerUserRoutes(fastify: FastifyInstance, useCases: UserUseCases): void {
  const authenticate = { preHandler: [fastify.authenticate] }

  fastify.get('/users/me', authenticate, async (request, reply) => {
    const { userId } = request.user as { userId: string; email: string }
    const profile = await useCases.getProfile.execute(userId)
    return reply.send(profile)
  })

  fastify.patch('/users/me', authenticate, async (request, reply) => {
    const { userId } = request.user as { userId: string; email: string }
    const dto = updateProfileRequestSchema.parse(request.body)
    const updated = await useCases.updateProfile.execute({ userId, ...dto })
    return reply.send(updated)
  })

  fastify.patch('/users/me/preferences', authenticate, async (request, reply) => {
    const { userId } = request.user as { userId: string; email: string }
    const dto = updatePreferencesRequestSchema.parse(request.body)
    const prefs = await useCases.updatePreferences.execute({ userId, ...dto })
    return reply.send(prefs)
  })

  fastify.patch('/users/me/password', authenticate, async (request, reply) => {
    const { userId } = request.user as { userId: string; email: string }
    const dto = changePasswordRequestSchema.parse(request.body)
    await useCases.changePassword.execute({ userId, ...dto })
    return reply.code(204).send()
  })
}
