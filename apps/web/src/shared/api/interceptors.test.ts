import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { setupInterceptors } from './interceptors.js'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

const BASE = 'http://localhost:3001'

const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('setupInterceptors', () => {
  let instance: ReturnType<typeof axios.create>
  const getToken = vi.fn<() => string | null>()
  const onTokenRefreshed = vi.fn()
  const onLogout = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    instance = axios.create({ baseURL: BASE, withCredentials: true })
    setupInterceptors(instance, getToken, onTokenRefreshed, onLogout)
  })

  it('attaches Authorization header when token exists', async () => {
    getToken.mockReturnValue('my-token')
    let capturedAuth = ''
    server.use(
      http.get(`${BASE}/test`, ({ request }) => {
        capturedAuth = request.headers.get('authorization') ?? ''
        return HttpResponse.json({ ok: true })
      }),
    )
    await instance.get('/test')
    expect(capturedAuth).toBe('Bearer my-token')
  })

  it('does not attach Authorization when no token', async () => {
    getToken.mockReturnValue(null)
    let capturedAuth = ''
    server.use(
      http.get(`${BASE}/test`, ({ request }) => {
        capturedAuth = request.headers.get('authorization') ?? ''
        return HttpResponse.json({ ok: true })
      }),
    )
    await instance.get('/test')
    expect(capturedAuth).toBe('')
  })

  it('retries request with new token after 401', async () => {
    getToken.mockReturnValue('old-token')
    let callCount = 0
    server.use(
      http.get(`${BASE}/protected`, () => {
        callCount++
        if (callCount === 1) return new HttpResponse(null, { status: 401 })
        return HttpResponse.json({ data: 'ok' })
      }),
      http.post(`${BASE}/auth/refresh`, () => {
        return HttpResponse.json({ accessToken: 'new-token' })
      }),
    )
    const res = await instance.get('/protected')
    expect(res.data).toEqual({ data: 'ok' })
    expect(onTokenRefreshed).toHaveBeenCalledWith('new-token')
  })

  it('calls onLogout when refresh fails', async () => {
    getToken.mockReturnValue('old-token')
    server.use(
      http.get(`${BASE}/protected`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${BASE}/auth/refresh`, () => new HttpResponse(null, { status: 401 })),
    )
    await expect(instance.get('/protected')).rejects.toThrow()
    expect(onLogout).toHaveBeenCalled()
  })
})
