'use server'

import { getAuthToken } from '@/app/auth/server-utils'
import { NEXT_PUBLIC_API_URL, NEXT_PUBLIC_API_KEY } from '@/app/utils/config'

const API_URL = NEXT_PUBLIC_API_URL.replace(/\/$/, '')
const API_KEY = NEXT_PUBLIC_API_KEY

if (!API_URL || !API_KEY) {
  throw new Error('Missing required environment variables: NEXT_PUBLIC_API_URL or NEXT_PUBLIC_API_KEY')
}

export type CommentStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type CommentScope = 'EVENT' | 'COMPANY'

export interface CommentDto {
  id: number
  eventId?: number
  scope: CommentScope
  userId: number
  message: string
  status: CommentStatus
  createdAt: string
  moderatedAt?: string
  author: {
    id: number
    nickName: string
    fullName?: string
    logoUrl?: string
  }
  event?: {
    id: number
    name: string
  }
  moderator?: {
    id: number
    nickName: string
    fullName?: string
  }
}

export async function getCommentsByStatus(status: CommentStatus, scope?: CommentScope): Promise<CommentDto[]> {
  try {
    const token = await getAuthToken()
    if (!token) return []

    const query = new URLSearchParams({ status })
    if (scope) {
      query.set('scope', scope)
    }

    const response = await fetch(`${API_URL}/comments?${query.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-api-key': API_KEY,
      },
      cache: 'no-store',
    })

    if (!response.ok) return []

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Failed to fetch comments:', error)
    return []
  }
}

export async function approveComment(id: number): Promise<CommentDto | null> {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Не авторизовані')

    const response = await fetch(`${API_URL}/comments/${id}/approve`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-api-key': API_KEY,
      },
    })

    if (!response.ok) return null

    return await response.json()
  } catch (error) {
    console.error('Failed to approve comment:', error)
    return null
  }
}

export async function rejectComment(id: number): Promise<CommentDto | null> {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Не авторизовані')

    const response = await fetch(`${API_URL}/comments/${id}/reject`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-api-key': API_KEY,
      },
    })

    if (!response.ok) return null

    return await response.json()
  } catch (error) {
    console.error('Failed to reject comment:', error)
    return null
  }
}
