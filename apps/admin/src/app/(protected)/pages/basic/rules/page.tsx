import RulesForm from './RulesForm'
import Link from 'next/link'
import { getTemplate } from '@/actions/template'
import type { Rule, PageSeoData } from '@/types'
import { normalizeSeo } from '@/app/utils/seo'

export default async function RulesPage() {
  const result = await getTemplate('rules')

  let data: Rule[] = []
  let pageTitle: string = ''
  let pageDescription: string = ''
  let pageSeo: PageSeoData = normalizeSeo(undefined, '', '', '/rules')
  let error: string | null = null

  if (!result.success) {
    if (!result.error.includes('404')) error = result.error
  } else {
    const json = result.data as Record<string, unknown>
    data = Array.isArray(json?.content) ? json.content : []
    pageTitle = typeof json?.title === 'string' ? json.title : ''
    pageDescription = typeof json?.description === 'string' ? json.description : ''
    const rawSeo = typeof json?.seo === 'object' && json.seo !== null
      ? (json.seo as Record<string, unknown>)
      : undefined
    pageSeo = normalizeSeo(rawSeo, pageTitle, pageDescription, '/rules')
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Правила</h1>
          <p className="text-sm text-gray-400 mt-1">Редагування правил гри у страйкбол</p>
        </div>
        <Link href="/pages/basic" className="h-9 px-4 flex items-center rounded-lg border border-white/10 text-gray-200 text-sm hover:bg-white/5 transition-colors">Назад</Link>
      </div>

      {error ? (
        <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-300">{error}</div>
      ) : (
        <RulesForm initialRules={data} initialTitle={pageTitle} initialDescription={pageDescription} initialSeo={pageSeo} />
      )}
    </div>
  )
}
