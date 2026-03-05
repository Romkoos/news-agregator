export interface UserPreferencesData {
  theme: 'LIGHT' | 'DARK'
  language: string
}

export interface IUserPreferencesRepository {
  findByUserId(userId: string): Promise<UserPreferencesData | null>
  upsert(userId: string, data: Partial<UserPreferencesData>): Promise<UserPreferencesData>
}
