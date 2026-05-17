'use client'

import { useCheckoutPadding } from '@/hooks/useCheckoutPadding'
import BreadCrumbs from '@/components/Profile/BreadCrumbs'
import CheckoutPaymentMethods from './CheckoutPaymentMethods'
import CheckoutTermsAndSubmit from './CheckoutTermsAndSubmit'
import { formatDateShort } from '@/utils/formatDate'
import { formatPrice } from '@/utils/formatPrice'
import Image from 'next/image'
import type { MixedCheckoutProps } from './types'

export type { MixedCheckoutProps } from './types'

export default function MixedCheckout({
	items,
	getTotalPrice,
	setError,
	handleCheckout,
	error,
	agreeTerms,
	setAgreeTerms,
	paymentMethod,
	setPaymentMethod,
	allowedPaymentMethods,
	teamEventItems,
	teamSelections,
	setTeamSelections,
	availableTeams,
	teamsLoading,
	teamsError,
}: MixedCheckoutProps) {
	const pad = useCheckoutPadding()
	return (
		<div className='bg-black text-white overflow-x-hidden'>
			<BreadCrumbs title='Оформлення замовлення' />

			<div className='w-full uppercase' style={{ padding: `${pad.y}px ${pad.x}px` }}>
				<h1 className='text-white text-lg sm:text-xl min991:text-2xl font-semibold mb-6 sm:mb-8'>Ваше замовлення</h1>

				<div className='space-y-6'>
					{items.map((item) => {
						if (item.eventId != null && item.event) {
							const event = item.event
							const eventStartDate = event.gameStartDate ?? event.startDate
							const location = [event.city?.name, event.address].filter(Boolean).join(', ')
							const side = event.sides?.find((s) => s.id === item.eventSideId)
							const details = [
								formatDateShort(eventStartDate),
								event.city?.region?.name,
								location,
							].filter(Boolean).join(' • ')

							return (
								<div
									key={item.id}
									className='flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6'
								>
									<div className='relative w-full sm:w-20 min991:w-24 h-14 sm:h-16 shrink-0 rounded overflow-hidden'>
										<Image
											src={event.image}
											alt={event.name}
											fill
											className='object-cover'
											sizes='(max-width: 640px) 100vw, (max-width: 990px) 80px, 96px'
										/>
									</div>
									<div className='flex-1 min-w-0'>
										<p className='font-bold text-base sm:text-lg text-white mb-1'>{event.name}</p>
										<p className='text-xs sm:text-sm font-normal text-[#999999]'>{details}</p>
										{side ? (
											<div className='text-sm text-white/60'>
												<p>Вибрана сторона:</p>
												<span className='inline-block mt-1 px-2 py-0.5 bg-[#FA4616] text-white text-xs uppercase'>
													{side.name}
												</span>
											</div>
										) : null}
									</div>
									<div className='flex flex-col items-start sm:items-end min-w-0 sm:min-w-40 shrink-0'>
										{item.event?.competitionType === 'TEAM' && (
											<select
												title='Оберіть команду для участі в події'
												aria-label='Оберіть команду для участі в події'
												value={item.eventId ? teamSelections[item.eventId] ?? '' : ''}
												onChange={(e) => {
													const selected = Number(e.target.value)
													if (item.eventId == null || Number.isNaN(selected)) return
													setTeamSelections((prev) => ({
														...prev,
														[item.eventId!]: selected,
													}))
													setError(null)
												}}
												className='px-3 py-1.5 bg-gray-800 text-white text-sm rounded focus:outline-none focus:ring-2 focus:ring-[#FA4616] w-full sm:w-auto'
											>
												<option value='' disabled>
													Оберіть команду
												</option>
												{availableTeams.map((team) => (
													<option key={team.id} value={team.id}>
														{team.name}
													</option>
												))}
											</select>
										)}
										<p className='flex flex-wrap items-center justify-start sm:justify-end gap-2 sm:gap-3 mt-1'>
											<span className='text-sm sm:text-base min991:text-xl text-white font-bold normal-case'>Реєстрація на гру:</span>
											<span className='text-base sm:text-lg min991:text-2xl text-[#FA4616] font-semibold'>
												{formatPrice(item.price * item.quantity, 0)} грн
											</span>
										</p>
									</div>
								</div>
							)
						}
						if (item.productId != null && item.product) {
							const product = item.product
							const details = `Кількість: х${item.quantity} • Ціна за од.: ${formatPrice(product.price, 0)} грн`

							return (
								<div
									key={item.id}
									className='flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6'
								>
									<div className='relative w-full sm:w-20 min991:w-24 h-14 sm:h-16 shrink-0 rounded overflow-hidden'>
										<Image
											src={product.image}
											alt={product.name}
											fill
											className='object-cover'
											sizes='(max-width: 640px) 100vw, (max-width: 990px) 80px, 96px'
										/>
									</div>
									<div className='flex-1 min-w-0'>
										<p className='font-bold text-base sm:text-lg text-white mb-1'>{product.name}</p>
										<p className='text-xs sm:text-sm font-normal text-[#999999]'>{details}</p>
									</div>
									<div className='flex flex-col items-start sm:items-end min-w-0 sm:min-w-40 shrink-0'>
										<p className='text-white font-semibold text-lg sm:text-xl'>
											{formatPrice(item.price * item.quantity, 0)} грн
										</p>
									</div>
								</div>
							)
						}
						return null
					})}
				</div>

				<div className='border-t border-white/30 mt-6 sm:mt-8 pt-6 sm:pt-8 pb-6 sm:pb-8 flex flex-row items-center justify-between gap-4'>
					<p className='text-white text-xl sm:text-2xl min991:text-3xl font-normal'>Всього:</p>
					<p className='text-[#FA4616] font-semibold text-xl sm:text-2xl min991:text-3xl'>
						{formatPrice(getTotalPrice(), 0)} грн
					</p>
				</div>

				{teamEventItems.length > 0 && (
					<div className='mb-6'>
						{teamsLoading && (
							<p className='text-gray-400 text-sm'>Завантаження команд...</p>
						)}
						{teamsError && (
							<p className='text-red-500 text-sm'>{teamsError}</p>
						)}
						{!teamsLoading && availableTeams.length === 0 && !teamsError && (
							<p className='text-gray-400 text-sm'>
								Немає команд, де ви є власником
							</p>
						)}
					</div>
				)}
				<div className='mt-6 sm:mt-8'>
					<p className='text-xs sm:text-sm uppercase text-[#999999] mb-3 sm:mb-4'>Спосіб оплати:</p>
					<CheckoutPaymentMethods
						paymentMethod={paymentMethod}
						setPaymentMethod={setPaymentMethod}
						allowedPaymentMethods={allowedPaymentMethods}
					/>
				</div>

				<CheckoutTermsAndSubmit
					agreeTerms={agreeTerms}
					setAgreeTerms={setAgreeTerms}
					setError={setError}
					onSubmit={handleCheckout}
					error={error}
					disabled={!agreeTerms || (teamEventItems.length > 0 && availableTeams.length === 0)}
					className='flex w-full flex-col items-center mt-6 sm:mt-8'
				/>
			</div>
		</div>
	)
}
