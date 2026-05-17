'use server'

import { getAuthToken } from '@/app/auth/server-utils'
import { NEXT_PUBLIC_API_KEY, NEXT_PUBLIC_API_URL } from '@/app/utils/config'

const API_URL = NEXT_PUBLIC_API_URL.replace(/\/$/, '')
const API_KEY = NEXT_PUBLIC_API_KEY

if (!API_URL || !API_KEY) {
  throw new Error('Missing required environment variables: NEXT_PUBLIC_API_URL or NEXT_PUBLIC_API_KEY')
}

const makeAuthHeaders = (token?: string, includeJson = true): HeadersInit => ({
  'X-API-Key': API_KEY,
  ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

const extractApiErrorMessage = async (response: Response, fallback: string) => {
  const errorData = await response.json().catch(() => null)

  if (typeof errorData?.message === 'string' && errorData.message.trim()) {
    return errorData.message
  }

  if (Array.isArray(errorData?.message) && errorData.message.length > 0) {
    return String(errorData.message[0])
  }

  return `${fallback}: ${response.status}`
}

export async function uploadStorageImage(file: File): Promise<string> {
  const token = await getAuthToken()
  if (!token) throw new Error('Не авторизовані')

  const form = new FormData()
  form.append('file', file)

  const response = await fetch(
    `${API_URL}/storage/upload?filename=${encodeURIComponent(file.name)}`,
    {
      method: 'POST',
      headers: makeAuthHeaders(token, false),
      body: form,
      cache: 'no-store',
    },
  )

  if (!response.ok) {
    throw new Error(await extractApiErrorMessage(response, 'Помилка завантаження зображення'))
  }

  const data = await response.json()
  const urlCandidates = [
    data?.url,
    data?.data?.url,
    data?.file?.url,
    data?.fileUrl,
  ]

  const url =
    urlCandidates.find((value): value is string => typeof value === 'string' && value.trim().length > 0) || ''

  if (!url) {
    throw new Error('Сервер не повернув URL зображення')
  }

  return url
}
