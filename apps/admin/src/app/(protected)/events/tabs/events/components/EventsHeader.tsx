import { MdAdd } from 'react-icons/md'

interface EventsHeaderProps {
  onCreateEvent: () => void
  isLoading: boolean
}

export default function EventsHeader({
  onCreateEvent,
  isLoading,
}: EventsHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h1 className="text-xl sm:text-2xl lg:text-4xl font-black text-white leading-tight">Страйкбольні ігри</h1>
      <div className="flex items-center gap-2 lg:gap-3 shrink-0">
        <button
          onClick={onCreateEvent}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-(--color-primary) text-white font-semibold rounded-lg hover:bg-(--color-primary-hover) disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          <MdAdd size={18} />
          <span className="hidden sm:inline">Створити івент</span>
          <span className="sm:hidden">Створити</span>
        </button>
      </div>
    </div>
  )
}
