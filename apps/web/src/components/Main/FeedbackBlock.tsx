'use client'

import { getRandomCommentsByScope } from '@/actions/comments'
import ArrowSection from '../ArrowSection/ArrowSection'
import { useEffect, useRef, useState } from 'react'
import FeedbackCard from '../FeedbackCard/FeedbackCard'
import type { Comment } from '@/interfaces'

type FeedbackBlockProps = {
	initialComments?: Comment[]
}

function mapCommentsToFeedbacks(comments: Comment[]) {
	return comments.map((comment: Comment) => ({
		logoUrl: comment.author.logoUrl || '/FeedbackLogo.svg',
		name: comment.author.fullName || comment.author.nickName,
		nickName: comment.author.nickName,
		progress: comment.event?.name || comment.author.nickName,
		text: comment.message,
	}))
}

export default function FeedbackBlock({
	initialComments = [],
}: FeedbackBlockProps) {
	const [currentPage, setCurrentPage] = useState(1)
	const [slideHeight, setSlideHeight] = useState<number>(0)
	const [isMobile, setIsMobile] = useState<boolean>(false)
	const [isLoading, setIsLoading] = useState(initialComments.length === 0)
	const [feedbacks, setFeedbacks] = useState<Array<{
		logoUrl: string
		name: string
		nickName: string
		progress: string
		text: string
	}>>(mapCommentsToFeedbacks(initialComments))

	useEffect(() => {
		if (initialComments.length > 0) {
			setFeedbacks(mapCommentsToFeedbacks(initialComments))
			setIsLoading(false)
			return
		}

		const loadComments = async () => {
			try {
				const comments = await getRandomCommentsByScope('COMPANY', 9)
				setFeedbacks(mapCommentsToFeedbacks(comments))
				setCurrentPage(1)
			} catch (error) {
				console.error('Failed to load comments:', error)
				setFeedbacks([])
			} finally {
				setIsLoading(false)
			}
		}

		loadComments()
	}, [initialComments])

	const itemsPerPage = 3

	const pages = []
	for (let i = 0; i < feedbacks.length; i += itemsPerPage) {
		pages.push(feedbacks.slice(i, i + itemsPerPage))
	}
	const totalPages = pages.length || 1

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
	const translateXpercent = `-${((currentPage - 1) * 100) / totalPages}%`

	if (isLoading) {
		return <p className='text-center text-gray-400 py-10'>Завантаження...</p>
	}

	if (feedbacks.length === 0) {
		return null
	}

	return (
		<div className='border-b border-white'>
			<ArrowSection
				title='Відгуки'
				current={currentPage}
				total={totalPages}
				onPrev={handlePrev}
				onNext={handleNext}
				isPrevDisabled={currentPage === 1 || totalPages <= 1}
				isNextDisabled={currentPage === totalPages || totalPages <= 1}
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
						width: isMobile ? '100%' : `${totalPages * 100}%`,
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
								width: isMobile ? '100%' : `${100 / totalPages}%`,
							}}
						>
							{page.map((feedback, feedbackIndex) => (
								<div
									key={feedbackIndex}
									className={`min-w-0 ${
										isMobile ? 'w-full' : 'flex-1'
                  			} ${!isMobile && feedbackIndex < page.length - 1 ? 'border-r border-white' : ''} ${isMobile && feedbackIndex < page.length - 1 ? 'border-b border-white' : ''}`}
								>
									<FeedbackCard
										logoUrl={feedback.logoUrl}
										name={feedback.name}
										nickName={feedback.nickName}
										progress={feedback.progress}
										text={feedback.text}
										withBorder={false}
									/>
								</div>
							))}
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
