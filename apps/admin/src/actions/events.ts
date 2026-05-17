'use server'

import { Event, EventFormData, EventGalleryItem, EventStatus } from '@/app/(protected)/events/types'
import { getAuthToken } from '@/app/auth/server-utils'
import { NEXT_PUBLIC_API_KEY, NEXT_PUBLIC_API_URL } from '@/app/utils/config'
import { getEnglishCompetitionType } from '@/utils/i18n'

const API_URL = NEXT_PUBLIC_API_URL.replace(/\/$/, '')
const API_KEY = NEXT_PUBLIC_API_KEY

if (!API_URL || !API_KEY) {
  throw new Error('Missing required environment variables: NEXT_PUBLIC_API_URL or NEXT_PUBLIC_API_KEY')
}

interface ApplicationResponse {
  id: number
  uid: string
  name: string
  ownerId: number
}

interface FetchEventsFilters {
  competitionType?: string
  city?: string
  status?: EventStatus
}

interface UpdateEventStatusPayload {
  status: Exclude<EventStatus, 'PENDING'>
  reason?: string
}

/**
 * Получить все приложения текущего пользователя
*/
async function getAllUserApplications(tokenFromCaller?: string): Promise<ApplicationResponse[]> {
  try {
    const token = tokenFromCaller ?? await getAuthToken()
    if (!token) return []

    const response = await fetch(`${API_URL}/applications`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': API_KEY,
      },
    })

    if (!response.ok) return []

    const apps = await response.json()
    return Array.isArray(apps) ? apps : []
  } catch {
    return []
  }
}

