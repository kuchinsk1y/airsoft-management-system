'use client'

import { MdClose } from 'react-icons/md'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  productName?: string
  isLoading?: boolean
}

export default function DeleteConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  productName,
  isLoading = false,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-black/80 border-2 border-white/10 rounded-2xl shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">Видалити продукт?</h2>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Закрити"
          >
            <MdClose size={22} />
          </button>
        </div>

        <div className="px-6 py-6">
          <p className="text-gray-300 mb-2">
            Ви впевнені, що хочете видалити продукт?
          </p>
          {productName && (
            <p className="text-sm text-gray-400">
              <span className="font-semibold text-white">&quot;{productName}&quot;</span> буде видалено остаточно.
            </p>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-white/10 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/5 transition-colors disabled:opacity-50 font-medium text-sm"
          >
            Скасувати
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 font-medium text-sm"
          >
            {isLoading ? 'Видалення...' : 'Видалити'}
          </button>
        </div>
      </div>
    </div>
  )
}
