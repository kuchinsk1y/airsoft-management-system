'use server'

import { getAuthToken } from '@/app/auth/server-utils'
import { NEXT_PUBLIC_API_URL, NEXT_PUBLIC_API_KEY } from '@/app/utils/config'

const API_URL = NEXT_PUBLIC_API_URL.replace(/\/$/, '')
const API_KEY = NEXT_PUBLIC_API_KEY

if (!API_URL || !API_KEY) {
  throw new Error('Missing required environment variables: NEXT_PUBLIC_API_URL or NEXT_PUBLIC_API_KEY')
}

export async function getTemplate(
  key: string
): Promise<
  { success: true; data: unknown } | { success: false; error: string }
> {
  try {
    const url = `${API_URL.replace(/\/$/, '')}/template/${encodeURIComponent(key)}`
    const res = await fetch(url, {headers: { 'x-api-key': API_KEY }, cache: 'no-store'})

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      return { success: false, error: `API ${res.status}: ${text}` }
    }

    const data = await res.json()
    return { success: true, data }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Failed to fetch template' }
  }
}

export async function updateTemplate(
  key: string,
  config: unknown
): Promise<
  { success: true; data: unknown } | { success: false; error: string }
> {
  try {
    const token = await getAuthToken()
    if (!token) return { success: false, error: 'Не авторизовані' }

    const url = `${API_URL.replace(/\/$/, '')}/template/${encodeURIComponent(key)}`

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ config }),
      cache: 'no-store',
    })

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      return { success: false, error: `API ${res.status}: ${text}` }
    }

    const data = await res.json()
    return { success: true, data }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Failed to update template' }
  }
}

export async function patchTemplate(
  key: string,
  config: unknown
): Promise<
  { success: true; data: unknown } | { success: false; error: string }
> {
  try {
    const token = await getAuthToken()
    if (!token) return { success: false, error: 'Не авторизовані' }

    const url = `${API_URL.replace(/\/$/, '')}/template/${encodeURIComponent(key)}`

    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ config }),
      cache: 'no-store',
    })

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      return { success: false, error: `API ${res.status}: ${text}` }
    }

    const data = await res.json()
    return { success: true, data }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Failed to patch template' }
  }
}

export async function uploadTemplateImage(
  key: string,
  file: File,
  field?: string
): Promise<
  { success: true; data: unknown } | { success: false; error: string }
> {
  try {
    const token = await getAuthToken()
    if (!token) return { success: false, error: 'Не авторизовані' }

    const form = new FormData()
    form.append('file', file)

    let url = `${API_URL.replace(/\/$/, '')}/template/${encodeURIComponent(key)}/upload-image`
    if (field) url += `?field=${encodeURIComponent(field)}`

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: form,
      cache: 'no-store',
    })

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      return { success: false, error: `API ${res.status}: ${text}` }
    }

    const data = await res.json()
    return { success: true, data }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Failed to upload template image' }
  }
}