/**
 * Получить ID текущего пользователя
*/
async function getCurrentUserId(tokenFromCaller?: string): Promise<number | null> {
  try {
    const token = tokenFromCaller ?? await getAuthToken()
    if (!token) return null

    const response = await fetch(`${API_URL}/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-api-key': API_KEY,
      },
    })

    if (!response.ok) return null

    const user = await response.json()
    return user?.id || null
  } catch {
    return null
  }
}

const normalizeEvent = (event: Event): Event => {
  const city = event?.city
    ? event.city
    : typeof event?.city === 'string'
      ? { id: 0, name: event.city, slug: event.city }
      : { id: 0, name: '', slug: '' }

  const image = (() => {
    const img = event?.image || ''
    if (!img) return ''
    if (img.startsWith('http://') || img.startsWith('https://')) return img
    if (img.startsWith('/')) return `${API_URL}${img}`
    return `${API_URL}/${img}`
  })()

  return {
    ...event,
    city,
    image,
    startDate: new Date(event.startDate),
    gameStartDate: event.gameStartDate ? new Date(event.gameStartDate) : new Date(event.startDate),
    endDate: event.endDate ? new Date(event.endDate) : undefined,
    description: event.description || undefined,
    createdAt: new Date(event.createdAt),
    updatedAt: new Date(event.updatedAt),
    applicationId: event.applicationId || event.application?.id || 0,
    application: event.application || {
      id: event.applicationId || 0,
      uid: '',
      name: '',
      phoneNumber: null,
      owner: {
        id: 0,
        fullName: null,
        nickName: 'Unknown',
      },
    },
    registeredParticipants: event.registeredParticipants || 0,
    gameTypeId: event.gameTypeId,
    gameType: event.gameType,
    isCompleted: event.isCompleted ?? false,
    completedAt: event.completedAt ? new Date(event.completedAt) : undefined,
    status: event.status || 'PENDING',
    statusReason: event.statusReason ?? undefined,
  }
}

const normalizeGalleryItems = (items: Array<{ id: number; url: string; createdAt?: string }>): EventGalleryItem[] => {
  return items.map((item) => ({
    id: item.id,
    url: item.url,
    createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
  }))
}

async function fetchEventsCollection(filters?: FetchEventsFilters): Promise<Event[]> {
  const token = await getAuthToken()
  if (!token) {
    return []
  }

  const [applications, currentUserId] = await Promise.all([
    getAllUserApplications(token),
    getCurrentUserId(token),
  ])
  const ownedApplications = applications.filter(app => app.ownerId === currentUserId)

  let applicationId: number | undefined = undefined
  if (ownedApplications.length > 0) applicationId = ownedApplications[0].id

  const baseParams = new URLSearchParams()
  if (filters?.competitionType) baseParams.set('competitionType', filters.competitionType)
  if (filters?.city) baseParams.set('city', filters.city)
  if (applicationId) baseParams.set('applicationId', String(applicationId))
  if (filters?.status) baseParams.set('status', filters.status)

  const buildUrl = (isActive: boolean) => {
    const params = new URLSearchParams(baseParams)
    params.set('isActive', String(isActive))
    return `${API_URL}/events?${params.toString()}`
  }

  const [activeRes, inactiveRes] = await Promise.all([
    fetch(buildUrl(true), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    }),
    fetch(buildUrl(false), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    }),
  ])

  if (!activeRes.ok || !inactiveRes.ok) {
    console.error(`Failed to fetch events: ${activeRes.status} / ${inactiveRes.status}`)
    return []
  }

  const activeData = await activeRes.json()
  const inactiveData = await inactiveRes.json()

  const activeEvents = Array.isArray(activeData) ? activeData : [activeData]
  const inactiveEvents = Array.isArray(inactiveData) ? inactiveData : [inactiveData]

  return [...activeEvents, ...inactiveEvents].map(normalizeEvent)
}

/**
 * Получить события
*/
export async function fetchEvents(filters?: {
  isActive?: boolean
  competitionType?: string
  city?: string
}): Promise<Event[]> {
  try {
    return await fetchEventsCollection({
      competitionType: filters?.competitionType,
      city: filters?.city,
    })
  } catch (error) {
    console.error('Failed to fetch events:', error)
    return []
  }
}

export async function fetchApprovedEvents(filters?: {
  competitionType?: string
  city?: string
}): Promise<Event[]> {
  try {
    return await fetchEventsCollection({
      competitionType: filters?.competitionType,
      city: filters?.city,
      status: 'APPROVED',
    })
  } catch (error) {
    console.error('Failed to fetch approved events:', error)
    return []
  }
}

export async function fetchModerationEvents(status?: EventStatus): Promise<Event[]> {
  try {
    return await fetchEventsCollection({ status })
  } catch (error) {
    console.error('Failed to fetch moderation events:', error)
    return []
  }
}

export async function fetchPendingModerationCount(): Promise<number> {
  try {
    const token = await getAuthToken()
    if (!token) return 0

    const response = await fetch(`${API_URL}/events/moderation/pending-count`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return typeof data?.count === 'number' ? data.count : 0
  } catch (error) {
    console.error('Failed to fetch pending moderation count:', error)
    return 0
  }
}

/**
 * Получить одно событие по ID
*/
export async function fetchEventById(id: number): Promise<Event> {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Не авторизовані')

    const response = await fetch(`${API_URL}/events/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) throw new Error(`API error: ${response.status}`)

    const data = await response.json()

    return normalizeEvent(data)
  } catch (error) {
    console.error('Failed to fetch event:', error)
    throw error
  }
}

/**
 * Создать новое событие
*/
export async function createEvent(data: EventFormData): Promise<Event> {
  return createEventWithImage(data, undefined)
}

