import bcrypt from 'bcryptjs'
import { NotFoundError, InvalidCredentialsError } from '../../../shared/errors.js'
import type { IUserRepository } from '../../auth/ports/user.repository.port.js'

export interface ChangePasswordDto {
  userId: string
  currentPassword: string
  newPassword: string
}

export class ChangePasswordUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(dto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepo.findById(dto.userId)
    if (!user) {
      throw new NotFoundError(`User ${dto.userId} not found`)
    }

    const passwordMatches = await bcrypt.compare(dto.currentPassword, user.passwordHash)
    if (!passwordMatches) {
      throw new InvalidCredentialsError('Current password is incorrect')
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10)
    await this.userRepo.update(dto.userId, { passwordHash: newPasswordHash })
  }
}
