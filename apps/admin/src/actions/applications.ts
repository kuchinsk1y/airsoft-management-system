'use server'

import { getAuthToken } from '@/app/auth/server-utils'
import { NEXT_PUBLIC_API_KEY, NEXT_PUBLIC_API_URL } from '@/app/utils/config'

const API_URL = NEXT_PUBLIC_API_URL.replace(/\/$/, '')
const API_KEY = NEXT_PUBLIC_API_KEY

if (!API_URL || !API_KEY) {
  throw new Error('Missing required environment variables: NEXT_PUBLIC_API_URL or NEXT_PUBLIC_API_KEY')
}

export interface ApplicationResponse {
  id: number
  uid: string
  name: string
  address?: string
  phoneNumber?: string
  description?: string
  logoUrl?: string
  ownerId: number
  createdAt: string
  updatedAt: string
}

export interface CreateApplicationRequest {
  name: string
  address?: string
  phoneNumber?: string
  description?: string
  logoUrl?: string
}

export type GetApplicationsStatus = 'success' | 'unauthenticated' | 'error'

export interface GetApplicationsResult {
  applications: ApplicationResponse[]
  isAdmin: boolean
  status: GetApplicationsStatus
}

/**
 * Получить список приложений текущего пользователя
 */
export async function getApplications(): Promise<GetApplicationsResult> {
  try {
    const token = await getAuthToken()
    if (!token) {
      return {
        applications: [],
        isAdmin: false,
        status: 'unauthenticated',
      }
    }

    const response = await fetch(`${API_URL}/applications`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
    })

    if (!response.ok) {
      return {
        applications: [],
        isAdmin: false,
        status: response.status === 401 || response.status === 403 ? 'unauthenticated' : 'error',
      }
    }

    const data = await response.json()
    const apps = Array.isArray(data?.applications) ? data.applications : []
    return {
      applications: apps,
      isAdmin: Boolean(data?.isAdmin),
      status: 'success',
    }
  } catch (error) {
    console.error('Failed to fetch applications:', error)
    return {
      applications: [],
      isAdmin: false,
      status: 'error',
    }
  }
}

/**
 * Получить одно приложение по ID
 */
export async function getApplicationById(id: number): Promise<ApplicationResponse> {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Не авторизовані')

    const response = await fetch(`${API_URL}/applications/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
    })

    if (!response.ok) throw new Error(`Помилка при отриманні організації: ${response.status}`)

    return await response.json()
  } catch (error) {
    console.error('Failed to fetch application:', error)
    throw error
  }
}

/**
 * Создать новое приложение
 */
export async function createApplication(
  data: CreateApplicationRequest
): Promise<ApplicationResponse> {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Не авторизовані')

    const payload = {
      name: data.name,
      address: data.address || undefined,
      phoneNumber: data.phoneNumber || undefined,
      description: data.description || undefined,
      logoUrl: data.logoUrl || undefined,
    }

    const response = await fetch(`${API_URL}/applications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.message || `Помилка при створенні організації: ${response.status}`
      throw new Error(errorMessage)
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to create application:', error)
    throw error
  }
}

/**
 * Обновить приложение
 */
export async function updateApplication(
  id: number,
  data: Partial<CreateApplicationRequest>
): Promise<ApplicationResponse> {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Не авторизовані')

    const payload: Record<string, unknown> = {}

    if (data.name) payload.name = data.name
    if (data.address !== undefined) payload.address = data.address || null
    if (data.phoneNumber !== undefined) {
      payload.phoneNumber = data.phoneNumber || null
    }
    if (data.description !== undefined) payload.description = data.description || null
    if (data.logoUrl !== undefined) payload.logoUrl = data.logoUrl || null

    const response = await fetch(`${API_URL}/applications/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) throw new Error(`Помилка при оновленні організації: ${response.status}`)

    return await response.json()
  } catch (error) {
    console.error('Failed to update application:', error)
    throw error
  }
}
