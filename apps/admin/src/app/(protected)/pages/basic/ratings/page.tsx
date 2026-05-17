import { getTemplate } from '@/actions/template'
import { normalizeSeo } from '@/app/utils/seo'
import type { PageSeoData } from '@/types'
import RatingsSeoForm from './RatingsSeoForm'

export default async function RatingsPageEditor() {
  const result = await getTemplate('ratings')

  let seo: PageSeoData = normalizeSeo(undefined, 'Рейтингова таблиця', '', '/ratings')
  let title = 'Рейтингові таблиці зі страйкболу'

  if (result.success) {
    const json = result.data as Record<string, unknown>
    if (typeof json.title === 'string' && json.title.trim()) title = json.title
    const rawSeo =
      typeof json.seo === 'object' && json.seo !== null
        ? (json.seo as Record<string, unknown>)
        : undefined
    seo = normalizeSeo(rawSeo, 'Рейтингова таблиця', '', '/ratings')
  }

  return (
    <div className="max-w-5xl mx-auto">
      <RatingsSeoForm initialTitle={title} initialSeo={seo} />
    </div>
  )
}
