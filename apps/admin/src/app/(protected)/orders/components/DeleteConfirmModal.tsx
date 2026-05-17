  'use client'

import { MdWarning } from 'react-icons/md'
import LoadingSpinner from '../../../components/LoadingSpinner'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  orderId: number | null
  isLoading?: boolean
}

export default function DeleteConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  orderId,
  isLoading = false,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#111111] border-2 border-white/10 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <MdWarning className="text-red-400" size={24} />
          </div>
          <h2 className="text-xl font-bold text-white">Підтвердження видалення</h2>
        </div>

        <p className="text-gray-300 mb-6">
          Ви впевнені, що хочете видалити замовлення #{orderId}? Цю дію неможливо скасувати.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            Скасувати
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Видалення...</span>
              </>
            ) : (
              'Видалити'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
