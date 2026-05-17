'use client'

import { createOrder } from '@/actions/orders'
import { useUser } from '@/contexts/UserContext'
import { useCartStore } from '@/stores/cartStore'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function CheckoutClient() {
	const router = useRouter()
	const { user, isLoading: userLoading } = useUser()
	const { items, getTotalPrice, clearCart } = useCartStore()
	const [isProcessing, setIsProcessing] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!userLoading && !user) {
			router.push('/login')
			return
		}

		if (!userLoading && user && items.length === 0) {
			router.push('/rental')
			return
		}

		if (user && items.length > 0 && !isProcessing && !error) {
			handleCheckout()
		}
	}, [user, userLoading, items.length, router])

	const handleCheckout = async () => {
		if (!user || items.length === 0 || isProcessing) return

		setIsProcessing(true)
		setError(null)

		const result = await createOrder(items)

		if (!result.ok) {
			setError(result.error)
			setIsProcessing(false)
			return
		}

		const paymentData = result.data
		if (paymentData.paymentMethod === 'CASH' || !paymentData.data || !paymentData.signature) {
			clearCart()
			router.push(`/orders/${paymentData.orderId}?success=true`)
			return
		}

		const form = document.createElement('form')
		form.method = 'POST'
		form.action = 'https://www.liqpay.ua/api/3/checkout'
		form.style.display = 'none'

		const dataInput = document.createElement('input')
		dataInput.type = 'hidden'
		dataInput.name = 'data'
		dataInput.value = paymentData.data
		form.appendChild(dataInput)

		const signatureInput = document.createElement('input')
		signatureInput.type = 'hidden'
		signatureInput.name = 'signature'
		signatureInput.value = paymentData.signature
		form.appendChild(signatureInput)

		document.body.appendChild(form)
		form.submit()
		setIsProcessing(false)
	}

	if (userLoading || isProcessing) {
		return (
			<div className='flex items-center justify-center min-h-screen bg-background'>
				<div className='text-center'>
					<div className='text-white text-xl mb-4'>Обробка замовлення...</div>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto'></div>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className='flex items-center justify-center min-h-screen bg-background'>
				<div className='text-center max-w-md mx-auto p-6'>
					<div className='text-red-500 text-xl mb-4'>{error}</div>
					<button
						onClick={() => router.push('/rental')}
						className='bg-[#FA4616] text-white px-6 py-3 rounded uppercase font-semibold'
					>
						Повернутися до каталогу
					</button>
				</div>
			</div>
		)
	}

	return null
}
