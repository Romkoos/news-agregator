import type { AxiosInstance } from 'axios'

export function setupInterceptors(
  apiInstance: AxiosInstance,
  getToken: () => string | null,
  onTokenRefreshed: (token: string) => void,
  onLogout: () => void,
) {
  // Request interceptor: attach access token to every outgoing request
  apiInstance.interceptors.request.use((config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  // Response interceptor: handle 401 → refresh → retry
  let isRefreshing = false
  let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

  const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
      if (error) reject(error)
      else resolve(token!)
    })
    failedQueue = []
  }

  apiInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config
      const isRefreshRequest = originalRequest?.url?.includes('/auth/refresh')
      if (error.response?.status !== 401 || originalRequest._retry || isRefreshRequest) {
        return Promise.reject(error)
      }
      if (isRefreshing) {
        // Queue this request until the ongoing refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return apiInstance(originalRequest)
        })
      }
      originalRequest._retry = true
      isRefreshing = true
      try {
        const { data } = await apiInstance.post<{ accessToken: string }>('/auth/refresh')
        onTokenRefreshed(data.accessToken)
        processQueue(null, data.accessToken)
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return apiInstance(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        onLogout()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    },
  )
}