/**
 * Обновить событие
*/
export async function updateEvent(id: number, data: Partial<EventFormData>): Promise<Event> {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Не авторизовані')

    const payload: Record<string, unknown> = {}

    if (data.name) payload.name = data.name
    if (data.image) payload.image = data.image
    if (data.startDate) payload.startDate = data.startDate.toISOString()
    if (data.gameStartDate) payload.gameStartDate = data.gameStartDate.toISOString()
    if (data.endDate) payload.endDate = data.endDate.toISOString()
    if (data.description !== undefined) payload.description = data.description || null
    if (data.city) payload.city = data.city
    if (data.address) payload.address = data.address
    if (data.regionId != null) payload.regionId = data.regionId
    const computedMaxParticipants =
      data.sides && data.sides.length > 0
        ? data.sides.reduce((sum, side) => sum + Math.max(1, Math.trunc(side.sideCapacity || 0)), 0)
        : undefined
    if (computedMaxParticipants !== undefined) payload.maxParticipants = computedMaxParticipants
    if (data.competitionType) payload.competitionType = getEnglishCompetitionType(data.competitionType)
    if (data.gameTypeId !== undefined) payload.gameTypeId = data.gameTypeId
    if (data.price !== undefined) payload.price = data.price
    if (data.isActive !== undefined) payload.isActive = data.isActive
    if (data.sides && data.sides.length >= 2) {
      payload.sides = data.sides.map((s) => ({
        name: s.name.trim(),
        sideCapacity: Math.max(1, Math.trunc(s.sideCapacity || 0)),
      }))
    }
    if (data.socialLinks !== undefined) {
      const filtered = Object.fromEntries(
        Object.entries(data.socialLinks).filter(([, v]) => v != null && String(v).trim() !== '')
      )
      payload.socialLinks = Object.keys(filtered).length > 0 ? filtered : null
    }

    const response = await fetch(`${API_URL}/events/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) throw new Error(`API error: ${response.status}`)

    const result = await response.json()

    return normalizeEvent(result)
  } catch (error) {
    console.error('Failed to update event:', error)
    throw error
  }
}

export async function updateEventStatus(id: number, data: UpdateEventStatusPayload): Promise<Event> {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Не авторизовані')

    const response = await fetch(`${API_URL}/events/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData?.message || `API error: ${response.status}`)
    }

    return normalizeEvent(await response.json())
  } catch (error) {
    console.error('Failed to update event status:', error)
    throw error
  }
}

