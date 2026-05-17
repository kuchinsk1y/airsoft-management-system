'use server'

import { getAuthToken } from '@/app/auth/server-utils'
import { NEXT_PUBLIC_API_KEY, NEXT_PUBLIC_API_URL } from '@/app/utils/config'

const API_URL = NEXT_PUBLIC_API_URL.replace(/\/$/, '')
const API_KEY = NEXT_PUBLIC_API_KEY

if (!API_URL || !API_KEY) {
  throw new Error('Missing required environment variables: NEXT_PUBLIC_API_URL or NEXT_PUBLIC_API_KEY')
}

export type CompanyGalleryPhoto = {
  id: number
  url: string
  createdAt: Date
  source: 'COMPANY'
}

const normalizePhoto = (photo: { id: number; url: string; createdAt: string }): CompanyGalleryPhoto => ({
  id: photo.id,
  url: photo.url,
  createdAt: new Date(photo.createdAt),
  source: 'COMPANY',
})

export async function getCompanyGalleryPhotos(): Promise<CompanyGalleryPhoto[]> {
  const token = await getAuthToken()
  if (!token) throw new Error('Не авторизовані')

  const response = await fetch(`${API_URL}/gallery/company`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-API-Key': API_KEY,
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || `API error: ${response.status}`)
  }

  const data = await response.json()
  const items = Array.isArray(data) ? data : []
  return items.map(normalizePhoto)
}

export async function uploadCompanyGalleryPhotos(files: File[]): Promise<CompanyGalleryPhoto[]> {
  const token = await getAuthToken()
  if (!token) throw new Error('Не авторизовані')

  const form = new FormData()
  files.forEach((file) => form.append('files', file))

  const response = await fetch(`${API_URL}/gallery/company`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-API-Key': API_KEY,
    },
    body: form,
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || `API error: ${response.status}`)
  }

  const data = await response.json()
  const items = Array.isArray(data) ? data : []
  return items.map(normalizePhoto)
}

export async function deleteCompanyGalleryPhoto(photoId: number): Promise<void> {
  const token = await getAuthToken()
  if (!token) throw new Error('Не авторизовані')

  const response = await fetch(`${API_URL}/gallery/company/${photoId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-API-Key': API_KEY,
    },
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || `API error: ${response.status}`)
  }
}
