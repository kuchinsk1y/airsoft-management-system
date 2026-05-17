'use client'

import type { Event } from '@/interfaces'
import Calendar from '@/components/content/events/Calendar'
import Card from '@/components/content/events/Card'
import { usePathname } from 'next/navigation'
import { useMemo, useState } from 'react'

const getEventDate = (event: Event): Date =>
  new Date(event.gameStartDate ?? event.startDate)

const isSameDay = (left: Date, right: Date): boolean =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate()

export default function ProfileEventsSection({ events }: { events: Event[] }) {
  const pathname = usePathname() ?? ''
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const selectedDayEvents = useMemo(
    () =>
      events.filter((event) => {
        const eventDate = getEventDate(event)
        if (Number.isNaN(eventDate.getTime())) return false
        return isSameDay(eventDate, selectedDate)
      }),
    [events, selectedDate],
  )

  if (pathname === '/profile/team' || pathname === '/profile/orders') {
    return null
  }

  return (
    <>
      <Calendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
      <div className='border-t border-white'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-white md:[&>*:nth-child(odd)]:border-r lg:[&>*:nth-child(3n+1)]:border-r lg:[&>*:nth-child(3n+2)]:border-r'>
          {selectedDayEvents.length > 0 ? (
            selectedDayEvents.map((event) => <Card key={event.id} event={event} />)
          ) : (
            <div className='col-span-full text-center text-gray-400 py-10'>
              <p>На цей день немає подій</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

