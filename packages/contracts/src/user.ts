import { z } from 'zod'

export const userProfileSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
  preferences: z
    .object({
      theme: z.enum(['LIGHT', 'DARK']),
      language: z.string(),
    })
    .nullable(),
})

export const updateProfileRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().nullable().optional(),
})

export const updatePreferencesRequestSchema = z.object({
  theme: z.enum(['LIGHT', 'DARK']).optional(),
  language: z.string().min(2).max(10).optional(),
})

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8).max(100),
})

export type UserProfile = z.infer<typeof userProfileSchema>
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>
export type UpdatePreferencesRequest = z.infer<typeof updatePreferencesRequestSchema>
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>
