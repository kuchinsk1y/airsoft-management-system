'use client'

import { MdSearch, MdFilterList } from 'react-icons/md'

interface TeamsFiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  resultCount: number
}

export default function TeamsFilters({ searchQuery, onSearchChange, resultCount }: TeamsFiltersProps) {
  const hasSearch = searchQuery.trim().length > 0

  return (
    <div className="p-4 sm:p-5 rounded-xl border-2 border-white/10 bg-black/30">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 text-white">
          <MdFilterList size={20} />
          <h2 className="font-semibold text-sm sm:text-base">Фільтри</h2>
        </div>
        <p className="text-xs text-gray-400">
          Результатів: <span className="text-white font-semibold">{resultCount}</span>
        </p>
      </div>

      <div className="relative">
        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Пошук по назві команди..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-24 py-2.5 bg-white/5 text-white placeholder-gray-500 rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none text-sm"
        />
        {hasSearch && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 rounded-md border border-white/10 text-xs text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            Скинути
          </button>
        )}
      </div>

      <div className="mt-3 text-xs text-gray-500">
        Пошук виконується автоматично з невеликою затримкою для швидкої роботи.
      </div>
    </div>
  )
}
