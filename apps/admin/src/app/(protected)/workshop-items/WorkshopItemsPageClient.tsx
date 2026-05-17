'use client'

import { deleteWorkshopItem, fetchWorkshopItems, updateWorkshopItem } from '@/actions/workshop-items'
import ConfirmDialog from '@/app/components/ConfirmDialog'
import LoadingSpinner from '@/app/components/LoadingSpinner'
import Toast, { ToastMessage } from '@/app/components/Toast'
import { WORKSHOP_ITEM_CATEGORY_OPTIONS, WorkshopItemCategory, WorkshopItem } from './types'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  MdAdd,
  MdArticle,
  MdCalendarToday,
  MdDelete,
  MdEdit,
  MdFilterList,
  MdKeyboardArrowDown,
  MdOutlineImage,
  MdPerson,
  MdRefresh,
  MdSearch,
} from 'react-icons/md'

const PAGE_SIZE = 12

type StatusFilter = 'all' | 'published' | 'draft'
type CategoryFilter = 'all' | WorkshopItemCategory

const CATEGORY_LABELS: Record<WorkshopItemCategory, string> = {
  SERVICES: 'Послуги майстерні',
  SUPPORT: 'Експертна підтримка',
}

const formatDate = (date: Date) =>
  date.toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

const getAuthorName = (item: WorkshopItem) => item.author.fullName || item.author.nickName

const getInitials = (value: string) => {
  const parts = value.trim().split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'N'
}

