'use server'

import { getAuthToken } from '@/app/auth/server-utils'
import { NEXT_PUBLIC_API_KEY, NEXT_PUBLIC_API_URL } from '@/app/utils/config'
import {
  WorkshopItemCategory,
  WorkshopItemFormData,
  WorkshopItem,
  WorkshopItemListFilters,
  WorkshopItemListResult,
  WorkshopItemUpsertPayload,
} from '@/app/(protected)/workshop-items/types'

const API_URL = NEXT_PUBLIC_API_URL.replace(/\/$/, '')
const API_KEY = NEXT_PUBLIC_API_KEY

if (!API_URL || !API_KEY) {
  throw new Error('Missing required environment variables: NEXT_PUBLIC_API_URL or NEXT_PUBLIC_API_KEY')
}

const toImageUrl = (image?: string): string | undefined => {
  if (!image) return undefined

  const normalized = image.trim().replace(/\\/g, '/')
  if (!normalized) return undefined

  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized
  }

  if (normalized.startsWith('/uploads')) {
    return `${API_URL}${normalized}`
  }

  if (normalized.startsWith('uploads/')) {
    return `${API_URL}/uploads/${normalized.replace(/^uploads\//, '')}`
  }

  return normalized
}

const normalizeWorkshopItem = (raw: any): WorkshopItem => {
  const category: WorkshopItemCategory =
    raw?.category === 'SUPPORT' ? 'SUPPORT' : 'SERVICES'

  return {
    id: Number(raw?.id ?? 0),
    title: String(raw?.title ?? ''),
    slug: String(raw?.slug ?? ''),
    excerpt: String(raw?.excerpt ?? ''),
    content: String(raw?.content ?? ''),
    coverImage: toImageUrl(raw?.coverImage),
    category,
    published: Boolean(raw?.published),
    publishedAt: raw?.publishedAt ? new Date(raw.publishedAt) : undefined,
    createdAt: raw?.createdAt ? new Date(raw.createdAt) : new Date(),
    updatedAt: raw?.updatedAt ? new Date(raw.updatedAt) : new Date(),
    author: {
      id: Number(raw?.author?.id ?? 0),
      nickName: String(raw?.author?.nickName ?? 'Unknown'),
      fullName: raw?.author?.fullName ?? undefined,
      logoUrl: toImageUrl(raw?.author?.logoUrl),
    },
    updatedBy: raw?.updatedBy
      ? {
          id: Number(raw.updatedBy.id ?? 0),
          nickName: String(raw.updatedBy.nickName ?? 'Unknown'),
          fullName: raw.updatedBy.fullName ?? undefined,
        }
      : undefined,
  }
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

const normalizeUpsertPayload = (data: Partial<WorkshopItemFormData>): WorkshopItemUpsertPayload => {
  const payload: WorkshopItemUpsertPayload = {
    ...(data.title !== undefined ? { title: data.title.trim() } : {}),
    ...(data.slug !== undefined ? { slug: data.slug.trim() } : {}),
    ...(data.excerpt !== undefined ? { excerpt: data.excerpt.trim() } : {}),
    ...(data.content !== undefined ? { content: data.content } : {}),
    ...(data.category === 'SERVICES' || data.category === 'SUPPORT'
      ? { category: data.category }
      : {}),
    ...(data.published !== undefined ? { published: data.published } : {}),
  }

  if (data.coverImage !== undefined) {
    const normalizedImage = data.coverImage.trim()
    if (!normalizedImage) {
      payload.coverImage = undefined
    } else if (normalizedImage.startsWith(`${API_URL}/uploads/`)) {
      payload.coverImage = normalizedImage.replace(API_URL, '')
    } else {
      payload.coverImage = normalizedImage
    }
  }

  if (data.publishedAt !== undefined) {
    const normalizedDate = data.publishedAt.trim()
    payload.publishedAt = normalizedDate || undefined
  }

  return payload
}

export async function fetchWorkshopItems(filters: WorkshopItemListFilters = {}): Promise<WorkshopItemListResult> {
  const token = await getAuthToken()

  const params = new URLSearchParams()
  if (filters.published !== undefined) params.append('published', String(filters.published))
  if (filters.searchQuery) params.append('searchQuery', filters.searchQuery)
  if (filters.category) params.append('category', filters.category)
  if (filters.limit !== undefined) params.append('limit', String(filters.limit))
  if (filters.offset !== undefined) params.append('offset', String(filters.offset))

  const response = await fetch(`${API_URL}/workshop-items${params.toString() ? `?${params.toString()}` : ''}`, {
    headers: {
      'X-API-Key': API_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const message =
      (typeof errorData?.message === 'string' && errorData.message) ||
      `Помилка отримання послуг: ${response.status}`
    throw new Error(message)
  }

  const data = await response.json()

  if (Array.isArray(data)) {
    const items = data.map(normalizeWorkshopItem)
    return {
      items,
      total: items.length,
      limit: filters.limit ?? items.length,
      offset: filters.offset ?? 0,
    }
  }

  const itemsRaw = Array.isArray(data?.items) ? data.items : []

  return {
    items: itemsRaw.map(normalizeWorkshopItem),
    total: Number(data?.total ?? itemsRaw.length),
    limit: Number(data?.limit ?? filters.limit ?? itemsRaw.length),
    offset: Number(data?.offset ?? filters.offset ?? 0),
  }
}

export async function fetchWorkshopItemById(id: number): Promise<WorkshopItem | null> {
  const token = await getAuthToken()
  if (!token) throw new Error('Не авторизовані')

  const response = await fetch(`${API_URL}/workshop-items/id/${id}`, {
    headers: makeAuthHeaders(token),
    cache: 'no-store',
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(await extractApiErrorMessage(response, 'Помилка отримання послуги'))
  }

  const data = await response.json()
  return normalizeWorkshopItem(data)
}

export async function createWorkshopItem(data: WorkshopItemFormData): Promise<WorkshopItem> {
  const token = await getAuthToken()
  if (!token) throw new Error('Не авторизовані')

  const payload = normalizeUpsertPayload(data)

  const response = await fetch(`${API_URL}/workshop-items`, {
    method: 'POST',
    headers: makeAuthHeaders(token),
    body: JSON.stringify(payload),
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(await extractApiErrorMessage(response, 'Помилка створення послуги'))
  }

  const created = await response.json()
  return normalizeWorkshopItem(created)
}

export async function updateWorkshopItem(id: number, data: Partial<WorkshopItemFormData>): Promise<WorkshopItem> {
  const token = await getAuthToken()
  if (!token) throw new Error('Не авторизовані')

  const payload = normalizeUpsertPayload(data)

  const response = await fetch(`${API_URL}/workshop-items/${id}`, {
    method: 'PATCH',
    headers: makeAuthHeaders(token),
    body: JSON.stringify(payload),
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(await extractApiErrorMessage(response, 'Помилка оновлення послуги'))
  }

  const updated = await response.json()
  return normalizeWorkshopItem(updated)
}

export async function deleteWorkshopItem(id: number): Promise<void> {
  const token = await getAuthToken()
  if (!token) throw new Error('Не авторизовані')

  const response = await fetch(`${API_URL}/workshop-items/${id}`, {
    method: 'DELETE',
    headers: makeAuthHeaders(token),
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(await extractApiErrorMessage(response, 'Помилка видалення послуги'))
  }
}

export async function uploadWorkshopItemCoverImage(file: File): Promise<string> {
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
    throw new Error(await extractApiErrorMessage(response, 'Помилка завантаження обкладинки'))
  }

  const data = await response.json()
  const urlCandidates = [
    data?.url,
    data?.data?.url,
    data?.file?.url,
    data?.fileUrl,
  ]

  const url = urlCandidates.find((value): value is string => typeof value === 'string' && value.trim().length > 0) || ''

  if (!url) {
    throw new Error('Сервер не повернув URL обкладинки')
  }

  return url
}

export async function uploadWorkshopItemInlineImage(file: File): Promise<string> {
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

