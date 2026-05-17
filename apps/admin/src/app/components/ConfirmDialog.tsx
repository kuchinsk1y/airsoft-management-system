'use client'

import { MdClose } from 'react-icons/md'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
  destructive?: boolean
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Підтвердити',
  cancelLabel = 'Скасувати',
  onConfirm,
  onCancel,
  isLoading = false,
  destructive = false,
}: ConfirmDialogProps) {
  if (!open) return null

  const confirmButtonClass = destructive
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-(--color-primary) hover:bg-(--color-primary-hover) text-white'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-md bg-black/80 border-2 border-white/10 rounded-2xl shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Закрити"
          >
            <MdClose size={22} />
          </button>
        </div>

        <div className="px-6 py-6">
          <p className="text-gray-300">{description}</p>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-white/10 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/5 transition-colors disabled:opacity-50 font-medium text-sm"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 font-medium text-sm ${confirmButtonClass}`}
          >
            {isLoading ? 'Видалення...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
