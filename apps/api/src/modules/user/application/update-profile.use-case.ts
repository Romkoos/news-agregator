import type { IUserRepository } from '../../auth/ports/user.repository.port.js'

export interface UpdateProfileDto {
  userId: string
  name?: string
  avatarUrl?: string | null
}

export interface UpdateProfileResult {
  id: string
  email: string
  name: string
  avatarUrl: string | null
}

export class UpdateProfileUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(dto: UpdateProfileDto): Promise<UpdateProfileResult> {
    const updateData: { name?: string; avatarUrl?: string | null } = {}

    if (dto.name !== undefined) updateData.name = dto.name
    if (dto.avatarUrl !== undefined) updateData.avatarUrl = dto.avatarUrl

    const user = await this.userRepo.update(dto.userId, updateData)

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    }
  }
}
