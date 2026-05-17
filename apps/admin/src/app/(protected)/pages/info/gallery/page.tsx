import Link from 'next/link'
import { getTemplate } from '@/actions/template'
import { normalizeSeo } from '@/app/utils/seo'
import type { PageSeoData } from '@/types'
import GalleryPageForm from './GalleryPageForm'

export default async function GalleryPageEditor() {
  const result = await getTemplate('gallery')

  let title = 'ГАЛЕРЕЯ'
  let description = ''
  let seo: PageSeoData = normalizeSeo(undefined, 'ГАЛЕРЕЯ', '', '/gallery')
  let error: string | null = null

  if (!result.success) {
    if (!result.error.includes('404')) error = result.error
  } else {
    const json = result.data as Record<string, unknown>
    title = typeof json.title === 'string' && json.title.trim() ? json.title : 'ГАЛЕРЕЯ'
    description = typeof json.content === 'string' ? json.content : ''
    const rawSeo =
      typeof json.seo === 'object' && json.seo !== null
        ? (json.seo as Record<string, unknown>)
        : undefined
    seo = normalizeSeo(rawSeo, title, '', '/gallery')
  }

  if (error) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Галерея</h1>
            <p className="text-sm text-gray-400 mt-1">
              Редагування заголовка, опису та SEO сторінки галереї
            </p>
          </div>
          <Link
            href="/pages/info"
            className="h-9 px-4 flex items-center rounded-lg border border-white/10 text-gray-200 text-sm hover:bg-white/5 transition-colors"
          >
            Назад
          </Link>
        </div>
        <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-300">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <GalleryPageForm initialTitle={title} initialDescription={description} initialSeo={seo} />
    </div>
  )
}
