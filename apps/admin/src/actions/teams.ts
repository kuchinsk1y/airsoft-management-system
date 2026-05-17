'use server'

import { getAuthToken } from '@/app/auth/server-utils'
import { NEXT_PUBLIC_API_KEY, NEXT_PUBLIC_API_URL } from '@/app/utils/config'

const API_URL = NEXT_PUBLIC_API_URL.replace(/\/$/, '')
const API_KEY = NEXT_PUBLIC_API_KEY

if (!API_URL || !API_KEY) {
  throw new Error('Missing required environment variables: NEXT_PUBLIC_API_URL or NEXT_PUBLIC_API_KEY')
}

export interface TeamMember {
  id: number
  teamId: number
  userId: number
  memberStatus: 'PENDING' | 'ACTIVE' | 'LEFT'
  joinedAt: string | null
  leftAt: string | null
  teamContribution: number
  role?: string
  user: {
    id: number
    nickName: string
    logoUrl: string | null
  }
}

export interface Team {
  id: number
  name: string
  logoUrl: string | null
  description: string | null
  createdAt: string
  updatedAt: string
  members?: TeamMember[]
}

export interface TeamsFilters {
  searchQuery?: string
}


/**
 * Получить список всех команд
 */
export async function fetchTeams(filters?: TeamsFilters): Promise<Team[]> {
  try {
    const token = await getAuthToken()
    if (!token) {
      return []
    }

    const params = new URLSearchParams()
    if (filters?.searchQuery) {
      params.append('searchQuery', filters.searchQuery)
    }

    const url = `${API_URL}/teams${params.toString() ? `?${params.toString()}` : ''}`

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-api-key': API_KEY,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      if (response.status === 404) {
        return []
      }

      console.error(`Failed to fetch teams: ${response.status}`)
      return []
    }

    return await response.json()
  } catch (error) {
    console.error('Fetch teams error:', error)
    return []
  }
}

/**
 * Получить количество команд
 */
export async function getTeamsCount(): Promise<number> {
  try {
    const teams = await fetchTeams()
    return teams.length
  } catch (error) {
    console.error('Get teams count error:', error)
    return 0
  }
}

/**
 * Получить детали команды по ID
 */
export async function getTeamById(id: number): Promise<Team | null> {
  try {
    const token = await getAuthToken()
    if (!token) {
      return null
    }

    const response = await fetch(`${API_URL}/teams/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch team ${id}: ${response.status}`)
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Failed to fetch team:', error)
    return null
  }
}

/**
 * Получить участников команды
 */
export async function getTeamMembers(teamId: number): Promise<TeamMember[]> {
  try {
    const token = await getAuthToken()
    if (!token) {
      return []
    }

    const response = await fetch(`${API_URL}/teams/${teamId}/members`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error(`Failed to fetch team members: ${response.status}`)
      return []
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Failed to fetch team members:', error)
    return []
  }
}

/**
 * Передать права владельца команды другому участнику
 */
export async function reassignTeamOwnerByAdmin(teamId: number, newOwnerId: number): Promise<void> {
  try {
    const token = await getAuthToken()
    if (!token) {
      console.error('No auth token available')
      throw new Error('Необхідно увійти в систему')
    }

    const response = await fetch(`${API_URL}/teams/${teamId}/reassign-owner`, {
      method: 'PATCH',
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({ newOwnerId }),
    })

    if (!response.ok) {
      const raw = await response.json().catch(() => ({ message: 'Помилка при передачі прав власника' }))
      const msg = String(raw?.message || '')

      if (msg.includes('ACCESS_DENIED')) {
        throw new Error('Недостатньо прав для передачі власника команди')
      }
      if (msg.includes('USER_ALREADY_TEAM_OWNER')) {
        throw new Error('Обраний користувач вже є власником команди')
      }
      if (msg.includes('USER_NOT_TEAM_MEMBER')) {
        throw new Error('Обраний користувач не є активним учасником команди')
      }

      throw new Error(raw?.message || 'Помилка при передачі прав власника')
    }
  } catch (error) {
    console.error('Reassign team owner error:', error)
    throw error instanceof Error ? error : new Error('Помилка при передачі прав власника')
  }
}
