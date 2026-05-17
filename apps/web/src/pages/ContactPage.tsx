import ContactCard from '@/components/ContactCard/ContactCard'
import TitleBlock from '@/components/TitleBlock/TitleBlock'
import SeoTextBlock from '@/components/seo/SeoTextBlock'
import { getCities } from '@/actions/cities'
import { getResolvedContactsPageData } from '@/utils/contacts-page-data'
import Link from 'next/link'

const getCityWord = (count: number): string => {
	const mod10 = count % 10
	const mod100 = count % 100

	if (mod10 === 1 && mod100 !== 11) return 'місто'
	if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'міста'
	return 'міст'
}

const ContactPage = async () => {
	const [{ contacts, title, subtitle, seoText }, cities] = await Promise.all([
		getResolvedContactsPageData(),
		getCities(),
	])

	const cityBySlug = new Map(cities.map(city => [city.slug, city]))
	const regionMap = new Map<
		string,
		{
			name: string
			slug: string
			cities: Array<{ slug: string; name: string; href: string }>
		}
	>()

	contacts.forEach(contact => {
		const city = cityBySlug.get(contact.citySlug)
		if (!city?.region?.slug || !city.region.name) return

		if (!regionMap.has(city.region.slug)) {
			regionMap.set(city.region.slug, {
				name: city.region.name,
				slug: city.region.slug,
				cities: [],
			})
		}

		const region = regionMap.get(city.region.slug)
		if (!region) return

		if (!region.cities.some(item => item.slug === contact.citySlug)) {
			region.cities.push({
				slug: contact.citySlug,
				name: contact.city,
				href: contact.cityHref,
			})
		}
	})

	const regions = Array.from(regionMap.values())
		.map(region => ({
			...region,
			cities: region.cities.sort((left, right) => left.name.localeCompare(right.name, 'uk')),
		}))
		.sort((left, right) => left.name.localeCompare(right.name, 'uk'))

	if (!contacts.length) {
		return <p className='text-center text-gray-400 py-10'>Завантаження...</p>
	}
	return (
		<div className='h-full'>
			<TitleBlock
				title={title}
				subtitle={subtitle}
				path={[{ label: 'Головна', href: '/' }, { label: 'Контакти' }]}
			/>

			<div className='flex flex-wrap'>
				{contacts.map((contact, index) => (
					<ContactCard key={index} {...contact} />
				))}
			</div>

			{regions.length > 0 ? (
				<section className='px-4 min991:px-20 py-12 border-y border-white/15 bg-white/2'>
					<div className='mx-auto max-w-7xl'>
						<p className='text-xs tracking-widest text-gray-400 uppercase'>Регіональна навігація</p>
						<h2 className='mt-3 text-2xl min991:text-3xl'>Регіони та міста</h2>
						<p className='mt-3 text-gray-300 max-w-3xl leading-relaxed'>
							Оберіть область, щоб швидко перейти до локальної сторінки та переглянути міста, у
							яких доступні контакти.
						</p>

						<div className='mt-8 grid gap-4 min-[900px]:grid-cols-2'>
							{regions.map(region => (
								<article
									key={region.slug}
									className='rounded-xl border border-white/15 bg-black/20 p-5 min991:p-6'
								>
									<div className='flex items-center justify-between gap-4'>
										<div>
											<Link
												href={`/regions/${region.slug}`}
												className='text-lg min991:text-xl font-medium hover:underline'
											>
												{region.name}
											</Link>
											<p className='mt-1 text-xs uppercase tracking-wide text-gray-400'>
												{region.cities.length} {getCityWord(region.cities.length)}
											</p>
										</div>
										<Link
											href={`/regions/${region.slug}`}
											className='text-xs uppercase tracking-wide text-gray-300 hover:text-white whitespace-nowrap'
										>
											Усі міста {'->'}
										</Link>
									</div>

									<ul className='mt-4 grid gap-2 min-[480px]:grid-cols-2'>
										{region.cities.slice(0, 6).map(city => (
											<li key={city.slug}>
												<Link
													href={city.href}
													className='text-sm text-gray-200 hover:text-white hover:underline'
												>
													{city.name}
												</Link>
											</li>
										))}
									</ul>
								</article>
							))}
						</div>
					</div>
				</section>
			) : null}

			<SeoTextBlock text={seoText} className='min991:px-20' />
		</div>
	)
}

export default ContactPage
