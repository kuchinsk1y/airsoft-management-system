'use client'

import { QuestionItemProps } from '@/interfaces'
import { ChevronDown } from 'lucide-react'

interface QuestionItemComponentProps extends QuestionItemProps {
	isOpen: boolean
	onToggle: () => void
}

export default function QuestionItem({
	question,
	answer,
	isOpen,
	onToggle,
}: QuestionItemComponentProps) {
	return (
		<div
			className='border-t border-white uppercase'
			itemScope
			itemProp='mainEntity'
			itemType='https://schema.org/Question'
		>
			<button
				type='button'
				onClick={onToggle}
				className={`w-full flex items-center justify-between px-5 min991:px-20 pt-5 min991:pt-10 ${
					isOpen ? 'pb-0' : 'pb-5 min991:pb-10'
				}`}
			>
				<span
					className={`text-left font-light text-2xl min991:text-4xl transition-colors uppercase ${
						isOpen ? 'text-[#FA4616]' : 'text-white'
					}`}
					itemProp='name'
				>
					{question}
				</span>
				<ChevronDown
					className={`w-5 h-5 min991:w-6 min991:h-6 transition-all shrink-0 ${
						isOpen ? 'rotate-180 text-[#FA4616]' : 'text-white'
					}`}
				/>
			</button>

			{isOpen && (
				<div
					className='min991:px-20 min991:pb-10 px-5 pb-5 text-white text-base min991:text-xl font-light mt-3 min991:mt-5'
					itemScope
					itemProp='acceptedAnswer'
					itemType='https://schema.org/Answer'
				>
					<span itemProp='text'>{answer}</span>
				</div>
			)}

			{!isOpen && (
				<div
					className='hidden'
					itemScope
					itemProp='acceptedAnswer'
					itemType='https://schema.org/Answer'
				>
					<span itemProp='text'>{answer}</span>
				</div>
			)}
		</div>
	)
}
