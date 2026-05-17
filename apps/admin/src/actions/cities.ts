'use server'

import { getAuthToken } from '@/app/auth/server-utils'
import { NEXT_PUBLIC_API_URL, NEXT_PUBLIC_API_KEY } from '@/app/utils/config'

const API_URL = NEXT_PUBLIC_API_URL.replace(/\/$/, '')
const API_KEY = NEXT_PUBLIC_API_KEY

if (!API_URL || !API_KEY) {
  throw new Error('Missing required environment variables: NEXT_PUBLIC_API_URL or NEXT_PUBLIC_API_KEY')
}

export interface FaqItem {
  question: string
  answer: string
}

export interface City {
  id: number
  name: string
  slug: string
  regionId?: number
  region?: {
    id: number
    name: string
    slug: string
  }
  seoText?: string | null
  seoFaq?: FaqItem[] | null
}

export async function getCities(regionId?: number): Promise<City[]> {
  try {
    const url = new URL(`${API_URL}/cities`)
    if (regionId != null && regionId > 0) {
      url.searchParams.set('regionId', String(regionId))
    }
    const response = await fetch(url.toString(), {
      headers: {
        'X-API-Key': API_KEY,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('Failed to fetch cities:', response.status)
      return []
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error fetching cities:', error)
    return []
  }
}

export async function updateCitySeo(
  id: number,
  dto: { seoText?: string | null; seoFaq?: FaqItem[] | null },
): Promise<{ success: true; data: City } | { success: false; error: string }> {
  try {
    const token = await getAuthToken()
    const response = await fetch(`${API_URL}/cities/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify(dto),
    })

    if (!response.ok) {
      const text = await response.text()
      return { success: false, error: text }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
