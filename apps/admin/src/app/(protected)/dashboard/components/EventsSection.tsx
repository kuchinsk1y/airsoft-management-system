'use client'

import { motion, Variants } from 'framer-motion'

const fadeUp: Variants = {
  hidden: { opacity: 0, scale: 0.985 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
  }
}

export interface EventData {
  id: string | number
  name: string
  startDate: string | Date
  gameStartDate?: string | Date
  registeredParticipants: number
  maxParticipants: number
  isActive: boolean
  competitionType?: string
}

interface EventStatus {
  label: string
  className: string
}

interface EventsSectionProps {
  events: EventData[]
}

function getEventStatus(event: EventData): EventStatus {
  if (!event.isActive) {
    return { label: 'Реєстрацію закрито', className: 'bg-gray-500/20 text-gray-300' }
  }
  
  const isFull = event.maxParticipants > 0 && event.registeredParticipants >= event.maxParticipants
  if (isFull) {
    return { label: 'Реєстрація закрита', className: 'bg-yellow-500/20 text-yellow-500' }
  }
  
  return { label: 'Реєстрація відкрита', className: 'bg-(--color-primary)/20 text-(--color-primary)' }
}

export default function EventsSection({ events }: EventsSectionProps) {
  const hasEvents = events.length > 0

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -2, scale: 1.005 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-4 rounded-xl p-[clamp(1rem,2.2vw,1.5rem)] border-2 border-(--color-primary) bg-black/40 backdrop-blur-sm transition-[padding,gap,transform] duration-300 ease-out"
    >
      <h3 className="text-white text-[clamp(1.125rem,2vw,1.25rem)] font-bold transition-[font-size] duration-300 ease-out">
        Найближчі події
      </h3>

      {/* Tablet + desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-400 text-sm font-medium border-b border-gray-800">
              <th className="py-3 px-4">Назва</th>
              <th className="py-3 px-4">Дата</th>
              <th className="py-3 px-4">Учасники</th>
              <th className="py-3 px-4">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {hasEvents ? (
              events.map((event) => {
                const gameStartDate = new Date(event.gameStartDate ?? event.startDate)
                const status = getEventStatus(event)

                return (
                  <tr key={event.id} className="hover:bg-gray-900/50">
                    <td className="py-3 px-4 text-white font-medium">{event.name}</td>
                    <td className="py-3 px-4 text-gray-400">{gameStartDate.toLocaleDateString('uk-UA')}</td>
                    <td className="py-3 px-4 text-gray-400">
                      {event.registeredParticipants} / {event.maxParticipants || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td className="py-6 px-4 text-center text-gray-500" colSpan={4}>
                  Немає найближчих подій
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3 transition-[gap] duration-300 ease-out">
        {hasEvents ? (
          events.map((event) => {
            const gameStartDate = new Date(event.gameStartDate ?? event.startDate)
            const status = getEventStatus(event)

            return (
              <div
                key={event.id}
                className="bg-gray-900/50 rounded-lg p-[clamp(0.875rem,2vw,1rem)] space-y-3 border border-gray-800 transition-[padding] duration-300 ease-out"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-white font-semibold flex-1">{event.name}</h4>
                  <span className={`px-2 py-1 text-[11px] font-bold rounded-full whitespace-nowrap ${status.className}`}>
                    {status.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Дата</p>
                    <p className="text-gray-300">{gameStartDate.toLocaleDateString('uk-UA')}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Учасники</p>
                    <p className="text-gray-300">
                      {event.registeredParticipants} / {event.maxParticipants || '—'}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="py-12 text-center text-gray-500">
            Немає найближчих подій
          </div>
        )}
      </div>
    </motion.div>
  )
}
