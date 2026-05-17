'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { MdImage } from 'react-icons/md'
import { patchTemplate, updateTemplate, uploadTemplateImage } from '@/actions/template'
import PageSeoSection from '@/app/components/seo/PageSeoSection'
import Toast, { ToastMessage } from '@/app/components/Toast'
import { hasSeoChanges, normalizeSeo } from '@/app/utils/seo'
import type { PageSeoData } from '@/types'

interface NewsPageFormProps {
  initialTitle: string
  initialHeroImage: string
  initialSeo: PageSeoData
}

export default function NewsPageForm({
  initialTitle,
  initialHeroImage,
  initialSeo,
}: NewsPageFormProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content')
  const [title, setTitle] = useState(initialTitle)
  const [heroImage, setHeroImage] = useState(initialHeroImage)
  const [imagePreview, setImagePreview] = useState<string | null>(initialHeroImage || null)
  const [pendingImage, setPendingImage] = useState<File | undefined>()
  const [seo, setSeo] = useState<PageSeoData>(
    normalizeSeo(initialSeo, initialTitle, '', '/news'),
  )
  const [savedTitle, setSavedTitle] = useState(initialTitle)
  const [savedHeroImage, setSavedHeroImage] = useState(initialHeroImage)
  const [savedSeo, setSavedSeo] = useState<PageSeoData>(
    normalizeSeo(initialSeo, initialTitle, '', '/news'),
  )
  const [isSaving, setIsSaving] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const normalizedTitle = title.trim()

  const hasChanges =
    normalizedTitle !== savedTitle ||
    heroImage !== savedHeroImage ||
    !!pendingImage ||
    hasSeoChanges(seo, savedSeo)

  const canSave = normalizedTitle.length > 0 && hasChanges && !isSaving

  const addToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
  ) => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, message, type }])
  }

  const removeToast = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id))

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingImage(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!normalizedTitle) {
      addToast('Заголовок не може бути порожнім', 'error')
      return
    }

    setIsSaving(true)

    try {
      let currentHeroImage = heroImage

      if (pendingImage) {
        const uploadRes = await uploadTemplateImage('news', pendingImage, 'heroImage')
        if (!uploadRes.success) throw new Error(uploadRes.error)
        const data = uploadRes.data as Record<string, unknown>
        currentHeroImage = typeof data.url === 'string' ? data.url : heroImage
        setHeroImage(currentHeroImage)
        setImagePreview(currentHeroImage)
        setPendingImage(undefined)
      }

      const payload = {
        title: normalizedTitle,
        heroImage: currentHeroImage,
        seo,
      }

      let result = await patchTemplate('news', payload)
      if (!result.success && result.error.includes('404')) {
        result = await updateTemplate('news', payload)
      }
      if (!result.success) throw new Error(result.error)

      setSavedTitle(normalizedTitle)
      setSavedHeroImage(currentHeroImage)
      setSavedSeo({ ...seo })
      setTitle(normalizedTitle)
      addToast('Сторінку успішно збережено', 'success')
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Не вдалося зберегти сторінку',
        'error',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Новини</h1>
          <p className="text-sm text-gray-400 mt-1">
            Редагування заголовка та зображення сторінки новин
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
              Заголовок та головне зображення сторінки.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400 font-medium">Заголовок</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Напр., Новини"
                  className="bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-400 font-medium">Головне зображення</label>
                <label className="cursor-pointer">
                  <div className="flex items-center gap-3 bg-neutral-900/60 border-2 border-dashed border-white/10 rounded-lg px-4 py-3 hover:border-(--color-primary) hover:bg-(--color-primary-hover)/5 transition-all">
                    <MdImage className="text-2xl text-gray-400" />
                    <div>
                      <p className="text-sm text-white font-medium">Оберіть файл</p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, WEBP до 5MB. Рекомендовано: 1920x1080.
                      </p>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center w-full lg:w-80 h-56 rounded-lg border-2 border-white/10 shrink-0 bg-black/20 overflow-hidden">
              <div className="relative w-full h-full">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    sizes="(max-width: 1024px) 100vw, 320px"
                    quality={50}
                    className="object-cover"
                    unoptimized={
                      imagePreview.startsWith('data:') || imagePreview.startsWith('blob:')
                    }
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-gray-600 text-sm">
                    Зображення не вибрано
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'seo' && (
        <PageSeoSection
          seo={seo}
          onChange={setSeo}
          heading="SEO налаштування сторінки Новини"
          idPrefix="news"
          canonicalPlaceholder="/news"
          ogImagePlaceholder="/uploads/og-news.jpg"
          seoTextPlaceholder="Додатковий SEO-текст для сторінки новин"
        />
      )}

      <Toast messages={toasts} onRemove={removeToast} />
    </div>
  )
}
