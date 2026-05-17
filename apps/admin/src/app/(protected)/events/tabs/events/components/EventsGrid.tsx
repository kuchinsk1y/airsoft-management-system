import { Event } from '../../../types'
import { motion, Variants } from 'framer-motion'
import UpcomingEventsList from './UpcomingEventsList'
import Calendar from '../../../components/Calendar'

const containerReveal: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.24,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.08,
      delayChildren: 0.02,
    },
  },
}

const sectionReveal: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.995 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.34,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

interface EventsGridProps {
  upcomingEvents: Event[]
  onEventClick: (event: Event) => void
  selectedEventId: number | undefined
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  currentMonth: Date
  onMonthChange: (date: Date) => void
  markedDates: string[]
  filterType: string
  onFilterTypeChange: (type: string) => void
  filterCity: string
  onFilterCityChange: (city: string) => void
  uniqueTypes: string[]
  uniqueCities: string[]
  resultsCount: number
}

export default function EventsGrid({
  upcomingEvents,
  onEventClick,
  selectedEventId,
  selectedDate,
  onDateSelect,
  currentMonth,
  onMonthChange,
  markedDates,
  filterType,
  onFilterTypeChange,
  filterCity,
  onFilterCityChange,
  uniqueTypes,
  uniqueCities,
  resultsCount,
}: EventsGridProps) {
  return (
    <motion.div
      className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6"
      variants={containerReveal}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="order-2 lg:order-1" variants={sectionReveal}>
        <UpcomingEventsList
          events={upcomingEvents}
          onEventClick={onEventClick}
          selectedEventId={selectedEventId}
        />
      </motion.div>

      <motion.div className="order-1 lg:order-2" variants={sectionReveal}>
        <Calendar
          selectedDate={selectedDate}
          onDateSelect={onDateSelect}
          currentMonth={currentMonth}
          onMonthChange={onMonthChange}
          markedDates={markedDates}
          filterType={filterType}
          onFilterTypeChange={onFilterTypeChange}
          filterCity={filterCity}
          onFilterCityChange={onFilterCityChange}
          uniqueTypes={uniqueTypes}
          uniqueCities={uniqueCities}
          resultsCount={resultsCount}
        />
      </motion.div>
    </motion.div>
  )
}
