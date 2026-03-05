export interface User {
  id: string
  email: string
  name: string
  avatarUrl: string | null
}

export interface UserPreferences {
  theme: 'LIGHT' | 'DARK'
  language: string
}