/**
 * Создать событие с загрузкой изображения
*/
export async function createEventWithImage(
  data: EventFormData,
  imageFile?: File
): Promise<Event> {
  try {
    const token = await getAuthToken()
    if (!token) {
      console.error('[createEventWithImage] No auth token')
      throw new Error('Не авторизовані')
    }

    const [applications, currentUserId] = await Promise.all([
      getAllUserApplications(token),
      getCurrentUserId(token),
    ])

    if (!currentUserId) {
      console.error('[createEventWithImage] Could not get current user ID')
      throw new Error('Не вдалося отримати ID користувача')
    }

    const ownedApplications = applications.filter(app => app.ownerId === currentUserId)

    const sides =
      data.sides && data.sides.length >= 2
        ? data.sides.map((s) => ({
            name: s.name.trim(),
            sideCapacity: Math.max(1, Math.trunc(s.sideCapacity || 0)),
          }))
        : [
            { name: 'Сторона 1', sideCapacity: 10 },
            { name: 'Сторона 2', sideCapacity: 10 },
          ]

    const computedMaxParticipants = sides.reduce(
      (sum, side) => sum + side.sideCapacity,
      0,
    )

    const payload: Record<string, unknown> = {
      name: data.name,
      image: data.image, // Имя файла или путь (если есть imageFile, то там file.name)
      startDate: data.startDate.toISOString(),
      gameStartDate: data.gameStartDate.toISOString(),
      endDate: data.endDate.toISOString(),
      description: data.description || undefined,
      city: data.city,
      address: data.address,
      regionId: data.regionId,
      maxParticipants: computedMaxParticipants,
      competitionType: getEnglishCompetitionType(data.competitionType),
      gameTypeId: data.gameTypeId,
      price: data.price,
      isActive: data.isActive !== false,
      paymentMethods: data.paymentMethods?.length ? data.paymentMethods : ['BANK', 'CASH'],
      sides,
      ...(data.socialLinks && Object.keys(data.socialLinks).length > 0
        ? {
            socialLinks: Object.fromEntries(
              Object.entries(data.socialLinks).filter(([, v]) => v != null && String(v).trim() !== '')
            ),
          }
        : {}),
    }

    // Якщо адмін явно вибрав організацію - використовуємо її
    if (data.applicationId) {
      payload.applicationId = data.applicationId
    } else if (ownedApplications.length > 0) {
      // Якщо юзер має організацію - використовуємо
      payload.applicationId = ownedApplications[0].id
    } else {
      // Нема жодної організації: не блокуємо адміна, даємо бекенду вирішити
      console.warn('[createEventWithImage] No applications found for user, proceeding without applicationId:', currentUserId)
      // payload.applicationId залишаємо undefined
    }

    // Сначала создаем событие
    const response = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[createEventWithImage] Backend error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        payload
      })
      throw new Error(errorData?.message || `Помилка ${response.status}: ${response.statusText}`)
    }

    let event = await response.json()

    // Если есть файл - загружаем его сразу
    if (imageFile) {
      const form = new FormData()
      form.append('file', imageFile)

      const uploadResponse = await fetch(`${API_URL}/events/${event.id}/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-API-Key': API_KEY,
        },
        body: form,
      })

      if (!uploadResponse.ok) {
        const text = await uploadResponse.text().catch(() => '')
        console.error('[createEventWithImage] Image upload failed:', {
          status: uploadResponse.status,
          error: text
        })
        throw new Error(`Помилка завантаження зображення: ${text || uploadResponse.status}`)
      }

      const uploadResult = await uploadResponse.json()
      // Используем URL из ответа - это правильный путь загруженного файла
      if (uploadResult?.url) {
        event.image = uploadResult.url
      } else if (uploadResult?.event?.id) {
        event = uploadResult.event
      } else if (uploadResult?.id) {
        event = uploadResult
      }
    }

    return normalizeEvent(event)
  } catch (error) {
    console.error('[createEventWithImage] Exception:', error)
    if (error instanceof Error) throw error
    throw new Error('Невідома помилка при створенні події з зображенням')
  }
}

/**
 * Обновить событие с загрузкой изображения
*/
export async function updateEventWithImage(
  id: number,
  data: EventFormData,
  imageFile?: File
): Promise<Event> {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Не авторизовані')

    // Если будет загружена новая картинка - отправляем имя файла
    // Если картинка не меняется - отправляем как есть
    const sides =
      data.sides && data.sides.length >= 2
        ? data.sides.map((s) => ({
            name: s.name.trim(),
            sideCapacity: Math.max(1, Math.trunc(s.sideCapacity || 0)),
          }))
        : [
            { name: 'Сторона 1', sideCapacity: 10 },
            { name: 'Сторона 2', sideCapacity: 10 },
          ]

    const computedMaxParticipants = sides.reduce(
      (sum, side) => sum + side.sideCapacity,
      0,
    )

    const payload: Record<string, unknown> = {
      ...data,
      startDate: data.startDate.toISOString(),
      gameStartDate: data.gameStartDate.toISOString(),
      endDate: data.endDate.toISOString(),
      sides,
      maxParticipants: computedMaxParticipants,
    }
    if (imageFile) payload.image = imageFile.name

    if (data.socialLinks !== undefined) {
      const filtered = Object.fromEntries(
        Object.entries(data.socialLinks).filter(([, v]) => v != null && String(v).trim() !== '')
      )
      payload.socialLinks = Object.keys(filtered).length > 0 ? filtered : null
    }

    // Трансформируем applicationId в формат который ожидает backend при UPDATE
    if (payload.applicationId) {
      payload.application = { connect: { id: payload.applicationId } }
      delete payload.applicationId
    }

    // Обновляем данные события
    const response = await fetch(`${API_URL}/events/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[updateEventWithImage] Backend error:', {
        status: response.status,
        error: errorData,
        payload
      })
      throw new Error(errorData?.message || `API error: ${response.status}`)
    }

    let event = await response.json()

    // Если есть новый файл - загружаем его
    if (imageFile) {
      const form = new FormData()
      form.append('file', imageFile)

      const uploadResponse = await fetch(`${API_URL}/events/${id}/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-API-Key': API_KEY,
        },
        body: form,
      })

      if (!uploadResponse.ok) {
        const text = await uploadResponse.text().catch(() => '')
        console.error('[updateEventWithImage] Image upload failed:', {
          status: uploadResponse.status,
          error: text
        })
        throw new Error(`Помилка завантаження зображення: ${text || uploadResponse.status}`)
      }

      const uploadResult = await uploadResponse.json()
      // Используем URL из ответа как при createEventWithImage
      if (uploadResult?.url) {
        event.image = uploadResult.url
      } else if (uploadResult?.event?.id) {
        event = uploadResult.event
      } else if (uploadResult?.id) {
        event = uploadResult
      }
    }

    return normalizeEvent(event)
  } catch (error) {
    console.error('Error updating event with image:', error)
    throw error
  }
}

/**
 * Удалить событие
*/
export async function deleteEvent(id: number): Promise<void> {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Не авторизовані')

    const response = await fetch(`${API_URL}/events/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-API-Key': API_KEY,
      },
    })

    if (!response.ok) throw new Error(`API error: ${response.status}`)
  } catch (error) {
    console.error('Failed to delete event:', error)
    throw error
  }
}

