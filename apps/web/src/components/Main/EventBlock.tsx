'use client'

import { getEvents } from '@/actions/events'
import { Event } from '@/interfaces'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import ArrowSection from '../ArrowSection/ArrowSection'
import Card from '../content/events/Card'

type EventBlockProps = {
	initialEvents?: Event[]
	initialRegionSlug?: string
}

function normalizeUpcomingEvents(source: Event[]): Event[] {
	const now = new Date()
	now.setHours(0, 0, 0, 0)

	const getGameStartDate = (event: Event): Date =>
		new Date(event.gameStartDate ?? event.startDate)

	return source
		.filter(event => {
			const eventDate = getGameStartDate(event)
			if (Number.isNaN(eventDate.getTime())) return false
			eventDate.setHours(0, 0, 0, 0)
			return eventDate >= now
		})
		.sort((a, b) => {
			const dateA = getGameStartDate(a).getTime()
			const dateB = getGameStartDate(b).getTime()
			return dateA - dateB
		})
}

export default function EventBlock({
	initialEvents = [],
	initialRegionSlug,
}: EventBlockProps) {
	const [currentPage, setCurrentPage] = useState(1)
	const [isMobile, setIsMobile] = useState<boolean>(false)
	const searchParams = useSearchParams()
	const regionSlug = searchParams?.get('region') || undefined
	const normalizedInitialEvents = useMemo(
		() => normalizeUpcomingEvents(initialEvents),
		[initialEvents],
	)
	const [events, setEvents] = useState<Event[]>(normalizedInitialEvents)
	const [isLoading, setIsLoading] = useState(normalizedInitialEvents.length === 0)

	const itemsPerPage = 3

	useEffect(() => {
		if (regionSlug === initialRegionSlug && normalizedInitialEvents.length > 0) {
			setEvents(normalizedInitialEvents)
			setIsLoading(false)
			return
		}

		async function loadEvents() {
			try {
				const fetchedEvents = await getEvents({
					isActive: true,
					regionSlug,
				})

				if (!Array.isArray(fetchedEvents)) {
					console.warn('Events API returned non-array:', fetchedEvents)
					setEvents([])
					setIsLoading(false)
					return
				}

				setEvents(normalizeUpcomingEvents(fetchedEvents))
			} catch (error) {
				console.error('Error loading events:', error)
				setEvents([])
			} finally {
				setIsLoading(false)
			}
		}

		setIsLoading(true)
		loadEvents()
	}, [regionSlug, initialRegionSlug, normalizedInitialEvents])

	const pages = []
	for (let i = 0; i < events.length; i += itemsPerPage) {
		pages.push(events.slice(i, i + itemsPerPage))
	}
	const totalPages = pages.length
	const currentItems = pages[currentPage - 1] ?? []

	useEffect(() => {
		const handleResize = () => setIsMobile(window.innerWidth < 991)
		handleResize()
		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	useEffect(() => {
		if (currentPage > totalPages && totalPages > 0) {
			setCurrentPage(totalPages)
		}
	}, [currentPage, totalPages])

	const handlePrev = () => setCurrentPage(p => Math.max(1, p - 1))
	const handleNext = () => setCurrentPage(p => Math.min(totalPages, p + 1))

	if (isLoading) {
		return (
			<div className='border-b border-white py-10'>
				<p className='text-center text-gray-400'>Завантаження подій...</p>
			</div>
		)
	}

	if (events.length === 0) {
		return (
			<div className='border-b border-white py-10'>
				<p className='text-center text-gray-400'>
					Наразі немає майбутніх подій
				</p>
			</div>
		)
	}

	return (
		<div className='border-b border-white'>
			<ArrowSection
				title='Найближчі події'
				current={currentPage}
				total={totalPages}
				onPrev={handlePrev}
				onNext={handleNext}
				isPrevDisabled={currentPage === 1}
				isNextDisabled={currentPage === totalPages}
			/>

			<div className={`w-full flex ${isMobile ? 'flex-col' : 'flex-row'}`}>
				{currentItems.map(event => {
					const singleDesktop = !isMobile && currentItems.length === 1
					return (
						<div
							key={event.id}
							className={`${
								isMobile
									? 'w-full'
									: singleDesktop
										? 'flex-none w-full lg:w-1/3'
										: 'flex-1'
							} border-r border-white`}
						>
							<Card event={event} hideBorderOn1440={true} regionSlug={regionSlug} />
						</div>
					)
				})}
			</div>
		</div>
	)
}
