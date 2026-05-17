'use client'

import { TopCardProps } from '@/interfaces'
import Image from 'next/image'
import { truncateName } from '@/utils/truncateName';

export function formatScore(score: number): string {
	return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export default function TopCard({ title, data }: TopCardProps) {
	return (
		<div className='flex flex-col flex-1 min-w-0 border-r border-b min991:border-b-0 last:min991:border-r-0'>
			<div className='p-5 min991:p-8 border-b'>
				<h3 className='text-left px-5 min991:px-0 text-2xl min991:text-3xl 1440:text-4xl font-semibold uppercase text-white overflow-hidden text-ellipsis'>
					{title}
				</h3>
			</div>

			<div className='flex flex-col pt-4 pb-4 1440:pt-10 1440:pb-10'>
				{data.slice(0, 5).map((item, index) => (
					<div
						key={index}
						className='flex items-center pl-5 pr-5 1140:pl-8 1440:pr-8 mb-4 last:mb-0'
					>
						<span className='text-white text-2xl font-medium shrink-0'>
							{index + 1}
						</span>
						<div className='relative w-12 h-12 shrink-0 rounded-full flex items-center justify-center overflow-hidden 1440:ml-8 ml-5'>
							<Image
								src={item.logoUrl}
								alt='TopLogo'
								width={10}
								height={10}
								className='object-contain w-10 h-10'
							/>
						</div>
						<span className='text-white text-2xl font-medium flex-1 truncate ml-4'>
							{truncateName(item.nickName)}
						</span>
						<span className='text-white text-2xl font-medium shrink-0 ml-8'>
							{formatScore(item.score)}
						</span>
					</div>
				))}
			</div>
		</div>
	)
}