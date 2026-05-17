'use client'

import { ChevronDownIcon } from '@/components/icons/ChevronDownIcon'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useMemo } from 'react'

interface MonthDropdownProps {
	selectedMonth: string | null // Format: "YYYY-MM"
	onMonthSelect: (month: string | null) => void
}

export const MonthDropdown = ({
	selectedMonth,
	onMonthSelect,
}: MonthDropdownProps) => {
	const months = useMemo(() => {
		const monthNames = [
			'СІЧЕНЬ',
			'ЛЮТИЙ',
			'БЕРЕЗЕНЬ',
			'КВІТЕНЬ',
			'ТРАВЕНЬ',
			'ЧЕРВЕНЬ',
			'ЛИПЕНЬ',
			'СЕРПЕНЬ',
			'ВЕРЕСЕНЬ',
			'ЖОВТЕНЬ',
			'ЛИСТОПАД',
			'ГРУДЕНЬ',
		]

		const currentYear = new Date().getFullYear()
		const options: Array<{ value: string; label: string }> = [
			{ value: '', label: 'ВСІ МІСЯЦІ' },
		]

		// Генеруємо місяці для поточного та попередніх років
		for (let year = currentYear; year >= currentYear - 2; year--) {
			for (let month = 12; month >= 1; month--) {
				const monthStr = String(month).padStart(2, '0')
				const value = `${year}-${monthStr}`
				const label = `${monthNames[month - 1]} ${year}`
				options.push({ value, label })
			}
		}

		return options
	}, [])

	const selectedLabel =
		months.find(m => m.value === selectedMonth)?.label || 'ВСІ МІСЯЦІ'

	return (
		<div className='border-l border-white border-b border-r border-t-0 flex items-center justify-center py-2 375:py-5 pl-5 pr-4 min376:py-2 lg:border-b 1440:py-8 1440:pl-10 1440:pr-6 min1441:py-2 min1441:pl-5'>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button className='flex items-center justify-center gap-2 w-full text-white uppercase focus:outline-none cursor-pointer font-medium text-base leading-[143%] 1440:text-xl 1440:leading-[120%] min1441:text-base'>
						<p className='overflow-hidden text-ellipsis whitespace-nowrap flex-1 text-left'>
							{selectedLabel}
						</p>
						<ChevronDownIcon className='w-5 h-5 1440:w-8 1440:h-8 shrink-0' />
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					className='bg-white text-black border border-gray-200 min-w-[200px] max-h-[300px] overflow-y-auto rounded-none'
					align='start'
					side='bottom'
					sideOffset={9}
					alignOffset={0}
					collisionPadding={0}
				>
					{months.map(option => (
						<DropdownMenuItem
							key={option.value || 'all'}
							className={`uppercase font-medium py-1 px-3 cursor-pointer ${
								option.value === ''
									? 'text-base font-bold'
									: 'text-sm'
							} ${
								selectedMonth === option.value
									? 'bg-gray-200 text-black'
									: 'hover:bg-gray-100 text-black'
							}`}
							onClick={() => onMonthSelect(option.value || null)}
						>
							{option.label}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	)
}
