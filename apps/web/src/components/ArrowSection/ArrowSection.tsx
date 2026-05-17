import { ArrowSectionProps } from '@/interfaces'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function ArrowSection({
	title,
	current,
	total,
	onPrev,
	onNext,
	isPrevDisabled,
	isNextDisabled,
	showArrows = true,
  onClick,
}: ArrowSectionProps) {
	return (
		<div onClick={onClick} className='flex items-center justify-between p-5 gap-2.5 border-b uppercase min991:px-20 min991:py-12'>
			<h2 className='text-2xl min991:text-3xl font-medium'>{title}</h2>

			{showArrows && (
				<div className='flex items-center gap-3 min991:gap-6'>
					<button
						type='button'
						onClick={onPrev}
						disabled={isPrevDisabled}
						aria-label='Попередній слайд'
						title='Попередній слайд'
						className={isPrevDisabled ? 'opacity-40 cursor-not-allowed' : ''}
					>
						<ChevronLeft className='w-10 h-10 min991:w-14 min991:h-14' />
					</button>

					<span className='text-2xl min991:text-3xl font-medium whitespace-nowrap'>
						{current} / {total}
					</span>

					<button
						type='button'
						onClick={onNext}
						disabled={isNextDisabled}
						aria-label='Наступний слайд'
						title='Наступний слайд'
						className={isNextDisabled ? 'opacity-40 cursor-not-allowed' : ''}
					>
						<ChevronRight className='w-10 h-10 min991:w-14 min991:h-14' />
					</button>
				</div>
			)}
		</div>
	)
}
