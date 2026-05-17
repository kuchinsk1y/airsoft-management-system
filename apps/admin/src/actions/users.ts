'use server'

import { getAuthToken } from '@/app/auth/server-utils'
import { NEXT_PUBLIC_API_URL, NEXT_PUBLIC_API_KEY } from '@/app/utils/config'

const API_URL = NEXT_PUBLIC_API_URL.replace(/\/$/, '')
const API_KEY = NEXT_PUBLIC_API_KEY

if (!API_URL || !API_KEY) {
  throw new Error('Missing required environment variables: NEXT_PUBLIC_API_URL or NEXT_PUBLIC_API_KEY')
}

export interface UserProfile {
  id: number
  email: string
  fullName: string | null
  nickName: string
  phoneNumber: string | null
  dateOfBirth: string | null
  country: string | null
  region: string | null
  city: string | null
  logoUrl: string | null
  isVerified: boolean
  createdAt: string
  updatedAt: string
}

export async function getCurrentUser(): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
  try {
    const token = await getAuthToken()
    if (!token) return { success: false, error: 'Не авторизован' }

    const response = await fetch(`${API_URL}/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-api-key': API_KEY,
      },
      cache: 'no-store',
    })

    if (!response.ok) return { success: false, error: 'Не удалось получить данные пользователя' }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error('Get current user error:', error)
    return { success: false, error: 'Ошибка при получении данных пользователя' }
  }
}

export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const token = await getAuthToken()
    if (!token) {
      return []
    }

    const response = await fetch(`${API_URL}/users/all`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-api-key': API_KEY,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error(`Failed to fetch users: ${response.status}`)
      return []
    }

    return await response.json()
  } catch (error) {
    console.error('Fetch all users error:', error)
    return []
  }
}

export async function getUsersCount(): Promise<number> {
  try {
    const token = await getAuthToken()
    if (!token) return 0

    const response = await fetch(`${API_URL}/users/count`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-api-key': API_KEY,
      },
      cache: 'no-store',
    })

    if (!response.ok) return 0

    const data = await response.json()
    return typeof data?.count === 'number' ? data.count : 0
  } catch (error) {
    console.error('Get users count error:', error)
    return 0
  }
}

export async function updateUser(userData: Partial<UserProfile>): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
  try {
    const token = await getAuthToken()
    if (!token) return { success: false, error: 'Не авторизован' }

    const response = await fetch(`${API_URL}/users`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return { success: false, error: errorData.message || 'Не удалось обновить профиль' }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error('Update user error:', error)
    return { success: false, error: 'Ошибка при обновлении профиля' }
  }
}

export async function uploadAvatar(formData: FormData): Promise<{ success: boolean; logoUrl?: string; error?: string }> {
  try {
    const token = await getAuthToken()
    if (!token) return { success: false, error: 'Не авторизован' }

    const response = await fetch(`${API_URL}/users/upload-avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-api-key': API_KEY,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return { success: false, error: errorData.message || 'Не удалось загрузить аватар' }
    }

    const data = await response.json()
    return { success: true, logoUrl: data.logoUrl }
  } catch (error) {
    console.error('Upload avatar error:', error)
    return { success: false, error: 'Ошибка при загрузке аватара' }
  }
}
