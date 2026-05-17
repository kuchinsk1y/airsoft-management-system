import { cookies } from 'next/headers'
const AUTH_TOKEN_KEY = 'access_token'

export const getAuthToken = async (): Promise<string | null> => {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get(AUTH_TOKEN_KEY)
  return authCookie?.value || null
}

export const isServerAuthenticated = async (): Promise<boolean> => {
  const token = await getAuthToken()
  return !!token
}
