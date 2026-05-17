'use client'

import { MdClose, MdCheckCircle } from 'react-icons/md'

interface CompleteConfirmModalProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  eventName?: string
  isLoading?: boolean
}

export default function CompleteConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  eventName,
  isLoading = false,
}: CompleteConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-black/80 border-2 border-white/10 rounded-2xl shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">Завершити подію?</h2>
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
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-green-900/30 flex items-center justify-center">
              <MdCheckCircle className="text-green-400" size={24} />
            </div>
            <div>
              <p className="text-gray-300 mb-1">
                Ви впевнені, що хочете завершити подію?
              </p>
              {eventName && (
                <p className="text-sm text-gray-400">
                  Подія <span className="font-semibold text-white">&quot;{eventName}&quot;</span> буде позначена як завершена.
                </p>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Після завершення події ви зможете додавати рейтинги та результати для учасників.
          </p>
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
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50 font-medium text-sm flex items-center gap-2"
          >
            <MdCheckCircle size={18} />
            {isLoading ? 'Завершення...' : 'Завершити'}
          </button>
        </div>
      </div>
    </div>
  )
}
