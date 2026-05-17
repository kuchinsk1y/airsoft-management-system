'use client'

import { MdClose } from 'react-icons/md'
import ProductsImportContent from './ProductsImportContent'

interface ProductsImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function ProductsImportModal({ isOpen, onClose, onSuccess }: ProductsImportModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4">
      <div className="w-full max-w-2xl bg-black/80 border-2 border-white/10 rounded-2xl shadow-2xl shadow-black/40 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 sticky top-0 bg-black/80">
          <h2 className="text-base sm:text-lg font-bold text-white">Імпорт продуктів з CSV</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Закрити"
          >
            <MdClose size={22} />
          </button>
        </div>

        <div className="px-4 sm:px-6 py-4 sm:py-6">
          <ProductsImportContent
            onSuccess={() => {
              onClose()
              onSuccess?.()
            }}
          />
        </div>
      </div>
    </div>
  )
}
