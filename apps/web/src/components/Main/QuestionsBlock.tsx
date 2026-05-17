'use client'

import ArrowSection from '../ArrowSection/ArrowSection'
import { useEffect, useState } from 'react'
import { getTemplate } from '@/actions/template'
import { TemplateData, QuestionItemProps } from '@/interfaces'
import QuestionItem from '../QuestionItem/QuestionItem'

export default function QuestionsBlock() {
	const [isLoading, setIsLoading] = useState(true)
	const [questions, setQuestions] = useState<QuestionItemProps[]>([])
	const [showAll, setShowAll] = useState(false)
	const [openQuestionId, setOpenQuestionId] = useState<number | null>(null)

	useEffect(() => {
		async function loadQuestionsData() {
			try {
				const result = await getTemplate('main')

				if (result.success) {
					const data = result.data as TemplateData<
						{ type: string; items?: QuestionItemProps[] }[]
					>
					if (data?.content) {
						const faqBlock = data.content.find(item => item.type === 'faq')
						if (faqBlock?.items) {
							setQuestions(faqBlock.items.filter(q => q.question && q.answer))
						}
					}
				}
			} catch (error) {
				console.error('Error loading questions template:', error)
				setQuestions([])
			} finally {
				setIsLoading(false)
			}
		}

		loadQuestionsData()
	}, [])

	if (isLoading) {
		return <p className='text-center text-gray-400 py-10'>Завантаження...</p>
	}

	if (questions.length === 0) {
		return null
	}

	const visibleQuestions = showAll ? questions : questions.slice(0, 3)

	return (
		<div
			className='border-b border-white'
			itemScope
			itemType='https://schema.org/FAQPage'
		>
			<ArrowSection title='Найчастіші питання' showArrows={false} />

			<div className='flex flex-col'>
				{visibleQuestions.map(question => (
					<QuestionItem
						key={question.id}
						id={question.id}
						question={question.question}
						answer={question.answer}
						isOpen={openQuestionId === question.id}
						onToggle={() =>
							setOpenQuestionId(
								openQuestionId === question.id ? null : question.id
							)
						}
					/>
				))}

				{questions.length > 3 && (
					<div className='border-t border-white'>
						<button
							onClick={() => setShowAll(!showAll)}
							className='w-full p-5 min991:py-10 min991:px-20 text-left uppercase text-white 1440:text-xl font-light underline'
						>
							{showAll ? 'Показати менше' : 'Показати більше'}
						</button>
					</div>
				)}
			</div>
		</div>
	)
}
