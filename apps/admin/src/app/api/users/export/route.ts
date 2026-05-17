import { getAuthToken } from '@/app/auth/server-utils'
import { NEXT_PUBLIC_API_KEY, NEXT_PUBLIC_API_URL } from '@/app/utils/config'

interface UserExportRow {
  nickName: string
  fullName: string | null
  email: string
  phoneNumber: string | null
  country: string | null
  region: string | null
  city: string | null
}

const API_URL = NEXT_PUBLIC_API_URL.replace(/\/$/, '')

const csvEscape = (value: string) => `"${value.replace(/"/g, '""')}"`

const buildLocation = (city: string | null, region: string | null, country: string | null) => {
  const parts = [city, region, country].filter(Boolean)
  if (parts.length === 0) return '—'
  return parts.join(', ')
}

const buildUserName = (user: UserExportRow) => {
  const fullName = user.fullName?.trim()
  if (fullName) return fullName
  return user.nickName
}

const toCsv = (users: UserExportRow[]) => {
  const headers = ['Користувач', 'Email', 'Телефон', 'Локація']
  const rows = users.map((user) => [
    buildUserName(user),
    user.email,
    user.phoneNumber || '—',
    buildLocation(user.city, user.region, user.country),
  ])

  return [headers, ...rows]
    .map((row) => row.map((cell) => csvEscape(String(cell))).join(';'))
    .join('\n')
}

export async function GET() {
  const token = await getAuthToken()

  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const response = await fetch(`${API_URL}/users/all`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-api-key': NEXT_PUBLIC_API_KEY,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return new Response('Failed to export users', { status: response.status })
    }

    const users = (await response.json()) as UserExportRow[]
    const csvContent = toCsv(users)
    const now = new Date().toISOString().slice(0, 10)

    return new Response(`\uFEFF${csvContent}`, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="users-contacts-${now}.csv"`,
      },
    })
  } catch (error) {
    console.error('Users export error:', error)
    return new Response('Export failed', { status: 500 })
  }
}