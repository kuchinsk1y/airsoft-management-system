import MainPageForm from './MainPageForm'
import { getTemplate } from '@/actions/template'
import type { MainPageData } from '@/types'
import { normalizeMainSeo } from '@/app/utils/main'

export default async function MainPageEditor() {
  const result = await getTemplate('main')

  if (!result.success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 gap-4">
        <p className="text-red-400">Помилка: {result.error}</p>
      </div>
    )
  }

  const json = result.data as Record<string, unknown>
  const title = typeof json.title === 'string' ? json.title : ''
  const description = typeof json.description === 'string' ? json.description : ''
  const rawSeo = typeof json.seo === 'object' && json.seo !== null
    ? (json.seo as Record<string, unknown>)
    : undefined

  const data: MainPageData = {
    title,
    description,
    content: Array.isArray(json.content) ? json.content : [],
    seo: normalizeMainSeo(rawSeo, title, description),
  }

  return <MainPageForm initialData={data} />
}
