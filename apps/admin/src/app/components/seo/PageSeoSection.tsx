import { useState } from 'react'
import { uploadStorageImage } from '@/actions/storage'
import type { PageSeoData } from '@/types'

interface PageSeoSectionProps {
  seo: PageSeoData
  onChange: (value: PageSeoData) => void
  heading?: string
  description?: string
  idPrefix?: string
  canonicalPlaceholder?: string
  ogImagePlaceholder?: string
  seoTextPlaceholder?: string
  showFaqSection?: boolean
  onOgImageUpload?: (file: File) => Promise<string>
}

export default function PageSeoSection({
  seo,
  onChange,
  heading = 'SEO налаштування',
  description = 'Title, description, canonical, robots, OG image і SEO-текст.',
  idPrefix = 'seo',
  canonicalPlaceholder = '/',
  ogImagePlaceholder = '/uploads/og-image.jpg',
  seoTextPlaceholder = 'Додатковий SEO-текст',
  showFaqSection = true,
  onOgImageUpload,
}: PageSeoSectionProps) {
  const [isOgUploading, setIsOgUploading] = useState(false)
  const [ogUploadError, setOgUploadError] = useState('')
  const ogImageUploader = onOgImageUpload ?? uploadStorageImage

  const setSeoField = <K extends keyof PageSeoData>(key: K, value: PageSeoData[K]) => {
    onChange({ ...seo, [key]: value })
  }

  const handleOgImageUpload = async (file?: File) => {
    if (!file) return

    setOgUploadError('')
    setIsOgUploading(true)

    try {
      const uploadedUrl = await ogImageUploader(file)
      setSeoField('ogImage', uploadedUrl)
    } catch (error) {
      setOgUploadError(error instanceof Error ? error.message : 'Не вдалося завантажити зображення')
    } finally {
      setIsOgUploading(false)
    }
  }

  const id = (suffix: string) => `${idPrefix}-${suffix}`

  const handleAddFaq = () => {
    setSeoField('seoFaq', [...seo.seoFaq, { question: '', answer: '' }])
  }

  const handleRemoveFaq = (index: number) => {
    setSeoField(
      'seoFaq',
      seo.seoFaq.filter((_, i) => i !== index),
    )
  }

  const handleUpdateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    setSeoField(
      'seoFaq',
      seo.seoFaq.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    )
  }

  return (
    <section className="space-y-5 p-6 rounded-xl border-2 border-white/10 bg-black/30">
      <div>
        <h2 className="text-lg font-semibold text-white">{heading}</h2>
        <p className="text-xs text-gray-400 mt-1">{description}</p>
      </div>

      <div className="grid grid-cols-1 gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={id('browserTitle')} className="text-xs text-gray-400 font-medium">Browser Title</label>
          <input
            id={id('browserTitle')}
            value={seo.browserTitle}
            onChange={(e) => setSeoField('browserTitle', e.target.value)}
            placeholder="Заголовок вкладки браузера"
            className="bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={id('ruBrowserTitle')} className="text-xs text-gray-400 font-medium">Browser Title (RU)</label>
          <input
            id={id('ruBrowserTitle')}
            value={seo.ruBrowserTitle}
            onChange={(e) => setSeoField('ruBrowserTitle', e.target.value)}
            placeholder="Заголовок вкладки для російської версії"
            className="bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={id('metaDescription')} className="text-xs text-gray-400 font-medium">Meta Description</label>
          <textarea
            id={id('metaDescription')}
            value={seo.metaDescription}
            onChange={(e) => setSeoField('metaDescription', e.target.value)}
            placeholder="Опис для пошукової видачі"
            className="bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white h-24 resize-none focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={id('ruMetaDescription')} className="text-xs text-gray-400 font-medium">Meta Description (RU)</label>
          <textarea
            id={id('ruMetaDescription')}
            value={seo.ruMetaDescription}
            onChange={(e) => setSeoField('ruMetaDescription', e.target.value)}
            placeholder="Опис для російської версії"
            className="bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white h-24 resize-none focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={id('canonical')} className="text-xs text-gray-400 font-medium">Canonical URL</label>
          <input
            id={id('canonical')}
            value={seo.canonicalUrl}
            onChange={(e) => setSeoField('canonicalUrl', e.target.value)}
            placeholder={canonicalPlaceholder}
            className="bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={id('ogImage')} className="text-xs text-gray-400 font-medium">OG Image URL</label>
          <div className="space-y-2">
            <input
              id={id('ogImage')}
              value={seo.ogImage}
              onChange={(e) => setSeoField('ogImage', e.target.value)}
              placeholder={ogImagePlaceholder}
              className="bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent w-full"
            />
            <div className="flex items-center gap-3 flex-wrap">
              <label className="inline-flex cursor-pointer items-center justify-center h-9 px-4 rounded-lg border border-white/10 text-sm text-gray-200 hover:bg-white/5 transition-colors">
                <span>{isOgUploading ? 'Завантаження...' : 'Завантажити зображення'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isOgUploading}
                  onChange={(e) => {
                    void handleOgImageUpload(e.target.files?.[0])
                    e.currentTarget.value = ''
                  }}
                />
              </label>
              <span className="text-xs text-gray-500">
                Рекомендовано для соцмереж: 1200x630 (OG 1.91:1).
              </span>
              {seo.ogImage && (
                <a
                  href={seo.ogImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-(--color-primary) hover:underline"
                >
                  Відкрити поточне зображення
                </a>
              )}
            </div>
            {ogUploadError && <p className="text-xs text-red-400">{ogUploadError}</p>}
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={seo.index}
              onChange={(e) => setSeoField('index', e.target.checked)}
              className="w-4 h-4"
            />
            <span>Index</span>
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={seo.follow}
              onChange={(e) => setSeoField('follow', e.target.checked)}
              className="w-4 h-4"
            />
            <span>Follow</span>
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={seo.includeSitemap}
              onChange={(e) => setSeoField('includeSitemap', e.target.checked)}
              className="w-4 h-4"
            />
            <span>Включити в sitemap</span>
          </label>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={id('seoText')} className="text-xs text-gray-400 font-medium">SEO-текст</label>
          <textarea
            id={id('seoText')}
            value={seo.seoText}
            onChange={(e) => setSeoField('seoText', e.target.value)}
            placeholder={seoTextPlaceholder}
            className="bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white h-48 resize-none focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
          />
        </div>

        {showFaqSection && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <label className="text-xs text-gray-400 font-medium">FAQ (schema.org)</label>
              <button
                type="button"
                onClick={handleAddFaq}
                className="h-8 px-3 rounded-lg border border-white/10 text-xs font-medium text-gray-100 hover:bg-white/5 transition-colors"
              >
                + Додати питання
              </button>
            </div>

            <div className="space-y-3">
              {seo.seoFaq.map((item, index) => (
                <div key={index} className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">Питання #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFaq(index)}
                      className="h-7 px-2 rounded-md text-xs text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-colors"
                    >
                      Видалити
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-gray-400 font-medium">Питання</label>
                    <input
                      value={item.question}
                      onChange={(e) => handleUpdateFaq(index, 'question', e.target.value)}
                      placeholder="Введіть питання..."
                      className="bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-gray-400 font-medium">Відповідь</label>
                    <textarea
                      value={item.answer}
                      onChange={(e) => handleUpdateFaq(index, 'answer', e.target.value)}
                      rows={3}
                      placeholder="Введіть відповідь..."
                      className="bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-y focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
                    />
                  </div>
                </div>
              ))}

              {seo.seoFaq.length === 0 && (
                <p className="text-xs text-gray-500 italic">FAQ-питань поки немає.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}