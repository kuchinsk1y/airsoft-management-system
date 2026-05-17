'use client'

import ArrowSection from '../ArrowSection/ArrowSection'
import { useEffect, useRef, useState } from 'react'
import { getTemplate } from '@/actions/template'
import { TemplateData, Partner } from '@/interfaces'
import PartnerCard from '../PartnerCard/PartnerCard'

export default function PartnersBlock() {
	const [currentPage, setCurrentPage] = useState(1)
	const [slideHeight, setSlideHeight] = useState<number>(0)
	const [isMobile, setIsMobile] = useState<boolean>(false)
	const [isLoading, setIsLoading] = useState(true)
	const [partners, setPartners] = useState<Partner[]>([])

	const itemsPerPage = 10

	useEffect(() => {
		async function loadPartnersData() {
			try {
				const result = await getTemplate('main')

				if (result.success) {
					const data = result.data as TemplateData<
						{ type: string; items?: Partner[] }[]
					>
					if (data?.content) {
						const partnersBlock = data.content.find(
							item => item.type === 'partners'
						)
						if (partnersBlock?.items) {
							setPartners(
								partnersBlock.items.filter(p => p.logo && p.logo.trim() !== '')
							)
						}
					}
				}
			} catch (error) {
				console.error('Error loading partners template:', error)
				setPartners([])
			} finally {
				setIsLoading(false)
			}
		}

		loadPartnersData()
	}, [])

	const pages = []
	for (let i = 0; i < partners.length; i += itemsPerPage) {
		pages.push(partners.slice(i, i + itemsPerPage))
	}
	const totalPages = pages.length

	const trackRef = useRef<HTMLDivElement | null>(null)
	const firstSlideRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		const handleResize = () => {
			const mobile = window.innerWidth < 991
			setIsMobile(mobile)

			if (firstSlideRef.current) {
				requestAnimationFrame(() => {
					setSlideHeight(firstSlideRef.current!.offsetHeight)
				})
			} else {
				setSlideHeight(0)
			}
		}

		handleResize()
		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	useEffect(() => {
		const t = setTimeout(() => {
			if (firstSlideRef.current)
				setSlideHeight(firstSlideRef.current.offsetHeight)
		}, 200)
		return () => clearTimeout(t)
	}, [isMobile])

	const handlePrev = () => setCurrentPage(p => Math.max(1, p - 1))
	const handleNext = () => setCurrentPage(p => Math.min(totalPages, p + 1))

	const translateYpx = -((currentPage - 1) * slideHeight)
	const translateXpercent = `-${((currentPage - 1) * 100) / pages.length}%`

	if (isLoading) {
		return <p className='text-center text-gray-400 py-10'>Завантаження...</p>
	}

	if (partners.length === 0) {
		return null
	}

	return (
		<div className='border-b border-white'>
			<ArrowSection
				title='Наші партнери'
				current={currentPage}
				total={totalPages}
				onPrev={handlePrev}
				onNext={handleNext}
				isPrevDisabled={currentPage === 1}
				isNextDisabled={currentPage === totalPages}
			/>

			<div
				className='overflow-hidden w-full'
				style={{
					height: isMobile ? slideHeight || undefined : undefined,
				}}
			>
				<div
					ref={trackRef}
					className={`flex transition-transform duration-700 ease-in-out
            ${isMobile ? 'flex-col' : 'flex-row'}
          `}
					style={{
						transform: isMobile
							? `translateY(${translateYpx}px)`
							: `translateX(${translateXpercent})`,
						width: isMobile ? '100%' : `${pages.length * 100}%`,
					}}
				>
					{pages.map((page, pageIndex) => (
						<div
							key={pageIndex}
							ref={pageIndex === 0 ? firstSlideRef : undefined}
							className={`shrink-0 flex  ${
								isMobile ? 'w-full flex-col' : 'flex-row w-full'
							}`}
							style={{
								width: isMobile ? '100%' : `${100 / pages.length}%`,
							}}
						>
							<div
								className={`grid w-full gap-0 ${
									isMobile
										? 'grid-cols-2 grid-rows-5'
										: 'grid-cols-5 grid-rows-2'
								}`}
							>
								{page.map((partner, index) => (
									<div
										key={partner.id}
										className={`
											flex items-center justify-center border-r border-b border-white
											${
												isMobile
													? `${index % 2 === 1 ? 'border-r-0' : ''} ${index >= 8 ? 'border-b-0' : ''}`
													: `${index % 5 === 4 ? 'border-r-0' : ''} ${index >= 5 ? 'border-b-0' : ''}`
											}
										`}
									>
										<PartnerCard partner={partner} />
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
