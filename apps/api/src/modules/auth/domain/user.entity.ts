export interface UserEntity {
  id: string
  email: string
  passwordHash: string
  name: string
  avatarUrl: string | null
}
