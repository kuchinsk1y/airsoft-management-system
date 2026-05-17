import { NEXT_PUBLIC_API_URL, NEXT_PUBLIC_API_KEY } from '@/app/utils/config'

// для загрузки изображений
export async function uploadImage(
  file: File,
  field: string,
  apiUrl: string = NEXT_PUBLIC_API_URL,
  apiKey: string = NEXT_PUBLIC_API_KEY
): Promise<string> {
  if (!apiUrl || !apiKey) throw new Error('Missing API URL or API Key')

  const form = new FormData()
  form.append('file', file)

  const normalizedUrl = apiUrl.replace(/\/$/, '')
  const res = await fetch(
    `${normalizedUrl}/template/main/upload-image?field=${encodeURIComponent(field)}`,
    {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: form,
    }
  )

  if (!res.ok) {
    const error = await res.text().catch(() => 'Upload failed')
    throw new Error(error)
  }

  const json = await res.json()
  return json.url as string
}

// для URL превью
export function getImagePreviewUrl(
  imagePath: string,
  apiUrl: string = NEXT_PUBLIC_API_URL
): string {
  if (!apiUrl) throw new Error('Missing API URL')
  if (!imagePath) return ''
  const normalizedUrl = apiUrl.replace(/\/$/, '')
  return imagePath.startsWith('/uploads') ? `${normalizedUrl}${imagePath}` : imagePath
}
