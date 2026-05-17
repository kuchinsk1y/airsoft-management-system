'use client'

import { useCallback } from 'react'
import { MdDownload } from 'react-icons/md'

interface CSVExportButtonProps {
  headers: string[]
  data: (string | number)[][]
  fileName: string
  onSuccess?: () => void
  onError?: (message: string) => void
  disabled?: boolean
  variant?: 'primary' | 'secondary'
}

export default function CSVExportButton({headers, data, fileName, onSuccess, onError, disabled = false, variant = 'primary'}: CSVExportButtonProps) {
  const variantClass =
    variant === 'secondary'
      ? 'bg-white/5 border border-white/20 text-gray-200 hover:bg-white/10 hover:text-white shadow-none'
      : 'bg-(--color-primary) hover:bg-(--color-primary-hover) text-white shadow-lg'

  const handleExport = useCallback(() => {
    if (data.length === 0) return onError?.('Немає даних для експорту')

    try {
      const csvContent = [headers, ...data].map((row) => row.map((cell) => (cell ?? '').toString()).join(';')).join('\n')

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${fileName}_${new Date().toISOString().split('T')[0]}.csv`
      link.click()

      onSuccess?.()
    } catch (error) {
      onError?.('Помилка при експорті')
      console.error('CSV export error:', error)
    }
  }, [headers, data, fileName, onSuccess, onError])

  return (
    <button onClick={handleExport} disabled={disabled || data.length === 0} className={`flex items-center gap-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-all text-sm ${variantClass}`}>
      <MdDownload size={18} />
      Експорт CSV
    </button>
  )
}
