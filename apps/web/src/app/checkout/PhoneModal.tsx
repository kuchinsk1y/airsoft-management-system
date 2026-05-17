'use client'

interface PhoneModalProps {
	phoneNumber: string
	onPhoneChange: (value: string) => void
	phoneError: string | null
	onSave: () => void
	onCancel: () => void
	isSaving: boolean
}

export default function PhoneModal({
	phoneNumber,
	onPhoneChange,
	phoneError,
	onSave,
	onCancel,
	isSaving,
}: PhoneModalProps) {
	return (
		<div className='fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4'>
			<div className='bg-gray-900 rounded-lg p-4 sm:p-6 max-w-md w-full'>
				<h2 className='text-white text-xl mb-4'>Введіть номер телефону</h2>
				<p className='text-gray-400 text-sm mb-4'>
					Для оформлення замовлення необхідно вказати номер телефону
				</p>
				<input
					type='tel'
					value={phoneNumber}
					onChange={(e) => onPhoneChange(e.target.value)}
					placeholder='+380123456789'
					className='w-full px-4 py-2 bg-gray-800 text-white rounded mb-2 focus:outline-none focus:ring-2 focus:ring-[#FA4616]'
				/>
				{phoneError && (
					<p className='text-red-500 text-sm mb-4'>{phoneError}</p>
				)}
				<div className='flex gap-3'>
					<button
						onClick={onSave}
						disabled={isSaving}
						className='flex-1 bg-[#FA4616] text-white px-4 py-2 rounded uppercase font-semibold disabled:opacity-50'
					>
						{isSaving ? 'Збереження...' : 'Зберегти'}
					</button>
					<button
						onClick={onCancel}
						className='px-4 py-2 bg-gray-700 text-white rounded uppercase font-semibold'
					>
						Скасувати
					</button>
				</div>
			</div>
		</div>
	)
}
