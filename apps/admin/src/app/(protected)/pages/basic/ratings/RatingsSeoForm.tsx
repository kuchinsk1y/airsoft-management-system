'use client'

import Link from 'next/link'
import { useState } from 'react'
import { patchTemplate, updateTemplate } from '@/actions/template'
import PageSeoSection from '@/app/components/seo/PageSeoSection'
import Toast, { ToastMessage } from '@/app/components/Toast'
import { hasSeoChanges, normalizeSeo } from '@/app/utils/seo'
import type { PageSeoData } from '@/types'

interface RatingsSeoFormProps {
  initialTitle: string
  initialSeo: PageSeoData
}

export default function RatingsSeoForm({ initialTitle, initialSeo }: RatingsSeoFormProps) {
  const [title, setTitle] = useState(initialTitle)
  const [savedTitle, setSavedTitle] = useState(initialTitle)
  const [seo, setSeo] = useState<PageSeoData>(
    normalizeSeo(initialSeo, initialTitle, '', '/ratings'),
  )
  const [savedSeo, setSavedSeo] = useState<PageSeoData>(
    normalizeSeo(initialSeo, initialTitle, '', '/ratings'),
  )
  const [isSaving, setIsSaving] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const normalizedTitle = title.trim()
  const hasChanges = normalizedTitle !== savedTitle || hasSeoChanges(seo, savedSeo)
  const canSave = hasChanges && !isSaving

  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, message, type }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      let result = await patchTemplate('ratings', { title: normalizedTitle, seo })
      if (!result.success && result.error.includes('404')) {
        result = await updateTemplate('ratings', { title: normalizedTitle, seo })
      }
      if (!result.success) throw new Error(result.error)
      setSavedTitle(normalizedTitle)
      setSavedSeo({ ...seo })
      addToast('SEO збережено', 'success')
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Не вдалося зберегти', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Рейтинги</h1>
          <p className="text-sm text-gray-400 mt-1">SEO налаштування сторінки рейтингів</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/pages/basic"
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

      <section className="space-y-5 p-6 rounded-xl border-2 border-white/10 bg-black/30">
        <div>
          <h2 className="text-lg font-semibold text-white">H1 заголовок</h2>
          <p className="text-xs text-gray-400 mt-1">Заголовок, який відображається на сторінці /ratings.</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ratings-h1" className="text-xs text-gray-400 font-medium">H1</label>
          <input
            id="ratings-h1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Рейтингові таблиці зі страйкболу"
            className="bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
          />
        </div>
      </section>

      <PageSeoSection
        seo={seo}
        onChange={setSeo}
        heading="SEO налаштування сторінки Рейтинги"
        idPrefix="ratings"
        canonicalPlaceholder="/ratings"
        ogImagePlaceholder="/uploads/og-ratings.jpg"
        seoTextPlaceholder="Додатковий SEO-текст для сторінки рейтингів"
      />

      <Toast messages={toasts} onRemove={removeToast} />
    </div>
  )
}
