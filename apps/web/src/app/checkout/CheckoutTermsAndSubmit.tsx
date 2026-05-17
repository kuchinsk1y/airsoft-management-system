'use client'

interface CheckoutTermsAndSubmitProps {
	agreeTerms: boolean
	setAgreeTerms: (v: boolean) => void
	setError: (err: string | null) => void
	onSubmit: () => void
	error: string | null
	disabled: boolean
	className?: string
	buttonFullWidth?: boolean
	showLiqPayBranding?: boolean
}

export default function CheckoutTermsAndSubmit({
	agreeTerms,
	setAgreeTerms,
	setError,
	onSubmit,
	error,
	disabled,
	className = '',
	buttonFullWidth = false,
	showLiqPayBranding = false,
}: CheckoutTermsAndSubmitProps) {
	return (
		<div className={className}>
			<label className='flex items-center gap-3 text-xs text-[#999999] select-none max-w-md'>
				<input
					type='checkbox'
					checked={agreeTerms}
					onChange={(e) => {
						setAgreeTerms(e.target.checked)
						setError(null)
					}}
					className='shrink-0'
				/>
				<span>
					Я згоден з{' '}
					<a href='/rules' className='underline hover:text-white'>
						правилами участі
					</a>{' '}
					та публічною офертою
				</span>
			</label>

			{error ? (
				<p className='text-[#FA4616] text-xs mt-4 uppercase'>{error}</p>
			) : null}

			<button
				onClick={onSubmit}
				disabled={disabled}
				type='button'
				className={`${buttonFullWidth ? 'w-full' : 'w-full sm:w-auto'} px-6 sm:px-12 py-3 sm:py-4 uppercase font-bold text-sm sm:text-base border-none mt-4 sm:mt-6 ${
					disabled ? 'bg-[#727272] text-[#999999] cursor-not-allowed' : 'bg-[#FA4616] text-white'
				}`}
			>
				Оформити замовлення
			</button>
		</div>
	)
}
