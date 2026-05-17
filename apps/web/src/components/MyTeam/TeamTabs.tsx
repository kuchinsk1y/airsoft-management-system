'use client'

import type { TeamTab, TeamTabsProps } from '@/interfaces'
import React from 'react'

export type { TeamTab } from '@/interfaces'

export function TeamTabs({
	value,
	onChange,
	userRole = 'none',
}: TeamTabsProps) {
	const tabs = 
		userRole === 'owner'
			? ([
					{ value: 'my-team' as const, label: 'Моя команда' },
					{ value: 'applications' as const, label: 'Заявки на вступ' },
					{ value: 'edit' as const, label: 'Редагування даних' },
				] as const)
			: userRole === 'member'
			? ([
					{ value: 'my-team' as const, label: 'Моя команда' },
					{ value: 'applications' as const, label: 'Заявки на вступ' },
				] as const)
			: ([
					{ value: 'create' as const, label: 'Створити команду' },
					{ value: 'join' as const, label: 'Вступити в команду' },
				] as const);

	return (
		<div className='relative overflow-hidden'>
			<div className='flex gap-4 sm:gap-12 text-xs sm:text-sm tracking-wide overflow-x-auto min991:overflow-x-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pr-10 -mr-10 min991:pr-0 min991:mr-0 snap-x snap-mandatory'>
				{tabs.map((tab) => (
					<button
						key={tab.value}
						type='button'
						onClick={() => onChange(tab.value)}
						className={`pb-2 border-b-2 uppercase whitespace-nowrap shrink-0 snap-start ${
							value === tab.value
								? 'text-white border-[#FA4616]'
								: 'text-gray-500 border-transparent hover:text-gray-300'
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>
		</div>
	)
}

