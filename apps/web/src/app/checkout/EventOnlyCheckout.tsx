'use client'

import { useCheckoutPadding } from '@/hooks/useCheckoutPadding'
import BreadCrumbs from '@/components/Profile/BreadCrumbs'
import CheckoutPaymentMethods from './CheckoutPaymentMethods'
import CheckoutTermsAndSubmit from './CheckoutTermsAndSubmit'
import { formatDateFull, formatTime } from '@/utils/formatDate'
import { formatPrice } from '@/utils/formatPrice'
import Image from 'next/image'
import type { EventOnlyCheckoutProps } from './types'

export type { EventOnlyCheckoutProps } from './types'

export default function EventOnlyCheckout({
	event,
	firstEventItem,
	price,
	location,
	sideLabel,
	setEventSide,
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
}: EventOnlyCheckoutProps) {
	const pad = useCheckoutPadding()
	const eventStartDate = event.gameStartDate ?? event.startDate
	return (
		<div className='bg-black text-white overflow-x-hidden'>
			<BreadCrumbs title='Оформлення замовлення' />

			<div className='w-full' style={{ padding: `${pad.y}px ${pad.x}px` }}>
				<div className='grid grid-cols-1 min991:grid-cols-2 gap-6 sm:gap-8 min991:gap-16'>
					<div>
						<div className='relative w-full aspect-video min-h-50 sm:min-h-0'>
							<Image
								src={event.image}
								alt={event.name}
								fill
								className='object-cover'
								sizes='(max-width: 991px) 100vw, 50vw'
								priority
							/>
						</div>

						<div className='mt-4 sm:mt-6'>
							{sideLabel ? (
								<div className='text-xs uppercase text-white/60 mb-2'>
									Вибрана сторона
								</div>
							) : null}

							{event.sides?.length ? (
								<div className='flex flex-wrap gap-2'>
									{event.sides.map((s) => {
										const active = firstEventItem.eventSideId === s.id
										return (
											<button
												key={s.id}
												type='button'
												onClick={() => {
													setEventSide(firstEventItem.id, s.id)
													setError(null)
												}}
												className={`px-2.5 py-1.5 sm:px-3 sm:py-2 uppercase text-xs font-semibold border ${
													active
														? 'bg-[#FA4616] border-[#FA4616] text-white'
														: 'border-white/40 text-white/80 hover:border-white'
												}`}
											>
												{s.name}
											</button>
										)
									})}
								</div>
							) : null}

							<h1 className='mt-4 sm:mt-6 uppercase font-semibold text-lg sm:text-xl min991:text-4xl'>
								{event.name}
							</h1>

							<div className='mt-3 sm:mt-4 text-xs sm:text-sm text-white/80 flex flex-col gap-2'>
								<div>
									<span className='text-white/60'>Дата:</span>{' '}
									{formatDateFull(eventStartDate)}
								</div>
								<div>
									<span className='text-white/60'>Час:</span>{' '}
									{formatTime(eventStartDate)}
								</div>
								{location ? (
									<div>
										<span className='text-white/60'>Місце:</span> {location}
									</div>
								) : null}
							</div>
						</div>
					</div>

					<div className='flex items-start justify-center w-full min991:w-auto'>
						<div className='w-full max-w-full min991:max-w-110 min-h-48 sm:min-h-64 min991:min-h-115 border border-white p-4 sm:p-6 min991:p-10 bg-black/40 flex flex-col'>
							<p className='text-lg sm:text-xl min991:text-2xl font-bold mb-4 sm:mb-6'>Ваше замовлення</p>

							<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 sm:mb-6 min991:mb-10'>
								<p className='text-sm sm:text-base min991:text-xl font-bold text-white'>Реєстрація на гру:</p>
								<p className='text-[#FA4616] font-bold text-lg sm:text-xl min991:text-2xl'>
									{formatPrice(price, 0)} грн
								</p>
							</div>

							{teamEventItems.length > 0 ? (
								<div className='mb-6 text-left'>
									<div className='text-white mb-3'>Команда для реєстрації:</div>
									{teamsLoading ? (
										<p className='text-gray-400 text-sm'>Завантаження команд...</p>
									) : teamsError ? (
										<p className='text-red-500 text-sm'>{teamsError}</p>
									) : availableTeams.length === 0 ? (
										<p className='text-gray-400 text-sm'>
											Немає команд, де ви є власником
										</p>
									) : (
										<div className='flex flex-col gap-3'>
											{teamEventItems.map((item) => {
												const eventTitle = item.event?.name || 'події'
												const selectLabel = `Оберіть команду для ${eventTitle}`
												const selectId = `event-team-select-${item.id}`

												return (
													<div key={item.id} className='flex flex-col gap-2'>
														<p className='text-gray-400 text-sm uppercase'>
															{item.event?.name}
														</p>
														<label htmlFor={selectId} className='sr-only'>
															{selectLabel}
														</label>
														<select
															id={selectId}
															title={selectLabel}
															aria-label={selectLabel}
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
															className='w-full px-4 py-2 bg-gray-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-[#FA4616]'
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
													</div>
												)
											})}
										</div>
									)}
								</div>
							) : null}

							<div className='mb-4 sm:mb-6'>
								<p className='text-xs sm:text-sm uppercase text-[#999999] mb-3 sm:mb-4'>Спосіб оплати:</p>
								<CheckoutPaymentMethods
									paymentMethod={paymentMethod}
									setPaymentMethod={setPaymentMethod}
									allowedPaymentMethods={allowedPaymentMethods}
									variant='bordered'
								/>
							</div>

							<CheckoutTermsAndSubmit
								agreeTerms={agreeTerms}
								setAgreeTerms={setAgreeTerms}
								setError={setError}
								onSubmit={handleCheckout}
								error={error}
								disabled={!agreeTerms || (teamEventItems.length > 0 && availableTeams.length === 0)}
								className='mt-auto'
								buttonFullWidth
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
