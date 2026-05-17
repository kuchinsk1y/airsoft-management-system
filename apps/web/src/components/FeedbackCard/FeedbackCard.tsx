'use client'

import Image from 'next/image'
import { FeedbackCardProps } from '@/interfaces'

export default function FeedbackCard({
	logoUrl,
	name,
	nickName,
	progress,
	text,
	withBorder = true,
}: FeedbackCardProps) {
	return (
		<div
			className={`flex flex-col min-w-0 bg-black ${
				withBorder ? 'border border-white' : ''
			} p-5 1440:px-20 1440:py-16 uppercase`}
		>
			<div className='flex gap-4 1440:gap-5 mb-6'>
				<div className='relative w-20 h-20 1440:w-28 1440:h-28 min1441:w-24 min1441:h-24 shrink-0 rounded-[20px] 1440:rounded-[28px] min1441:rounded-3xl overflow-hidden bg-white'>
					<Image
						src={logoUrl}
						alt={name}
						fill
						className='object-cover'
						sizes='(max-width: 1439px) 80px, 112px'
					/>
				</div>
				<div className='flex flex-col justify-center gap-0.5'>
					<h3 className='text-white font-medium text-3xl'>{name}</h3>
					<p className='text-white text-base font-medium opacity-90'>
						@{nickName}
					</p>
					<p className='text-gray-400 text-base font-light'>{progress}</p>
				</div>
			</div>
			<div className='flex flex-col overflow-hidden'>
				<p className='text-white text-xl font-light wrap-break-word'>{text}</p>
			</div>
		</div>
	)
}
