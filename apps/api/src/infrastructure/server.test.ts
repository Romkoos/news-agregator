import { describe, it, expect } from 'vitest'
import { buildServer } from './server.js'

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const server = buildServer({ jwtSecret: 'test-secret', corsOrigin: '*' })
    const response = await server.inject({ method: 'GET', url: '/health' })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
  })
})
