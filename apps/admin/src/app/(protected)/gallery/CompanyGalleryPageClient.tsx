'use client'

import {
  deleteCompanyGalleryPhoto,
  getCompanyGalleryPhotos,
  uploadCompanyGalleryPhotos,
  type CompanyGalleryPhoto,
} from '@/actions/gallery'
import LoadingSpinner from '@/app/components/LoadingSpinner'
import Toast, { ToastMessage } from '@/app/components/Toast'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MdDelete, MdOutlinePhotoLibrary, MdRefresh, MdUpload } from 'react-icons/md'

const PHOTOS_PER_PAGE = 20

export default function CompanyGalleryPageClient() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
      const id = `${Date.now()}-${Math.random()}`
      setToasts((prev) => [...prev, { id, message, type }])
    },
    [],
  )

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const {
    data: photos = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery<CompanyGalleryPhoto[]>({
    queryKey: ['company-gallery-photos'],
    queryFn: () => getCompanyGalleryPhotos(),
    staleTime: 30_000,
  })

  const sortedPhotos = useMemo(
    () => [...photos].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    [photos],
  )

  const totalPages = Math.max(1, Math.ceil(sortedPhotos.length / PHOTOS_PER_PAGE))

  const paginatedPhotos = useMemo(() => {
    const startIndex = (currentPage - 1) * PHOTOS_PER_PAGE
    return sortedPhotos.slice(startIndex, startIndex + PHOTOS_PER_PAGE)
  }, [currentPage, sortedPhotos])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handleFilesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    setSelectedFiles(files)
  }, [])

  const resetSelection = useCallback(() => {
    setSelectedFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) {
      addToast('Оберіть хоча б одне фото', 'warning')
      return
    }

    setIsUploading(true)
    try {
      await uploadCompanyGalleryPhotos(selectedFiles)
      resetSelection()
      setCurrentPage(1)
      await refetch()
      addToast('Фото успішно додано до галереї', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Помилка завантаження фото'
      addToast(message, 'error')
    } finally {
      setIsUploading(false)
    }
  }, [addToast, refetch, resetSelection, selectedFiles])

  const handleDelete = useCallback(
    async (photoId: number) => {
      setIsDeleting(photoId)
      try {
        await deleteCompanyGalleryPhoto(photoId)
        await refetch()
        addToast('Фото видалено', 'success')
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Помилка видалення фото'
        addToast(message, 'error')
      } finally {
        setIsDeleting(null)
      }
    },
    [addToast, refetch],
  )

  return (
    <div className="min-h-screen">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">Галерея компанії</h1>
          <p className="text-sm text-gray-400">Завантажуйте фото для загальної галереї на сайті</p>
        </div>

        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching || isLoading}
          className="inline-flex self-start items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          <MdRefresh className={isFetching ? 'animate-spin' : ''} size={18} />
          Оновити
        </button>
      </div>

      <div className="mb-6 rounded-xl border-2 border-white/10 bg-black/30 p-4">
        <div className="mb-4 flex items-center gap-2 text-white">
          <MdUpload size={20} />
          <h2 className="font-semibold">Завантаження фото</h2>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            multiple
            onChange={handleFilesChange}
            title="Оберіть фото для завантаження"
            className="block w-full cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-(--color-primary) file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
          />

          <button
            type="button"
            onClick={() => void handleUpload()}
            disabled={isUploading || selectedFiles.length === 0}
            className="inline-flex h-12.5 min-w-52 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-(--color-primary) px-4 text-sm font-semibold text-white transition-colors hover:bg-(--color-primary-hover) disabled:cursor-not-allowed disabled:opacity-50"
          >
            <MdUpload size={18} />
            {isUploading ? 'Завантаження...' : 'Додати в галерею'}
          </button>
        </div>

        {selectedFiles.length > 0 && (
          <p className="mt-2 text-xs text-gray-400">Обрано файлів: {selectedFiles.length}</p>
        )}
      </div>

      <div className="mb-4 flex items-center gap-2 text-white">
        <MdOutlinePhotoLibrary size={20} />
        <h2 className="font-semibold">Фото в галереї ({sortedPhotos.length})</h2>
      </div>

      {isLoading ? (
        <div className="flex min-h-55 items-center justify-center rounded-xl border-2 border-white/10 bg-black/30">
          <LoadingSpinner />
        </div>
      ) : sortedPhotos.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-white/10 bg-black/20 py-12 text-center text-gray-400">
          Фото поки відсутні
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {paginatedPhotos.map((photo) => (
              <div key={photo.id} className="group overflow-hidden rounded-xl border border-white/10 bg-black/40">
                <div className="relative aspect-square w-full">
                  <Image
                    src={photo.url}
                    alt="Фото галереї"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 20vw"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 p-2">
                  <p className="truncate text-xs text-gray-400">
                    {photo.createdAt.toLocaleDateString('uk-UA')}
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleDelete(photo.id)}
                    disabled={isDeleting === photo.id}
                    className="inline-flex items-center gap-1 rounded-md border border-red-500/40 px-2 py-1 text-xs text-red-300 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <MdDelete size={14} />
                    {isDeleting === photo.id ? '...' : 'Видалити'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-xs text-gray-400">
                Сторінка {currentPage} з {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded-md border border-white/15 px-3 py-1.5 text-sm text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Назад
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-md border border-white/15 px-3 py-1.5 text-sm text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Вперед
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <Toast messages={toasts} onRemove={removeToast} />
    </div>
  )
}
