import axios from 'axios'
import Cookies from 'js-cookie'
import { clearAuthCookies, setAuthCookies } from '@/lib/authCookies'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor to handle token refresh
let refreshPromise: Promise<string | null> | null = null

const refreshAccessToken = async () => {
  const refreshToken = Cookies.get('refreshToken')
  if (!refreshToken) return null
  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/auth/refresh`,
    { refreshToken }
  )
  const { accessToken, refreshToken: newRefreshToken } = response.data
  setAuthCookies(accessToken, newRefreshToken)
  api.defaults.headers.common.Authorization = `Bearer ${accessToken}`
  return accessToken
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null
          })
        }
        const accessToken = await refreshPromise
        if (!accessToken) {
          throw new Error('Missing refresh token')
        }
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed, redirect to login
        clearAuthCookies()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
