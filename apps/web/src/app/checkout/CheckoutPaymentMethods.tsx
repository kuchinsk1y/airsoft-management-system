'use client'

import type { PaymentMethod } from './types'

interface CheckoutPaymentMethodsProps {
	paymentMethod: PaymentMethod
	setPaymentMethod: (m: PaymentMethod) => void
	allowedPaymentMethods: PaymentMethod[]
	variant?: 'default' | 'bordered'
}

export default function CheckoutPaymentMethods({
	paymentMethod,
	setPaymentMethod,
	allowedPaymentMethods,
	variant = 'default',
}: CheckoutPaymentMethodsProps) {
	const btnBase = 'py-2.5 sm:py-3 uppercase text-xs sm:text-sm font-bold'
	const btnActive = variant === 'bordered'
		? 'bg-[#FA4616] border-[#FA4616] text-white border'
		: 'bg-[#FA4616] text-white border-none'
	const btnInactive = variant === 'bordered'
		? 'bg-white/10 border-white/20 text-[#999999] hover:text-white border'
		: 'bg-white/10 text-[#999999] hover:text-white border-none'
	const disabled = 'opacity-30 pointer-events-none'

	return (
		<div className='grid grid-cols-2 gap-2 sm:gap-3'>
			<button
				type='button'
				onClick={() => setPaymentMethod('BANK')}
				disabled={!allowedPaymentMethods.includes('BANK')}
				className={`${btnBase} ${paymentMethod === 'BANK' ? btnActive : btnInactive} ${!allowedPaymentMethods.includes('BANK') ? disabled : ''}`}
			>
				Оплата картою
			</button>
			<button
				type='button'
				onClick={() => setPaymentMethod('CASH')}
				disabled={!allowedPaymentMethods.includes('CASH')}
				className={`${btnBase} ${paymentMethod === 'CASH' ? btnActive : btnInactive} ${!allowedPaymentMethods.includes('CASH') ? disabled : ''}`}
			>
				Готівка
			</button>
		</div>
	)
}
