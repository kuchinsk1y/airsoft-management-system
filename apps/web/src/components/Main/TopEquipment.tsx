'use client'

import ArrowSection from '../ArrowSection/ArrowSection'
import { getProducts } from '@/actions/products'
import ProductCard from '@/components/generics/productCard/ProductCard'
import { useUser } from '@/contexts/UserContext'
import { DealType, Product } from '@/interfaces'
import { useCartStore } from '@/stores/cartStore'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

type TopEquipmentProps = {
	initialProducts?: Product[]
	initialRegionSlug?: string
}

export default function TopEquipment({
	initialProducts = [],
	initialRegionSlug,
}: TopEquipmentProps) {
	const { user } = useUser()
	const router = useRouter()
	const searchParams = useSearchParams()
	const regionSlug = searchParams?.get('region') || undefined
	const addItem = useCartStore(state => state.addItem)
	const [products, setProducts] = useState<Product[]>(initialProducts)

	useEffect(() => {
		const loadProducts = async () => {
			if (regionSlug === initialRegionSlug && initialProducts.length > 0) {
				setProducts(initialProducts)
				return
			}

			const fetchedProducts = await getProducts({
				regionSlug,
				dealType: DealType.RENT,
				isActive: true,
			})
			setProducts(fetchedProducts.slice(0, 4))
		}

		loadProducts()
	}, [regionSlug, initialRegionSlug, initialProducts])

	const handleAddToCart = (product: Product) => {
		if (!user) {
			router.push('/login')
			return
		}
		addItem(product, 1)
	}

	if (!products || products.length === 0) {
		return null
	}
	return (
		<div className='flex flex-col border-b border-white'>
			<ArrowSection title='Топове обладнання' showArrows={false} />

			<div className='grid grid-cols-2 lg:grid-cols-4 gap-0 border-l border-r border-white'>
				{products.map((product, index) => {
					const isLastInRowMobile = index % 2 === 1
					const isLastInRowDesktop = index % 4 === 3

					return (
						<div
							key={product.id}
							className={`border-r border-white box-border md:border-r-0 ${
								isLastInRowMobile ? 'border-r-0' : ''
							} ${isLastInRowDesktop ? '[&>div]:lg:border-r-0' : ''} [&>div]:box-border [&>div]:375:gap-0 [&_div.relative]:h-44 [&_div.relative]:min376:h-[40vw] [&_div.relative]:lg:h-[20vw] [&_div.relative]:1440:h-87 [&_div.relative]:min1441:h-[20vw]`}
						>
							<ProductCard product={product} onAddToCart={handleAddToCart} regionSlug={regionSlug} />
						</div>
					)
				})}
			</div>
		</div>
	)
}
