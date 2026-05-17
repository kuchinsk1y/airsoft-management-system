'use client'

import Link from 'next/link'
import { useState } from 'react'
import { patchTemplate, updateTemplate } from '@/actions/template'
import PageSeoSection from '@/app/components/seo/PageSeoSection'
import Toast, { ToastMessage } from '@/app/components/Toast'
import { hasSeoChanges, normalizeSeo } from '@/app/utils/seo'
import type { PageSeoData } from '@/types'

interface GalleryPageFormProps {
  initialTitle: string
  initialDescription: string
  initialSeo: PageSeoData
}

export default function GalleryPageForm({
  initialTitle,
  initialDescription,
  initialSeo,
}: GalleryPageFormProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content')
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [savedTitle, setSavedTitle] = useState(initialTitle)
  const [savedDescription, setSavedDescription] = useState(initialDescription)
  const [seo, setSeo] = useState<PageSeoData>(
    normalizeSeo(initialSeo, initialTitle, '', '/gallery'),
  )
  const [savedSeo, setSavedSeo] = useState<PageSeoData>(
    normalizeSeo(initialSeo, initialTitle, '', '/gallery'),
  )
  const [isSaving, setIsSaving] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const normalizedTitle = title.trim()
  const normalizedDescription = description.trim()

  const hasChanges =
    normalizedTitle !== savedTitle ||
    normalizedDescription !== savedDescription ||
    hasSeoChanges(seo, savedSeo)

  const canSave = normalizedTitle.length > 0 && hasChanges && !isSaving

  const addToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
  ) => {
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
      content: normalizedDescription,
      seo,
    }

    try {
      let result = await patchTemplate('gallery', payload)

      if (!result.success && result.error.includes('404')) {
        result = await updateTemplate('gallery', payload)
      }

      if (!result.success) {
        throw new Error(result.error)
      }

      setSavedTitle(normalizedTitle)
      setSavedDescription(normalizedDescription)
      setSavedSeo({ ...seo })
      setTitle(normalizedTitle)
      setDescription(normalizedDescription)
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
          <h1 className="text-3xl font-bold tracking-tight text-white">Галерея</h1>
          <p className="text-sm text-gray-400 mt-1">
            Редагування заголовка, опису та SEO сторінки галереї
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/pages/info"
            className="h-9 px-4 flex items-center rounded-lg border border-white/10 text-gray-200 text-sm hover:bg-white/5 transition-colors"
          >
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
          className={`h-9 px-4 rounded-lg text-sm transition-colors ${
            activeTab === 'content'
              ? 'bg-(--color-primary) text-white font-semibold'
              : 'text-gray-300 hover:bg-white/5'
          }`}
        >
          Контент
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('seo')}
          className={`h-9 px-4 rounded-lg text-sm transition-colors ${
            activeTab === 'seo'
              ? 'bg-(--color-primary) text-white font-semibold'
              : 'text-gray-300 hover:bg-white/5'
          }`}
        >
          SEO
        </button>
      </div>

      {activeTab === 'content' && (
        <section className="space-y-5 p-6 rounded-xl border-2 border-white/10 bg-black/30">
          <div>
            <h2 className="text-lg font-semibold text-white">Основні дані</h2>
            <p className="text-xs text-gray-400 mt-1">
              Два поля для hero-блоку: заголовок та опис.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 font-medium">Заголовок</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Напр., ГАЛЕРЕЯ"
                className="bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 font-medium">Опис</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Короткий опис під заголовком сторінки"
                rows={4}
                className="resize-y min-h-24 bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
              />
            </div>
          </div>
        </section>
      )}

      {activeTab === 'seo' && (
        <PageSeoSection
          seo={seo}
          onChange={setSeo}
          heading="SEO налаштування сторінки Галерея"
          idPrefix="gallery"
          canonicalPlaceholder="/gallery"
          ogImagePlaceholder="/uploads/og-gallery.jpg"
          seoTextPlaceholder="Додатковий SEO-текст для сторінки галереї"
        />
      )}

      <Toast messages={toasts} onRemove={removeToast} />
    </div>
  )
}