export default function WorkshopItemsPageClient() {
  const [items, setItems] = useState<WorkshopItem[]>([])
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [offset, setOffset] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeItemId, setActiveItemId] = useState<number | null>(null)
  const [itemToDelete, setItemToDelete] = useState<WorkshopItem | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

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
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim())
      setOffset(0)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchInput])

  const loadWorkshopItems = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setLoadError(null)

      const response = await fetchWorkshopItems({
        limit: PAGE_SIZE,
        offset,
        searchQuery: searchQuery || undefined,
        published:
          statusFilter === 'published' ? true : statusFilter === 'draft' ? false : undefined,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
      })

      setItems(response.items)
      setTotal(response.total)
      setLimit(response.limit || PAGE_SIZE)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Помилка завантаження послуг'
      setLoadError(message)
      setItems([])
      setTotal(0)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [categoryFilter, offset, searchQuery, statusFilter])

  useEffect(() => {
    void loadWorkshopItems(false)
  }, [loadWorkshopItems])

  const handleTogglePublish = useCallback(
    async (item: WorkshopItem) => {
      try {
        setActiveItemId(item.id)
        await updateWorkshopItem(item.id, {
          published: !item.published,
          publishedAt: item.published ? '' : new Date().toISOString(),
        })
        addToast(item.published ? 'Послугу знято з публікації' : 'Послугу опубліковано', 'success')
        await loadWorkshopItems(true)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Помилка зміни статусу послуги'
        addToast(message, 'error')
      } finally {
        setActiveItemId(null)
      }
    },
    [addToast, loadWorkshopItems],
  )

  const handleDelete = useCallback(
    async (item: WorkshopItem) => {
      try {
        setActiveItemId(item.id)
        await deleteWorkshopItem(item.id)
        setItemToDelete(null)
        addToast('Послугу видалено', 'success')

        const shouldGoPrevPage = items.length === 1 && offset > 0
        if (shouldGoPrevPage) {
          setOffset((prev) => Math.max(0, prev - limit))
        } else {
          await loadWorkshopItems(true)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Помилка видалення послуги'
        addToast(message, 'error')
      } finally {
        setActiveItemId(null)
      }
    },
    [addToast, items.length, limit, loadWorkshopItems, offset],
  )

  const requestDelete = useCallback((item: WorkshopItem) => {
    setItemToDelete(item)
  }, [])

  const publishedCount = useMemo(() => items.filter((item) => item.published).length, [items])
  const draftCount = useMemo(() => items.filter((item) => !item.published).length, [items])

  const currentPage = Math.floor(offset / limit) + 1
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const shouldShowPagination = total > limit

  const canGoPrev = offset > 0
  const canGoNext = offset + limit < total

  return (
    <div className="min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Послуги майстерні</h1>
          <p className="text-gray-400 text-sm">Керування картками послуг і експертної підтримки</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadWorkshopItems(true)}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MdRefresh className={isRefreshing ? 'animate-spin' : ''} size={18} />
            Оновити
          </button>
          <Link
            href="/workshop-items/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-(--color-primary) hover:bg-(--color-primary-hover) text-white font-semibold transition-colors"
          >
            <MdAdd size={18} />
            Додати послугу
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl border-2 border-white/10 bg-black/30">
          <p className="text-gray-400 text-xs mb-1">Всього записів</p>
          <p className="text-2xl font-bold text-white">{total}</p>
        </div>
        <div className="p-4 rounded-xl border-2 border-white/10 bg-black/30">
          <p className="text-gray-400 text-xs mb-1">Опубліковані (на сторінці)</p>
          <p className="text-2xl font-bold text-white">{publishedCount}</p>
        </div>
        <div className="p-4 rounded-xl border-2 border-white/10 bg-black/30">
          <p className="text-gray-400 text-xs mb-1">Чернетки (на сторінці)</p>
          <p className="text-2xl font-bold text-white">{draftCount}</p>
        </div>
      </div>

      <div className="p-4 rounded-xl border-2 border-white/10 bg-black/30 mb-6">
        <div className="flex items-center gap-2 text-white mb-4">
          <MdFilterList size={20} />
          <h2 className="font-semibold">Фільтри</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Пошук за заголовком або описом..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 text-white placeholder-gray-500 rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none text-sm"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as StatusFilter)
                setOffset(0)
              }}
              title="Фільтр по статусу"
              className="w-full appearance-none pr-9 px-4 py-2 bg-white/5 text-white rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none text-sm"
            >
              <option value="all">Всі статуси</option>
              <option value="published">Опубліковані</option>
              <option value="draft">Чернетки</option>
            </select>
            <MdKeyboardArrowDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" size={20} />
          </div>

          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value as CategoryFilter)
                setOffset(0)
              }}
              title="Фільтр по категорії"
              className="w-full appearance-none pr-9 px-4 py-2 bg-white/5 text-white rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none text-sm"
            >
              <option value="all">Всі категорії</option>
              {WORKSHOP_ITEM_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <MdKeyboardArrowDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" size={20} />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      ) : loadError ? (
        <div className="p-4 rounded-lg border-2 border-red-500/30 bg-red-500/10">
          <p className="text-red-400 text-sm font-medium">⚠️ {loadError}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 rounded-xl border-2 border-white/10 bg-black/30 text-center">
          <p className="text-gray-400 text-lg">Послуги не знайдено</p>
          <p className="text-gray-500 text-sm mt-2">Спробуйте змінити фільтри або пошуковий запит</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          {items.map((item) => {
            const authorName = getAuthorName(item)
            const publicationLabel = item.publishedAt ? formatDate(item.publishedAt) : 'Ще не опубліковано'
            const updatedLabel = formatDate(item.updatedAt)
            const isBusy = activeItemId === item.id

            return (
              <article
                key={item.id}
                className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-800 bg-black/50 backdrop-blur-sm hover:border-(--color-primary)/50 transition-all duration-200"
              >
                <div className="relative w-full h-48 bg-linear-to-b from-gray-900 to-black overflow-hidden">
                  {item.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <MdOutlineImage size={48} />
                    </div>
                  )}

                  <div className="absolute top-3 left-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        item.published
                          ? 'bg-green-900/80 text-green-200'
                          : 'bg-gray-900/80 text-gray-300'
                      }`}
                    >
                      {item.published ? 'Опубліковано' : 'Чернетка'}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        item.published
                          ? 'bg-(--color-primary)/80 text-white'
                          : 'bg-(--color-primary)/65 text-white'
                      }`}
                    >
                      {CATEGORY_LABELS[item.category]}
                    </span>
                  </div>

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/70 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <Link href={`/workshop-items/${item.id}`} className="block">
                      <h3 className="line-clamp-2 text-lg font-semibold leading-tight text-white">
                        {item.title}
                      </h3>
                    </Link>
                  </div>
                </div>

                <div className="p-4 space-y-3 flex flex-1 flex-col">
                  <p className="text-sm text-gray-400 line-clamp-2 min-h-10">{item.excerpt}</p>

                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <MdPerson className="text-(--color-primary) shrink-0" size={16} />
                      {item.author.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.author.logoUrl}
                          alt={authorName}
                          className="h-6 w-6 rounded-full border border-white/10 object-cover"
                        />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[10px] font-semibold text-white shrink-0">
                          {getInitials(authorName)}
                        </div>
                      )}
                      <span className="truncate text-gray-300">{authorName}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-700">
                      <span className="flex items-center gap-1.5 text-gray-400">
                        <MdCalendarToday size={12} className="text-(--color-primary)" />
                        {publicationLabel}
                      </span>
                      <span className="text-gray-500">Оновлено: {updatedLabel}</span>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-2 pt-3 border-t border-gray-800">
                    <button
                      type="button"
                      onClick={() => void handleTogglePublish(item)}
                      disabled={isBusy}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-900/50 hover:bg-(--color-primary)/10 hover:text-(--color-primary) text-gray-400 rounded-lg transition-colors disabled:opacity-50 text-sm font-semibold"
                    >
                      <MdArticle size={16} />
                      {item.published ? 'Зняти з публікації' : 'Опублікувати'}
                    </button>

                    <div className="flex gap-2">
                      <Link
                        href={`/workshop-items/${item.id}`}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-900/50 hover:bg-(--color-primary)/10 hover:text-(--color-primary) text-gray-400 rounded-lg transition-colors text-sm font-semibold"
                      >
                        <MdEdit size={16} />
                        Редагувати
                      </Link>
                      <button
                        type="button"
                        onClick={() => requestDelete(item)}
                        disabled={isBusy}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-900/50 hover:bg-red-500/10 hover:text-red-400 text-gray-400 rounded-lg transition-colors disabled:opacity-50 text-sm font-semibold"
                      >
                        <MdDelete size={16} />
                        Видалити
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {shouldShowPagination && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-sm text-gray-400">
            Сторінка {currentPage} з {totalPages}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!canGoPrev || isLoading}
              onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
              className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Назад
            </button>
            <button
              type="button"
              disabled={!canGoNext || isLoading}
              onClick={() => setOffset((prev) => prev + limit)}
              className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Вперед
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(itemToDelete)}
        title="Видалити послугу?"
        description={itemToDelete ? `Ця дія незворотна. Картка "${itemToDelete.title}" буде видалена остаточно.` : ''}
        confirmLabel="Так, видалити"
        cancelLabel="Скасувати"
        onCancel={() => setItemToDelete(null)}
        onConfirm={() => {
          if (!itemToDelete) return
          void handleDelete(itemToDelete)
        }}
        isLoading={itemToDelete ? activeItemId === itemToDelete.id : false}
        destructive
      />

      <Toast messages={toasts} onRemove={removeToast} />
    </div>
  )
}

