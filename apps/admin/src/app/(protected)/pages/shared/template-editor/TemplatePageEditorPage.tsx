import Link from 'next/link'
import { getTemplate } from '@/actions/template'
import { normalizeSeo } from '@/app/utils/seo'
import type { PageSeoData } from '@/types'
import type { TemplatePageEditorConfig } from '../pageRegistry'
import TemplatePageEditorForm, { TemplatePageData } from './TemplatePageEditorForm'

interface TemplatePageEditorPageProps {
  config: TemplatePageEditorConfig
}

export default async function TemplatePageEditorPage({
  config,
}: TemplatePageEditorPageProps) {
  const result = await getTemplate(config.key)

  let data: TemplatePageData = {
    title: config.defaultTitle,
    content: '',
  }

  let seo: PageSeoData = normalizeSeo(undefined, config.defaultTitle, '', config.canonicalPath)
  let error: string | null = null

  if (!result.success) {
    if (!result.error.includes('404')) {
      error = result.error
    }
  } else {
    const json = result.data as Record<string, unknown>
    const rawSeo = typeof json.seo === 'object' && json.seo !== null
      ? (json.seo as Record<string, unknown>)
      : undefined

    data = {
      title: typeof json.title === 'string' && json.title.trim() ? json.title : config.defaultTitle,
      content: typeof json.content === 'string' ? json.content : '',
    }

    seo = normalizeSeo(rawSeo, data.title, '', config.canonicalPath)
  }

  if (error) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">{config.editorTitle}</h1>
            <p className="text-sm text-gray-400 mt-1">{config.editorSubtitle}</p>
          </div>
          <Link href={config.backHref} className="h-9 px-4 flex items-center rounded-lg border border-white/10 text-gray-200 text-sm hover:bg-white/5 transition-colors">
            Назад
          </Link>
        </div>

        <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-300">{error}</div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <TemplatePageEditorForm config={config} initialData={data} initialSeo={seo} />
    </div>
  )
}
