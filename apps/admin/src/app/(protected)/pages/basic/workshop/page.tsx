
import Link from 'next/link'
import { getTemplate } from '@/actions/template'
import { normalizeSeo } from '@/app/utils/seo'
import type { WorkshopPageData, WorkshopContentBlock } from '@/types'
import WorkshopForm from './WorkshopForm'

function normalizeContent(content: WorkshopContentBlock[]): WorkshopContentBlock[] {
  const contacts = content.find((b) => b.type === 'contacts')
  if (contacts && contacts.type === 'contacts') {
    return [contacts]
  }

  return [{ type: 'contacts', title: '', address: [], phone: [], workingHours: [] }]
}

export default async function WorkshopPageEditor() {
  const result = await getTemplate('workshop')

  let data: WorkshopPageData = {
    title: '',
    description: '',
    heroImage: '',
    seo: normalizeSeo(undefined, '', '', '/workshop'),
    content: [
      { type: 'contacts', title: '', address: [], phone: [], workingHours: [] },
    ],
  }
  let error: string | null = null

  if (!result.success) {
    if (!result.error.includes('404')) error = result.error
  } else {
    const json = result.data as Record<string, unknown>
    const title = typeof json.title === 'string' ? json.title : ''
    const description = typeof json.description === 'string' ? json.description : ''
    const rawSeo = typeof json.seo === 'object' && json.seo !== null
      ? (json.seo as Record<string, unknown>)
      : undefined

    data = {
      title,
      description,
      heroImage: typeof json.heroImage === 'string' ? json.heroImage : '',
      seo: normalizeSeo(rawSeo, title, description, '/workshop'),
      content: normalizeContent(Array.isArray(json.content) ? (json.content as WorkshopContentBlock[]) : []),
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Майстерня</h1>
          <p className="text-sm text-gray-400 mt-1">Редагування сторінки майстерні Strikeshop</p>
        </div>
        <Link href="/pages/basic" className="h-9 px-4 flex items-center rounded-lg border border-white/10 text-gray-200 text-sm hover:bg-white/5 transition-colors">
          Назад
        </Link>
      </div>
      {error ? (
        <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-300">{error}</div>
      ) : (
        <WorkshopForm initialData={data} />
      )}
    </div>
  )
}
