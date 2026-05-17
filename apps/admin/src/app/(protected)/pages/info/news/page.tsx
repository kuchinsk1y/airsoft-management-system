import Link from 'next/link'
import { getTemplate } from '@/actions/template'
import { normalizeSeo } from '@/app/utils/seo'
import type { PageSeoData } from '@/types'
import NewsPageForm from './NewsPageForm'

export default async function NewsPageEditor() {
  const result = await getTemplate('news')

  let title = 'Новини'
  let heroImage = ''
  let seo: PageSeoData = normalizeSeo(undefined, 'Новини', '', '/news')
  let error: string | null = null

  if (!result.success) {
    if (!result.error.includes('404')) error = result.error
  } else {
    const json = result.data as Record<string, unknown>
    title = typeof json.title === 'string' && json.title.trim() ? json.title : 'Новини'
    heroImage = typeof json.heroImage === 'string' ? json.heroImage : ''
    const rawSeo =
      typeof json.seo === 'object' && json.seo !== null
        ? (json.seo as Record<string, unknown>)
        : undefined
    seo = normalizeSeo(rawSeo, title, '', '/news')
  }

  if (error) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Новини</h1>
            <p className="text-sm text-gray-400 mt-1">
              Редагування заголовка та зображення сторінки новин
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
      <NewsPageForm initialTitle={title} initialHeroImage={heroImage} initialSeo={seo} />
    </div>
  )
}
