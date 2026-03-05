import type { UserEntity } from '../domain/user.entity.js'

export interface IUserRepository {
  findByEmail(email: string): Promise<UserEntity | null>
  findById(id: string): Promise<UserEntity | null>
  create(data: Omit<UserEntity, 'id'>): Promise<UserEntity>
  update(id: string, data: Partial<Omit<UserEntity, 'id'>>): Promise<UserEntity>
}
