'use client'

import { useEffect, useMemo, useState } from 'react'
import { MdClose, MdOutlineFeedback } from 'react-icons/md'

interface RejectReasonModalProps {
  isOpen: boolean
  eventName?: string
  isLoading?: boolean
  onCancel: () => void
  onConfirm: (reason: string) => void
}

const REASON_TEMPLATES = [
  'Потрібно уточнити опис події та сценарій.',
  'Будь ласка, додайте коректну локацію та час початку гри.',
  'Подія потребує доопрацювання перед публікацією.',
]

export default function RejectReasonModal({
  isOpen,
  eventName,
  isLoading = false,
  onCancel,
  onConfirm,
}: RejectReasonModalProps) {
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (isOpen) {
      setReason('')
    }
  }, [isOpen])

  const trimmedReason = useMemo(() => reason.trim(), [reason])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label="Вказати причину відхилення">
      <div className="w-full max-w-xl rounded-xl border border-gray-800 bg-[#111111] shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-white">Причина відхилення</h2>
            <p className="mt-1 text-sm text-gray-400">
              {eventName ? `Подія “${eventName}” не буде опублікована, доки організатор не внесе зміни.` : 'Опишіть, що саме потрібно виправити організатору.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="text-gray-400 transition-colors hover:text-white disabled:opacity-50"
            aria-label="Закрити"
          >
            <MdClose size={22} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-xl border border-gray-700 bg-black/40 p-4 text-sm text-gray-300">
            Формулюйте причину коротко і предметно. Організатор побачить цей текст у листі та в статусі події.
          </div>

          <div className="flex flex-wrap gap-2">
            {REASON_TEMPLATES.map((template) => (
              <button
                key={template}
                type="button"
                onClick={() => setReason(template)}
                className="rounded-full border border-gray-700 bg-black/40 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-(--color-primary)/40 hover:text-white"
              >
                {template}
              </button>
            ))}
          </div>

          <label className="block">
            <span className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-white">
              <MdOutlineFeedback className="text-(--color-primary)" size={18} />
              Коментар для організатора
            </span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Наприклад: потрібно вказати точний час початку гри, адресу полігону та доповнити опис формату події."
              rows={6}
              className="w-full resize-none rounded-xl border border-gray-700 bg-neutral-900/80 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-gray-500 focus:border-(--color-primary)"
            />
          </label>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Причина є обов’язковою</span>
            <span>{trimmedReason.length} символів</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-800 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black/30 disabled:opacity-50"
          >
            Скасувати
          </button>
          <button
            type="button"
            onClick={() => onConfirm(trimmedReason)}
            disabled={isLoading || trimmedReason.length === 0}
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100 transition-colors hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Збереження...' : 'Відхилити подію'}
          </button>
        </div>
      </div>
    </div>
  )
}