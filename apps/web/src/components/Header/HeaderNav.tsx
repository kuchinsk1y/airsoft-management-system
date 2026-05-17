'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getLinkWithRegion } from '@/utils/url';
import { ChevronDown, Plus } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type MenuItemLink = {
	label: string
	href?: string
}

type MenuItem = {
	title: string
	items?: MenuItemLink[]
	href?: string
}

export const menuItems: MenuItem[] = [
	{
		title: 'Календар подій',
		items: [
			{ label: 'Всі події', href: '/events' },
			{ label: 'Гра вихідного дня', href: '/weekend-game' },
			{ label: 'Архів подій', href: '/events/archive' },
		],
	},
	{
		title: 'Послуги',
		items: [
			{ label: 'Прокат спорядження', href: '/rental' },
			{ label: 'Майстерня', href: '/workshop' },
		],
	},
	{
		title: 'Інформація',
		items: [
			{ label: 'Що таке страйкбол', href: '/what-is-airsoft' },
			{ label: 'Типи ігор', href: '/game-types' },
			{ label: 'Правила гри', href: '/rules' },
			{ label: 'Рейтинги', href: '/ratings'  },
			{ label: 'Оплата і Доставка', href: '/payment-delivery' },
			{ label: 'Про компанію', href: '/about' },
			{ label: 'Галерея', href: '/gallery' },
		],
	},
	{
		title: 'Новини',
		href: '/news',
	},
	{
		title: 'Контакти',
		items: [],
		href: '/contacts',
	},
]

export function HeaderNav() {
  const searchParams = useSearchParams();
  const regionSlug = searchParams?.get('region') ?? null;
	const [hiddenTitles, setHiddenTitles] = useState<string[]>([]);

	useEffect(() => {
		const updateLayout = () => {
			const width = window.innerWidth;
			if (width < 1110) {
				setHiddenTitles(['Інформація', 'Новини', 'Контакти']);
				return;
			}

			if (width < 1240) {
				setHiddenTitles(['Новини', 'Контакти']);
				return;
			}

			if (width < 1350) {
				setHiddenTitles(['Контакти']);
				return;
			}

			setHiddenTitles([]);
		};

		updateLayout();
		window.addEventListener('resize', updateLayout);
		return () => window.removeEventListener('resize', updateLayout);
	}, []);

	const visibleItems = menuItems.filter(item => !hiddenTitles.includes(item.title));
	const hiddenItems = menuItems.filter(item => hiddenTitles.includes(item.title));

	const renderMenuLink = (item: MenuItemLink) => {
		if (!item.href) {
			return (
				<span className='cursor-default px-2 py-1 rounded-sm text-gray-500'>
					{item.label}
				</span>
			)
		}

		return (
			<Link
				href={getLinkWithRegion(item.href, regionSlug)}
				className='cursor-pointer hover:bg-gray-100 transition px-2 py-1 rounded-sm'
			>
				{item.label}
			</Link>
		)
	}

	return (
		<nav className='flex items-center gap-3 min-[1280px]:gap-4 min-[1450px]:gap-6 text-sm text-gray-300 px-2 min-[1280px]:px-4 min-[1450px]:px-6'>
			{visibleItems.map(menu =>
				menu.items?.length ? (
					<DropdownMenu key={menu.title}>
						<DropdownMenuTrigger asChild>
							<button className='flex items-center gap-1 hover:text-white transition outline-none focus:outline-none focus-visible:outline-none whitespace-nowrap'>
								{menu.title}
								<ChevronDown className='w-4 h-4' />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className='bg-white text-black border border-gray-200 mt-2 rounded-md shadow-md'>
							{menu.items.map(item => (
								<DropdownMenuItem key={item.label} asChild>
									{renderMenuLink(item)}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				) : menu.href ? (
					<Link
						key={menu.title}
						href={getLinkWithRegion(menu.href, regionSlug)}
						className='hover:text-white transition whitespace-nowrap'
					>
						{menu.title}
					</Link>
				) : (
					<span key={menu.title} className='whitespace-nowrap text-gray-500'>{menu.title}</span>
				)
			)}

			{hiddenItems.length > 0 && (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							className='items-center gap-1 hover:text-white transition hidden min991:flex outline-none focus:outline-none focus-visible:outline-none'
							aria-label='Показати додаткові розділи'
							title='Показати додаткові розділи'
						>
							<Plus className='w-5 h-5' />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent className='bg-white text-black border border-gray-200 mt-2 rounded-md shadow-md'>
						{hiddenItems.map(menu =>
							menu.items?.length ? (
								<DropdownMenu key={menu.title}>
									<DropdownMenuTrigger asChild>
										<button className='w-full text-left px-2 py-1 hover:bg-gray-100 rounded-sm flex items-center justify-between outline-none focus:outline-none focus-visible:outline-none'>
											{menu.title}
											<ChevronDown className='w-4 h-4' />
										</button>
									</DropdownMenuTrigger>

									<DropdownMenuContent className='bg-white text-black border border-gray-200 mt-2 rounded-md shadow-md'>
										{menu.items.map(item => (
											<DropdownMenuItem key={item.label} asChild>
													{renderMenuLink(item)}
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
							) : (
								<DropdownMenuItem key={menu.title}>
									{menu.href ? (
										<Link
											href={getLinkWithRegion(menu.href, regionSlug)}
											className='cursor-pointer hover:bg-gray-100 transition px-2 py-1 rounded-sm whitespace-nowrap w-full block'
										>
											{menu.title}
										</Link>
									) : (
										<span className='px-2 py-1 whitespace-nowrap text-gray-400 block'>{menu.title}</span>
									)}
								</DropdownMenuItem>
							)
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			)}
		</nav>
	)
}
