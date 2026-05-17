'use client'

import { MdClose } from 'react-icons/md'

interface ArchiveResultModalProps {
  isOpen: boolean
  onClose: () => void
  eventName?: string
}

export default function ArchiveResultModal({
  isOpen,
  onClose,
  eventName,
}: ArchiveResultModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-black/80 border-2 border-white/10 rounded-2xl shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white">Результат події</h2>
            {eventName && (
              <p className="text-sm text-gray-400 mt-1">{eventName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Закрити"
          >
            <MdClose size={22} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs text-gray-400">
              Переможець
              <select
                disabled
                className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-gray-400"
              >
                <option>Оберіть команду</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-gray-400">
              Переможені
              <select
                disabled
                className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-gray-400"
              >
                <option>Оберіть команду</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-gray-400">
              Очки переможця
              <input
                disabled
                type="number"
                placeholder="0"
                className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-gray-400"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-gray-400">
              Очки переможених
              <input
                disabled
                type="number"
                placeholder="0"
                className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-gray-400"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-xs text-gray-400">
            Коментар
            <textarea
              disabled
              rows={3}
              placeholder="Додаткові деталі матчу"
              className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-gray-400 resize-none"
            />
          </label>

          <p className="text-xs text-gray-500">
            Функція в розробці. Тут буде форма для збереження результату.
          </p>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-white/10 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/5 transition-colors font-medium text-sm"
          >
            Закрити
          </button>
          <button
            disabled
            className="px-4 py-2 rounded-lg bg-(--color-primary)/60 text-white transition-colors font-medium text-sm disabled:opacity-60"
          >
            Зберегти (скоро)
          </button>
        </div>
      </div>
    </div>
  )
}
