'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MdClose, MdDelete, MdPhotoLibrary, MdUpload } from 'react-icons/md'
import * as eventsApi from '@/actions/events'
import type { Event, EventGalleryItem } from '../../../types'

interface ArchiveGalleryModalProps {
  isOpen: boolean
  onClose: () => void
  event?: Event
}

const formatDateTime = (value: Date) => {
  return value.toLocaleDateString('uk-UA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ArchiveGalleryModal({ isOpen, onClose, event }: ArchiveGalleryModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)

  const eventId = event?.id

  const { data: gallery = [], isLoading, error, refetch } = useQuery({
    queryKey: ['event-gallery', eventId],
    queryFn: () => eventsApi.getEventGallery(eventId as number),
    enabled: isOpen && !!eventId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  })

  const sortedGallery = useMemo(() => {
    return [...gallery].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }, [gallery])

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    setSelectedFiles(files)
  }

  const handleUpload = async () => {
    if (!eventId || selectedFiles.length === 0) return
    setIsUploading(true)
    try {
      await eventsApi.uploadEventGallery(eventId, selectedFiles)
      setSelectedFiles([])
      await refetch()
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (photoId: number) => {
    if (!eventId) return
    setIsDeleting(photoId)
    try {
      await eventsApi.deleteEventGalleryPhoto(eventId, photoId)
      await refetch()
    } finally {
      setIsDeleting(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-black/80 border-2 border-white/10 rounded-2xl shadow-2xl shadow-black/40 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MdPhotoLibrary className="text-(--color-primary)" />
              Галерея події
            </h2>
            {event?.name && <p className="text-sm text-gray-400 mt-1">{event.name}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Закрити"
          >
            <MdClose size={22} />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-white/10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-gray-300 text-sm font-semibold border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
              <MdUpload size={18} />
              Обрати фото
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFilesChange}
              />
            </label>
            <span className="text-xs text-gray-500">
              Рекомендовано: 1600x900, мінімум 1200x675.
            </span>
            {selectedFiles.length > 0 && (
              <span className="text-xs text-gray-400">
                Обрано: <span className="text-white font-semibold">{selectedFiles.length}</span>
              </span>
            )}
          </div>
          <button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || isUploading}
            className="px-4 py-2 rounded-lg bg-(--color-primary) text-black font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Завантаження...' : 'Завантажити'}
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[65vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">Завантаження галереї...</div>
          ) : error ? (
            <div className="p-4 rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 text-sm">
              {String(error)}
            </div>
          ) : sortedGallery.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-gray-500">📷</div>
              <div>
                <p className="text-gray-400 text-sm font-semibold">Фото ще не додані</p>
                <p className="text-gray-500 text-xs mt-1">Завантажте перші знімки події</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedGallery.map((item: EventGalleryItem) => (
                <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                  <div className="relative w-full h-48 bg-black">
                    <img src={item.url} alt="Gallery" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3 flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-400">{formatDateTime(item.createdAt)}</span>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={isDeleting === item.id}
                      className="inline-flex items-center gap-1 text-xs text-red-300 hover:text-red-200 disabled:opacity-50"
                    >
                      <MdDelete size={14} />
                      {isDeleting === item.id ? 'Видалення...' : 'Видалити'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
