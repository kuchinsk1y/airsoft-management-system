interface EventsFiltersProps {
  showAllEvents: boolean
  filterPeriod: 'all' | 'selected-date' | 'week'
  onFilterAll: () => void
  onFilterByDate: () => void
  onFilterByWeek: () => void
}

export default function EventsFilters({
  showAllEvents,
  filterPeriod,
  onFilterAll,
  onFilterByDate,
  onFilterByWeek,
}: EventsFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={onFilterAll}
        className={`px-3 lg:px-4 py-2 rounded-lg font-semibold transition-colors text-xs lg:text-sm ${
          showAllEvents && filterPeriod === 'all'
            ? 'bg-(--color-primary) text-white'
            : 'bg-white/5 text-gray-300 hover:bg-white/10'
        }`}
      >
        Всі
      </button>
      <button
        onClick={onFilterByDate}
        className={`px-3 lg:px-4 py-2 rounded-lg font-semibold transition-colors text-xs lg:text-sm ${
          !showAllEvents && filterPeriod === 'selected-date'
            ? 'bg-(--color-primary) text-white'
            : 'bg-white/5 text-gray-300 hover:bg-white/10'
        }`}
      >
        За датою
      </button>
      <button
        onClick={onFilterByWeek}
        className={`px-3 lg:px-4 py-2 rounded-lg font-semibold transition-colors text-xs lg:text-sm ${
          filterPeriod === 'week'
            ? 'bg-(--color-primary) text-white'
            : 'bg-white/5 text-gray-300 hover:bg-white/10'
        }`}
      >
        На цьому тижні
      </button>
    </div>
  )
}
