'use server'

import { NEXT_PUBLIC_API_URL, STATIC_API_KEY } from '@/utils/config'

export async function getTemplate(
	key: string
): Promise<
	{ success: true; data: unknown } | { success: false; error: string }
> {
	try {
		const url = `${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/template/${encodeURIComponent(key)}`

		const res = await fetch(url, {
			headers: { 'x-api-key': STATIC_API_KEY || '' },
			cache: 'no-store',
		})

		if (!res.ok) {
			const text = await res.text().catch(() => res.statusText)
			return { success: false, error: `API ${res.status}: ${text}` }
		}

		const data = await res.json()
		return { success: true, data }
	} catch (error) {
		if (error instanceof Error) {
			return { success: false, error: error.message }
		}
		return { success: false, error: 'Failed to fetch template' }
	}
}
