'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useCartStore } from '@/stores/cartStore'

export default function PaymentResultClient() {
	const searchParams = useSearchParams()
	const router = useRouter()
	const { clearCart } = useCartStore()
	const [status, setStatus] = useState<'loading' | 'success' | 'failure'>(
		'loading'
	)
	const [message, setMessage] = useState('')
	const [orderId, setOrderId] = useState<string | null>(null)

	useEffect(() => {
		if (!searchParams) {
			setStatus('failure')
			setMessage('Не вдалося отримати дані про платіж')
			return
		}

		const data = searchParams.get('data')

		if (!data) {
			setStatus('failure')
			setMessage('Не вдалося отримати дані про платіж')
			return
		}

		try {
			const decoded = JSON.parse(atob(data))
			const { status: paymentStatus, order_id } = decoded
			setOrderId(order_id ? String(order_id) : null)

			if (paymentStatus === 'success' || paymentStatus === 'sandbox') {
				setStatus('success')
				setMessage(
					'Платіж успішно виконано. Якщо ви реєструвалися на подію — перевірте пошту (вхідні та «Спам»).'
				)
				clearCart()
			} else if (paymentStatus === 'failure' || paymentStatus === 'error') {
				setStatus('failure')
				setMessage('Платіж не вдалося виконати')
			} else {
				setStatus('loading')
				setMessage('Платіж обробляється...')
			}
		} catch (error) {
			setStatus('failure')
			setMessage('Помилка при обробці даних платежу')
		}
	}, [searchParams, clearCart])

	return (
		<div className='flex items-center justify-center min-h-screen bg-background'>
			<div className='text-center max-w-md mx-auto p-6'>
				{status === 'loading' && (
					<>
						<div className='animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4'></div>
						<div className='text-white text-xl mb-4'>
							{message || 'Обробка платежу...'}
						</div>
					</>
				)}

				{status === 'success' && (
					<>
						<div className='text-green-500 text-6xl mb-4'>✓</div>
						<h1 className='text-white text-2xl font-bold mb-4'>
							Платіж успішний!
						</h1>
						{orderId && (
							<p className='text-white/80 mb-2'>Замовлення: #{orderId}</p>
						)}
						<p className='text-white mb-6'>{message}</p>
						<div className='flex flex-wrap gap-3 justify-center'>
							<button
								onClick={() => router.push('/profile')}
								className='bg-[#FA4616] text-white px-8 py-3 rounded uppercase font-semibold'
							>
								Профіль
							</button>
							<button
								onClick={() => router.push('/rental')}
								className='bg-gray-700 text-white px-8 py-3 rounded uppercase font-semibold'
							>
								Спорядження
							</button>
							<button
								onClick={() => router.push('/events')}
								className='bg-gray-700 text-white px-8 py-3 rounded uppercase font-semibold'
							>
								Усі івенти
							</button>
						</div>
					</>
				)}

				{status === 'failure' && (
					<>
						<div className='text-red-500 text-6xl mb-4'>✗</div>
						<h1 className='text-white text-2xl font-bold mb-4'>
							Помилка платежу
						</h1>
						<p className='text-white mb-6'>{message}</p>
						<div className='flex gap-4 justify-center'>
							<button
								onClick={() => router.push('/rental')}
								className='bg-gray-600 text-white px-6 py-3 rounded uppercase font-semibold'
							>
								До каталогу
							</button>
							<button
								onClick={() => router.push('/checkout')}
								className='bg-[#FA4616] text-white px-6 py-3 rounded uppercase font-semibold'
							>
								Спробувати ще раз
							</button>
						</div>
					</>
				)}
			</div>
		</div>
	)
}

