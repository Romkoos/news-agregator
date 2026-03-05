import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './auth.store.js'

beforeEach(() => {
  useAuthStore.setState({ accessToken: null, user: null, isHydrated: false })
})

describe('useAuthStore', () => {
  it('starts with null auth', () => {
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('sets auth correctly', () => {
    const user = { id: '1', email: 'a@b.com', name: 'Alice', avatarUrl: null }
    useAuthStore.getState().setAuth('token-123', user)
    expect(useAuthStore.getState().accessToken).toBe('token-123')
    expect(useAuthStore.getState().user).toEqual(user)
  })

  it('clears auth', () => {
    useAuthStore.getState().setAuth('token', { id: '1', email: 'a@b.com', name: 'Alice', avatarUrl: null })
    useAuthStore.getState().clearAuth()
    expect(useAuthStore.getState().accessToken).toBeNull()
  })
})