/**
 * Получить галерею события
 */
export async function getEventGallery(eventId: number): Promise<EventGalleryItem[]> {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Не авторизовані')

    const response = await fetch(`${API_URL}/events/${eventId}/gallery`, {
      headers: {
        'Authorization': `Bearer ${token}`,
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
    return normalizeGalleryItems(items)
  } catch (error) {
    console.error('Failed to fetch event gallery:', error)
    throw error
  }
}

/**
 * Загрузить фото в галерею события
 */
export async function uploadEventGallery(eventId: number, files: File[]): Promise<EventGalleryItem[]> {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Не авторизовані')

    const form = new FormData()
    files.forEach((file) => form.append('files', file))

    const response = await fetch(`${API_URL}/events/${eventId}/gallery`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
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
    return normalizeGalleryItems(items)
  } catch (error) {
    console.error('Failed to upload event gallery:', error)
    throw error
  }
}

/**
 * Удалить фото из галереи события
 */
export async function deleteEventGalleryPhoto(eventId: number, photoId: number): Promise<void> {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Не авторизовані')

    const response = await fetch(`${API_URL}/events/${eventId}/gallery/${photoId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': API_KEY,
      },
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(text || `API error: ${response.status}`)
    }
  } catch (error) {
    console.error('Failed to delete event gallery photo:', error)
    throw error
  }
}

/**
 * Завершить событие
*/
export async function completeEvent(eventId: number): Promise<Event> {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Не авторизовані')

    const response = await fetch(`${API_URL}/events/${eventId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API error:', response.status, errorText)
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return normalizeEvent(data)
  } catch (error) {
    console.error('Error completing event:', error)
    throw error
  }
}

/**
 * Получить регистрации события
*/
export async function getEventRegistrations(eventId: number, status?: string): Promise<Array<{
  id: number
  userId: number
  teamId: number | null
  status: string
  eventSideId?: number | null
  user: {
    id: number
    fullName: string | null
    nickName: string
    logoUrl: string | null
  }
  team: {
    id: number
    name: string
    logoUrl: string | null
  } | null
  createdAt: string
}>> {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Не авторизовані')

    const params = new URLSearchParams()
    if (status) params.append('status', status)

    const url = `${API_URL}/events/${eventId}/registrations${params.toString() ? `?${params.toString()}` : ''}`

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API error:', response.status, errorText)
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error fetching event registrations:', error)
    throw error
  }
}

/**
 * Загрузить изображение события
*/
export async function uploadEventImage(eventId: number, file: File): Promise<Event> {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Не авторизовані')

    const form = new FormData()
    form.append('file', file)

    const response = await fetch(`${API_URL}/events/${eventId}/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': API_KEY,
      },
      body: form,
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(text || `API error: ${response.status}`)
    }

    const result = await response.json()
    const event = result.event || result

    return normalizeEvent(event)
  } catch (error) {
    console.error('Failed to upload event image:', error)
    throw error
  }
}
