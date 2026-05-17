'use client'

import {
  createNews,
  deleteNews,
  fetchNewsById,
  uploadNewsInlineImage,
  updateNews,
  uploadNewsCoverImage,
} from '@/actions/news'
import TinyMceEditor from '@/app/components/TinyMceEditor'
import ConfirmDialog from '@/app/components/ConfirmDialog'
import LoadingSpinner from '@/app/components/LoadingSpinner'
import Toast, { ToastMessage } from '@/app/components/Toast'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { MdArrowBack, MdSave } from 'react-icons/md'
import { NEWS_CATEGORY_OPTIONS, NewsFormData } from './types'

interface Props {
  mode: 'create' | 'edit'
  newsId?: number
}

const EMPTY_FORM: NewsFormData = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImage: '',
  category: '',
  published: false,
  publishedAt: '',
}

const translitMap: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ye', ж: 'zh', з: 'z',
  и: 'y', і: 'i', ї: 'yi', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p',
  р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch',
  ь: '', ю: 'yu', я: 'ya',
  э: 'e', ё: 'yo', ъ: '', ы: 'y',
}

const slugify = (value: string) => {
  const lower = value.trim().toLowerCase()
  const transliterated = Array.from(lower)
    .map((char) => translitMap[char] ?? char)
    .join('')

  return transliterated
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const getContentText = (value: string) =>
  value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()

export default function NewsEditorPageClient({ mode, newsId }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<NewsFormData>(EMPTY_FORM)
  const [isLoading, setIsLoading] = useState(mode === 'edit')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverFilePreview, setCoverFilePreview] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  const addToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
      const id = `${Date.now()}-${Math.random()}`
      setToasts((prev) => [...prev, { id, message, type }])
    },
    [],
  )

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useEffect(() => {
    if (mode !== 'edit' || !newsId || Number.isNaN(newsId)) {
      setIsLoading(false)
      return
    }

    let cancelled = false

    const loadNews = async () => {
      try {
        setIsLoading(true)
        setLoadError(null)
        const item = await fetchNewsById(newsId)

        if (cancelled) return

        if (!item) {
          addToast('Новину не знайдено. Можливо, її вже видалено.', 'warning')
          router.replace('/news')
          return
        }

        setForm({
          title: item.title,
          slug: item.slug,
          excerpt: item.excerpt,
          content: item.content,
          coverImage: item.coverImage || '',
          category: item.category,
          published: item.published,
          publishedAt: item.publishedAt ? item.publishedAt.toISOString() : '',
        })
        setCoverFile(null)
      } catch (error) {
        if (cancelled) return
        setLoadError(error instanceof Error ? error.message : 'Помилка завантаження новини')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadNews()

    return () => {
      cancelled = true
    }
  }, [addToast, mode, newsId, router])

  useEffect(() => {
    if (!coverFile) {
      setCoverFilePreview(null)
      return
    }

    const objectUrl = URL.createObjectURL(coverFile)
    setCoverFilePreview(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [coverFile])

  useEffect(() => {
    setForm((prev) => {
      const nextSlug = slugify(prev.title)
      if (nextSlug === prev.slug) return prev
      return { ...prev, slug: nextSlug }
    })
  }, [form.title])

  const formError = useMemo(() => {
    const contentText = getContentText(form.content)

    if (form.title.trim().length < 3) return 'Заголовок має містити щонайменше 3 символи'
    if (!form.category) return 'Оберіть категорію новини'
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) return 'Slug має бути у форматі latin-kebab-case'
    if (form.excerpt.trim().length < 10) return 'Анонс має містити щонайменше 10 символів'
    if (contentText.length < 20) return 'Контент має містити щонайменше 20 символів'

    return null
  }, [form])

  const coverPreview = coverFilePreview || form.coverImage.trim()
  const canSubmit = !formError && !isSaving && !isDeleting && !isLoading
  const secondaryActionLabel = form.published ? 'Зняти з публікації' : 'Зберегти як чернетку'
  const primaryActionLabel = form.published ? 'Оновити публікацію' : 'Опублікувати'

  const handleDelete = useCallback(() => {
    if (mode !== 'edit' || !newsId || Number.isNaN(newsId)) return
    setIsDeleteConfirmOpen(true)
  }, [mode, newsId])

  const handleConfirmDelete = useCallback(async () => {
    if (mode !== 'edit' || !newsId || Number.isNaN(newsId)) return

    try {
      setIsDeleting(true)
      await deleteNews(Number(newsId))
      setIsDeleteConfirmOpen(false)
      addToast('Новину видалено', 'success')
      router.push('/news')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Помилка видалення новини'
      addToast(message, 'error')
    } finally {
      setIsDeleting(false)
    }
  }, [addToast, mode, newsId, router])

  const handleSave = async (targetPublished: boolean) => {
    if (!canSubmit) {
      if (formError) addToast(formError, 'warning')
      return
    }

    try {
      setIsSaving(true)
      const wasPublished = form.published

      const payload: NewsFormData = {
        ...form,
        title: form.title.trim(),
        slug: form.slug.trim(),
        excerpt: form.excerpt.trim(),
        content: form.content,
        coverImage: form.coverImage.trim(),
        category: form.category,
        published: targetPublished,
        publishedAt: targetPublished ? form.publishedAt || new Date().toISOString() : '',
      }

      if (coverFile) {
        const uploadedCoverUrl = await uploadNewsCoverImage(coverFile)
        payload.coverImage = uploadedCoverUrl
      }

      const saved =
        mode === 'create'
          ? await createNews(payload)
          : await updateNews(Number(newsId), payload)

      setForm((prev) => ({
        ...prev,
        coverImage: saved.coverImage || '',
        published: saved.published,
        publishedAt: saved.publishedAt ? saved.publishedAt.toISOString() : '',
      }))
      setCoverFile(null)

      const successMessage = targetPublished
        ? wasPublished
          ? 'Публікацію оновлено'
          : 'Новину опубліковано'
        : wasPublished
          ? 'Новину знято з публікації'
          : 'Чернетку збережено'

      addToast(successMessage, 'success')

      if (mode === 'create') {
        router.replace(`/news/${saved.id}`)
      } else {
        router.refresh()
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Помилка збереження новини'
      addToast(message, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-72">
        <LoadingSpinner />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <Link href="/news" className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors">
          <MdArrowBack size={18} />
          До списку новин
        </Link>
        <div className="p-4 rounded-lg border-2 border-red-500/30 bg-red-500/10 text-red-300">{loadError}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {mode === 'create' ? 'Нова новина' : 'Редагування новини'}
          </h1>
          <p className="text-sm text-gray-400 mt-1">Створення та редагування матеріалу для стрічки новин</p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/news" className="h-9 px-4 flex items-center rounded-lg border border-white/10 text-gray-200 text-sm hover:bg-white/5 transition-colors">
            <MdArrowBack size={18} className="mr-1" />
            Назад
          </Link>
          <button
            type="button"
            onClick={() => void handleSave(false)}
            disabled={!canSubmit}
            className="h-9 px-4 rounded-lg border border-white/10 text-gray-200 text-sm hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {secondaryActionLabel}
          </button>
          <button
            type="button"
            onClick={() => void handleSave(true)}
            disabled={!canSubmit}
            className="h-9 px-4 inline-flex items-center rounded-lg bg-(--color-primary) hover:bg-(--color-primary-hover) text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MdSave size={16} className="mr-1" />
            {primaryActionLabel}
          </button>
          {mode === 'edit' && (
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={isSaving || isDeleting}
              className="h-9 px-4 rounded-lg border border-red-500/30 text-red-300 text-sm hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Видалити
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.9fr_1fr] gap-6 items-start">
        <div className="space-y-6">
          <section className="p-5 rounded-xl border-2 border-white/10 bg-black/30">
            <label className="block text-sm text-gray-300 mb-2">Заголовок</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2.5 bg-white/5 text-white rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none"
              placeholder="Введіть заголовок новини"
            />

            <label className="block text-sm text-gray-300 mt-4 mb-2">Slug</label>
            <input
              type="text"
              value={form.slug}
              readOnly
              disabled
              className="w-full px-4 py-2.5 bg-white/5 text-gray-300 rounded-lg border border-white/10 opacity-80 cursor-not-allowed"
              placeholder="novyna-pryklad"
            />
            <p className="text-xs text-gray-500 mt-1">URL: /news/{form.slug || 'slug'}</p>
            <p className="text-xs text-gray-500 mt-1">Slug формується автоматично на основі заголовка.</p>

            <label className="block text-sm text-gray-300 mt-4 mb-2">Категорія</label>
            <select
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value as NewsFormData['category'] }))}
              className="w-full px-4 py-2.5 bg-white/5 text-white rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none"
              title="Категорія новини"
            >
              <option value="">Оберіть категорію</option>
              {NEWS_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <label className="block text-sm text-gray-300 mt-4 mb-2">Анонс</label>
            <textarea
              value={form.excerpt}
              onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
              className="w-full min-h-28 px-4 py-3 bg-white/5 text-white rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none resize-y"
              placeholder="Короткий вступ до новини"
            />
          </section>

          <section className="p-5 rounded-xl border-2 border-white/10 bg-black/30">
            <label className="block text-sm text-gray-300 mb-2">Контент</label>
            <TinyMceEditor
              value={form.content}
              onChange={(value) => setForm((prev) => ({ ...prev, content: value }))}
              onImageUpload={uploadNewsInlineImage}
              disabled={isSaving || isDeleting}
            />
          </section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-4">
          <section className="p-5 rounded-xl border-2 border-white/10 bg-black/30">
            <h2 className="text-white font-semibold mb-3">Обкладинка</h2>
            <label className="block text-sm text-gray-300 mb-2">Завантажити файл обкладинки</label>
            <p className="text-xs text-gray-500 mb-2">
              Рекомендовано: 1600x900 (16:9), мінімум 1200x675.
            </p>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              title="Завантажити обкладинку"
              aria-label="Завантажити обкладинку"
              onChange={(e) => {
                const file = e.target.files?.[0]
                setCoverFile(file || null)
              }}
              className="w-full text-xs sm:text-sm text-gray-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-(--color-primary) file:text-white hover:file:bg-(--color-primary-hover) cursor-pointer"
            />

            <div className="mt-4 rounded-lg border border-white/10 bg-white/5 min-h-40 overflow-hidden flex items-center justify-center">
              {coverPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverPreview}
                  alt="Попередній перегляд обкладинки"
                  className="w-full h-40 object-cover"
                />
              ) : (
                <p className="text-xs text-gray-500 px-3 text-center">Попередній перегляд з'явиться після вибору файлу</p>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCoverFile(null)}
                disabled={!coverFile}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-300 text-xs hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Скасувати вибір файлу
              </button>
              <button
                type="button"
                onClick={() => {
                  setCoverFile(null)
                  setForm((prev) => ({ ...prev, coverImage: '' }))
                }}
                disabled={!coverFile && !form.coverImage}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-300 text-xs hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Очистити обкладинку
              </button>
            </div>
          </section>

          <section className="p-5 rounded-xl border-2 border-white/10 bg-black/30">
            <h2 className="text-white font-semibold mb-3">Публікація</h2>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">Поточний статус:</span>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                    form.published
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                  }`}
                >
                  {form.published ? 'Опубліковано' : 'Чернетка'}
                </span>
              </div>

              {form.publishedAt ? (
                <p className="text-sm text-gray-400">
                  Дата публікації:{' '}
                  {new Date(form.publishedAt).toLocaleString('uk-UA', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              ) : (
                <p className="text-sm text-gray-500">
                  Дата публікації буде встановлена автоматично при натисканні кнопки «Опублікувати».
                </p>
              )}
            </div>
          </section>

          {formError && (
            <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200 text-sm">
              {formError}
            </div>
          )}
        </aside>
      </div>

      {(isSaving || isDeleting) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
          <LoadingSpinner />
        </div>
      )}

      <ConfirmDialog
        open={isDeleteConfirmOpen}
        title="Видалити новину?"
        description={`Ця дія незворотна. Новина${form.title.trim() ? ` "${form.title.trim()}"` : ''} буде видалена остаточно.`}
        confirmLabel="Так, видалити"
        cancelLabel="Скасувати"
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => void handleConfirmDelete()}
        isLoading={isDeleting}
        destructive
      />

      <Toast messages={toasts} onRemove={removeToast} />
    </div>
  )
}
