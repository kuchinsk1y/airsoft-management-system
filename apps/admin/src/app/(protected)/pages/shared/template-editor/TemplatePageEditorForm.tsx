'use client'

import { patchTemplate, updateTemplate } from '@/actions/template'
import { uploadStorageImage } from '@/actions/storage'
import PageContentEditorSection from '@/app/components/content/PageContentEditorSection'
import PageSeoSection from '@/app/components/seo/PageSeoSection'
import Toast, { ToastMessage } from '@/app/components/Toast'
import { hasSeoChanges, normalizeSeo } from '@/app/utils/seo'
import type { PageSeoData } from '@/types'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { TemplatePageEditorConfig } from '../pageRegistry'

export interface TemplatePageData {
  title: string
  content: string
}

interface TemplatePageEditorFormProps {
  config: TemplatePageEditorConfig
  initialData: TemplatePageData
  initialSeo: PageSeoData
}

export default function TemplatePageEditorForm({
  config,
  initialData,
  initialSeo,
}: TemplatePageEditorFormProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content')
  const [title, setTitle] = useState(initialData.title)
  const [content, setContent] = useState(initialData.content)
  const [savedData, setSavedData] = useState<TemplatePageData>(initialData)
  const [seo, setSeo] = useState<PageSeoData>(
    normalizeSeo(initialSeo, initialData.title, '', config.canonicalPath),
  )
  const [savedSeo, setSavedSeo] = useState<PageSeoData>(
    normalizeSeo(initialSeo, initialData.title, '', config.canonicalPath),
  )
  const [isSaving, setIsSaving] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const normalizedTitle = title.trim()

  const hasChanges = useMemo(
    () => normalizedTitle !== savedData.title || content !== savedData.content || hasSeoChanges(seo, savedSeo),
    [content, normalizedTitle, savedData.content, savedData.title, savedSeo, seo],
  )

  const canSave = normalizedTitle.length > 0 && hasChanges && !isSaving

  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, message, type }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const handleSave = async () => {
    if (!normalizedTitle) {
      addToast('Заголовок не може бути порожнім', 'error')
      return
    }

    setIsSaving(true)

    const payload = {
      title: normalizedTitle,
      content,
      seo,
    }

    try {
      let result = await patchTemplate(config.key, payload)

      if (!result.success && result.error.includes('404')) {
        result = await updateTemplate(config.key, payload)
      }

      if (!result.success) {
        throw new Error(result.error)
      }

      setSavedData({ title: payload.title, content: payload.content })
      setSavedSeo({ ...payload.seo })
      setTitle(payload.title)
      addToast('Сторінку успішно збережено', 'success')
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Не вдалося зберегти сторінку', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{config.editorTitle}</h1>
          <p className="text-sm text-gray-400 mt-1">{config.editorSubtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={config.backHref} className="h-9 px-4 flex items-center rounded-lg border border-white/10 text-gray-200 text-sm hover:bg-white/5 transition-colors">
            Назад
          </Link>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!canSave}
            className="h-9 px-4 rounded-lg bg-(--color-primary) text-white text-sm font-semibold hover:bg-(--color-primary-hover) transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Збереження...' : 'Зберегти'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-black/20 p-1.5 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`h-9 px-4 rounded-lg text-sm transition-colors ${activeTab === 'content' ? 'bg-(--color-primary) text-white font-semibold' : 'text-gray-300 hover:bg-white/5'}`}
        >
          Контент
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('seo')}
          className={`h-9 px-4 rounded-lg text-sm transition-colors ${activeTab === 'seo' ? 'bg-(--color-primary) text-white font-semibold' : 'text-gray-300 hover:bg-white/5'}`}
        >
          SEO
        </button>
      </div>

      {activeTab === 'content' && (
        <PageContentEditorSection
          title={title}
          content={content}
          onTitleChange={setTitle}
          onContentChange={setContent}
          onImageUpload={uploadStorageImage}
          disabled={isSaving}
          titleLabel="Заголовок страницы (H1)"
          titlePlaceholder={config.titlePlaceholder}
          contentLabel="Контент сторінки"
          contentPlaceholder={config.contentPlaceholder}
        />
      )}

      {activeTab === 'seo' && (
        <PageSeoSection
          seo={seo}
          onChange={setSeo}
          heading={config.seoHeading}
          idPrefix={config.key}
          canonicalPlaceholder={config.canonicalPath}
          ogImagePlaceholder={config.seoOgImagePlaceholder}
          seoTextPlaceholder="Додатковий SEO-текст для сторінки"
        />
      )}

      <Toast messages={toasts} onRemove={removeToast} />
    </div>
  )
}
