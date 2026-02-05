import Cookies from 'js-cookie'

const getCookieOptions = () => {
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:'
  return { sameSite: 'lax' as const, secure: isSecure }
}

export const setAuthCookies = (accessToken: string, refreshToken?: string) => {
  Cookies.set('accessToken', accessToken, getCookieOptions())
  if (refreshToken) {
    Cookies.set('refreshToken', refreshToken, getCookieOptions())
  }
}

export const clearAuthCookies = () => {
  Cookies.remove('accessToken')
  Cookies.remove('refreshToken')
}
