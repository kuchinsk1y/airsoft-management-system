'use client'

import Image from 'next/image'
import { PartnerCardProps } from '@/interfaces'
import { toSeoSafeHref } from '@/utils/seo-hide'

export default function PartnerCard({ partner }: PartnerCardProps) {
	if (!partner.logo) {
		return null
	}

	const content = (
		<Image
			src={partner.logo}
			alt={partner.alt || `Партнер ${partner.id}`}
			width={118}
			height={40}
			className='object-contain w-23.5 h-8 1440:w-29.5 1440:h-10'
			unoptimized={partner.logo.endsWith('.svg')}
		/>
	)

	if (partner.link) {
		const seoSafeHref = toSeoSafeHref(partner.link)

		if (!seoSafeHref) {
			return (
				<div className='w-full h-full flex items-center justify-center 1440:py-12 1440:px-14 py-8 px-10'>
					{content}
				</div>
			)
		}

		return (
			<a
				href={seoSafeHref}
				target='_blank'
				rel='nofollow noopener noreferrer'
				className='w-full h-full flex items-center justify-center hover:opacity-80 transition-opacity 1440:py-12 1440:px-14 py-8 px-10'
			>
				{content}
			</a>
		)
	}

	return (
		<div className='w-full h-full flex items-center justify-center 1440:py-12 1440:px-14 py-8 px-10'>
			{content}
		</div>
	)
}
