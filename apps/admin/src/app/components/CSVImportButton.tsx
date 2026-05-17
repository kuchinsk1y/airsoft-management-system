'use client'

import { MdFileUpload } from 'react-icons/md'

interface CSVImportButtonProps {
  onClick: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary'
}

export default function CSVImportButton({ onClick, disabled = false, variant = 'primary' }: CSVImportButtonProps) {
  const variantClass =
    variant === 'secondary'
      ? 'bg-white/5 border border-white/20 text-gray-200 hover:bg-white/10 hover:text-white'
      : 'bg-(--color-primary) text-white hover:bg-(--color-primary-hover)'

  return (
    <button onClick={onClick} disabled={disabled} className={`flex items-center gap-2 px-4 py-2 font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm ${variantClass}`}>
      <MdFileUpload size={18} />
      Імпорт CSV
    </button>
  )
}
