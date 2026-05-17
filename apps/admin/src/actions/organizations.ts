'use server'

import { getAuthToken } from '@/app/auth/server-utils'
import { NEXT_PUBLIC_API_URL } from '@/app/utils/config'

const API_URL = NEXT_PUBLIC_API_URL.replace(/\/$/, '')

if (!API_URL) {
  throw new Error('Missing required environment variable: NEXT_PUBLIC_API_URL')
}

export interface SocialLinkDto {
  provider: string
  url: string
}

export interface OrganizationResponse {
  id: number
  companyName: string
  logoUrl?: string
  websiteUrl?: string
  phone?: string
  registrationSmsEnabled: boolean
  socialLinks: SocialLinkDto[]
  updatedAt: string
}

export interface UpdateOrganizationRequest {
  companyName?: string
  logoUrl?: string
  websiteUrl?: string
  phone?: string
  registrationSmsEnabled?: boolean
  socialLinks?: SocialLinkDto[]
}

export type OperationStatus = 'success' | 'unauthenticated' | 'forbidden' | 'error'

export interface OperationResult<T> {
  data?: T
  status: OperationStatus
  message?: string
}

function normalizeApiErrorMessage(errorData: unknown, fallback: string): string {
  if (!errorData || typeof errorData !== 'object') {
    return fallback
  }

  const maybeMessage = (errorData as { message?: unknown }).message

  if (Array.isArray(maybeMessage)) {
    return maybeMessage.filter((item): item is string => typeof item === 'string').join(' ')
  }

  if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
    return maybeMessage
  }

  return fallback
}

/**
 * Отримати дані Organization
 */
export async function getOrganization(): Promise<OperationResult<OrganizationResponse>> {
  try {
    const response = await fetch(`${API_URL}/organization`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return {
        status: 'error',
        message: `Помилка: ${response.statusText}`,
      }
    }

    const data = await response.json()
    return {
      data,
      status: 'success',
    }
  } catch (error) {
    console.error('Failed to fetch organization:', error)
    return {
      status: 'error',
      message: 'Не вдалося завантажити дані організації',
    }
  }
}

/**
 * Оновити дані Organization (тільки для адміністратора)
 */
export async function updateOrganization(
  data: UpdateOrganizationRequest,
): Promise<OperationResult<OrganizationResponse>> {
  try {
    const token = await getAuthToken()
    if (!token) {
      return {
        status: 'unauthenticated',
        message: 'Ви не авторизовані',
      }
    }

    const response = await fetch(`${API_URL}/organization`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    if (response.status === 403) {
      return {
        status: 'forbidden',
        message: 'Ви не маєте прав для редагування організаційних даних',
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        status: 'error',
        message: normalizeApiErrorMessage(errorData, `Помилка: ${response.statusText}`),
      }
    }

    const updatedData = await response.json()
    return {
      data: updatedData,
      status: 'success',
    }
  } catch (error) {
    console.error('Failed to update organization:', error)
    return {
      status: 'error',
      message: 'Не вдалося оновити дані організації',
    }
  }
}
