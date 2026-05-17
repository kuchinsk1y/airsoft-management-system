'use client'

import { createOrder } from '@/actions/orders'
import { getMyTeamRole, getMyTeams } from '@/actions/teams'
import { updateUser } from '@/actions/user'
import { useUser } from '@/contexts/UserContext'
import { useCartStore } from '@/stores/cartStore'
import { usePathname, useRouter } from 'next/navigation'
import EventOnlyCheckout from './EventOnlyCheckout'
import MixedCheckout from './MixedCheckout'
import PhoneModal from './PhoneModal'
import { useCheckoutPadding } from '@/hooks/useCheckoutPadding'
import { useEffect, useMemo, useState } from 'react'

const allPaymentMethods: ('BANK' | 'CASH')[] = ['BANK', 'CASH']

function getAllowedPaymentMethods(
	items: { eventId?: number; event?: { paymentMethods?: ('BANK' | 'CASH')[] }; productId?: number }[]
): ('BANK' | 'CASH')[] {
	const eventItems = items.filter((i) => i.eventId != null && i.event != null)
	if (eventItems.length === 0) return allPaymentMethods
	const intersection = eventItems.reduce<('BANK' | 'CASH')[]>((acc, item) => {
		const methods = item.event!.paymentMethods?.length ? item.event!.paymentMethods! : allPaymentMethods
		return acc.filter((m) => methods.includes(m))
	}, allPaymentMethods)
	return intersection.length ? intersection : allPaymentMethods
}

export default function CheckoutForm() {
	const router = useRouter()
	const pathname = usePathname()
	const pad = useCheckoutPadding()
	const { user, loadUser, isLoading: isUserLoading } = useUser()
	const items = useCartStore((state) => state.items)
	const getTotalPrice = useCartStore((state) => state.getTotalPrice)
	const closeCart = useCartStore((state) => state.closeCart)
	const clearCart = useCartStore((state) => state.clearCart)
	const setEventSide = useCartStore((state) => state.setEventSide)
	const teamEventItems = useMemo(
		() =>
			items.filter(
				(item) =>
					item.eventId != null && item.event?.competitionType === 'TEAM'
			),
		[items]
	)
	const teamEventSignature = useMemo(
		() =>
			teamEventItems
				.map((item) => item.eventId)
				.filter((eventId): eventId is number => eventId != null)
				.sort((a, b) => a - b)
				.join(','),
		[teamEventItems],
	)
	const teamEventIds = useMemo(
		() =>
			teamEventSignature
				.split(',')
				.filter(Boolean)
				.map((value) => Number(value))
				.filter((value) => Number.isFinite(value)),
		[teamEventSignature],
	)
	const allowedPaymentMethods = useMemo(() => getAllowedPaymentMethods(items), [items])
	const defaultMethod = allowedPaymentMethods.includes('BANK') ? 'BANK' : 'CASH'
	const [isProcessing, setIsProcessing] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [paymentMethod, setPaymentMethod] = useState<'BANK' | 'CASH'>(defaultMethod)
	const [orderId, setOrderId] = useState<number | null>(null)
	const [completedPaymentMethod, setCompletedPaymentMethod] = useState<'BANK' | 'CASH' | null>(null)
	const [availableTeams, setAvailableTeams] = useState<Array<{ id: number; name: string }>>([])
	const [teamsLoading, setTeamsLoading] = useState(false)
	const [teamsError, setTeamsError] = useState<string | null>(null)
	const [teamSelections, setTeamSelections] = useState<Record<number, number>>({})
	const [completedOrderContext, setCompletedOrderContext] = useState<{
		hadEvents: boolean
		hadProducts: boolean
	} | null>(null)
	const [agreeTerms, setAgreeTerms] = useState(false)
	const [showPhoneModal, setShowPhoneModal] = useState(false)
	const [phoneNumber, setPhoneNumber] = useState('')
	const [phoneError, setPhoneError] = useState<string | null>(null)
	const [isSavingPhone, setIsSavingPhone] = useState(false)

	useEffect(() => {
		if (pathname === '/checkout') {
			closeCart()
		}
	}, [pathname, closeCart])

	useEffect(() => {
		if (user && !user.phoneNumber) {
			setShowPhoneModal(true)
		}
	}, [user])

	useEffect(() => {
		setPaymentMethod((current) =>
			allowedPaymentMethods.includes(current) ? current : defaultMethod
		)
	}, [allowedPaymentMethods, defaultMethod])

	useEffect(() => {
		const loadTeams = async () => {
			if (teamEventIds.length === 0) {
				setAvailableTeams([])
				setTeamsError(null)
				return
			}

			setTeamsLoading(true)
			setTeamsError(null)
			try {
				const teams = await getMyTeams()
				const teamsWithRole = await Promise.all(
					teams.map(async (team: { id: number; name: string }) => {
						const role = await getMyTeamRole(team.id)
						return role === 'owner' ? team : null
					})
				)
				const ownerTeams = teamsWithRole.filter(
					(team): team is { id: number; name: string } => team !== null
				)
				setAvailableTeams(ownerTeams)

				if (ownerTeams.length === 1) {
					const defaultTeamId = ownerTeams[0].id
					setTeamSelections((prev) => {
						const next = { ...prev }
						teamEventIds.forEach((eventId) => {
							if (next[eventId] == null) {
								next[eventId] = defaultTeamId
							}
						})
						return next
					})
				}
			} catch (err) {
				setTeamsError(
					err instanceof Error ? err.message : 'Не вдалося завантажити команди'
				)
			} finally {
				setTeamsLoading(false)
			}
		}

		loadTeams()
	}, [teamEventIds, teamEventSignature])

	useEffect(() => {
		if (!isUserLoading && items.length === 0 && !orderId && !isProcessing) {
			router.push('/profile')
		}
	}, [isUserLoading, items.length, orderId, isProcessing, router])

	if (isUserLoading) {
		return (
			<div className='flex items-center justify-center min-h-[50vh] sm:min-h-screen bg-background' style={{ padding: `${pad.y}px ${pad.x}px` }}>
				<div className='text-center'>
					<div className='text-white text-lg sm:text-xl min991:text-2xl mb-4 sm:mb-6'>Завантаження...</div>
					<div className='animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 min991:h-14 min991:w-14 border-b-2 border-white mx-auto' />
				</div>
			</div>
		)
	}

	if (items.length === 0 && !orderId && !isProcessing) {
		return null
	}

	const handleSavePhone = async () => {
		if (!phoneNumber.trim()) {
			setPhoneError('Введіть номер телефону')
			return
		}

		const phoneRegex = /^\+?380[0-9]{9}$/
		const normalizedPhone = phoneNumber.replace(/\s/g, '').replace(/^\+/, '')
		const fullPhone = normalizedPhone.startsWith('380') ? `+${normalizedPhone}` : `+380${normalizedPhone}`

		if (!phoneRegex.test(fullPhone)) {
			setPhoneError('Номер телефону повинен бути валідним українським номером (наприклад: +380123456789)')
			return
		}

		setIsSavingPhone(true)
		setPhoneError(null)

		try {
			const updatedUser = await updateUser({ phoneNumber: fullPhone })
			if (updatedUser) {
				await loadUser()
				setShowPhoneModal(false)
				setPhoneNumber('')
			} else {
				setPhoneError('Помилка при збереженні номера телефону')
			}
		} catch (err) {
			setPhoneError(err instanceof Error ? err.message : 'Помилка при збереженні номера телефону')
		} finally {
			setIsSavingPhone(false)
		}
	}

	const handleCheckout = async () => {
		if (items.length === 0 || isProcessing) return

		if (!agreeTerms) {
			setError('Підтвердіть згоду з правилами участі та публічною офертою')
			return
		}

		if (teamEventItems.length > 0) {
			if (teamsLoading) return
			if (availableTeams.length === 0) {
				setError('Для командних подій потрібна команда, в якій ви є власником')
				return
			}
			const missingTeam = teamEventItems.find(
				(item) => item.eventId != null && !teamSelections[item.eventId]
			)
			if (missingTeam) {
				setError('Оберіть команду для командної події у кошику')
				return
			}
		}

		if (!user?.phoneNumber) {
			setShowPhoneModal(true)
			return
		}

		setIsProcessing(true)
		setError(null)

		const itemsWithTeams = items.map((item) => {
			if (item.eventId == null) return item
			const teamId = teamSelections[item.eventId]
			return teamId ? { ...item, teamId } : item
		})

		const hadEvents = itemsWithTeams.some((i) => i.eventId != null)
		const hadProducts = itemsWithTeams.some((i) => i.productId != null)

		const result = await createOrder(itemsWithTeams, paymentMethod)

		if (!result.ok) {
			setError(result.error)
			setIsProcessing(false)
			return
		}

		const paymentData = result.data
		setCompletedOrderContext({ hadEvents, hadProducts })
		clearCart()

		if (paymentMethod === 'CASH') {
			setCompletedPaymentMethod('CASH')
			setOrderId(paymentData.orderId)
			setIsProcessing(false)
			return
		}

		setCompletedPaymentMethod('BANK')

		if (!paymentData.data || !paymentData.signature) {
			setError('Помилка при генерації даних для оплати')
			setIsProcessing(false)
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

	if (orderId) {
		const title = completedOrderContext?.hadEvents
			? 'Ви зареєстровані на подію!'
			: 'Замовлення оформлено!'
		const description = completedOrderContext?.hadEvents
			? completedPaymentMethod === 'CASH'
				? 'Перевірте пошту — ми надіслали підтвердження реєстрації. Оплата готівкою відбувається на місці.'
				: 'Перевірте пошту — ми надіслали підтвердження. Білет прийде після підтвердження оплати.'
			: 'Перевірте пошту — ми надіслали підтвердження замовлення.'

		return (
			<div className='flex items-center justify-center min-h-[50vh]' style={{ padding: `${pad.y}px ${pad.x}px` }}>
				<div className='text-center max-w-md mx-auto'>
					<div className='text-white text-xl sm:text-2xl min991:text-3xl mb-4 sm:mb-6'>{title}</div>
					<div className='text-white text-base sm:text-lg min991:text-xl mb-6'>
						Номер замовлення: {orderId}
					</div>
					<div className='text-white text-sm sm:text-base min991:text-lg mb-6 sm:mb-8'>{description}</div>
					<div className='flex flex-wrap gap-2 sm:gap-3 min991:gap-4 justify-center'>
						<button
							onClick={() => router.push('/profile')}
							className='bg-[#FA4616] text-white px-4 py-2.5 sm:px-6 sm:py-3 min991:px-8 min991:py-4 rounded uppercase font-semibold text-sm sm:text-base min991:text-lg'
						>
							Профіль
						</button>
						<button
							onClick={() => router.push('/rental')}
							className='bg-gray-700 text-white px-4 py-2.5 sm:px-6 sm:py-3 min991:px-8 min991:py-4 rounded uppercase font-semibold text-sm sm:text-base min991:text-lg'
						>
							Спорядження
						</button>
						<button
							onClick={() => router.push('/events')}
							className='bg-gray-700 text-white px-4 py-2.5 sm:px-6 sm:py-3 min991:px-8 min991:py-4 rounded uppercase font-semibold text-sm sm:text-base min991:text-lg'
						>
							Усі івенти
						</button>
					</div>
				</div>
			</div>
		)
	}

	if (isProcessing) {
		return (
			<div className='flex items-center justify-center min-h-[50vh] sm:min-h-screen bg-background' style={{ padding: `${pad.y}px ${pad.x}px` }}>
				<div className='text-center'>
					<div className='text-white text-lg sm:text-xl min991:text-2xl mb-4 sm:mb-6'>Обробка замовлення...</div>
					<div className='animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 min991:h-14 min991:w-14 border-b-2 border-white mx-auto'></div>
				</div>
			</div>
		)
	}

	const isEventOnlyCart =
		items.length > 0 &&
		items.every((i) => i.eventId != null && i.event != null && i.productId == null)

	const firstEventItem = isEventOnlyCart ? items.find((i) => i.eventId != null && i.event != null) : null
	const event = firstEventItem?.event
	const selectedSide =
		event && firstEventItem?.eventSideId != null && event.sides?.length
			? event.sides.find((s) => s.id === firstEventItem.eventSideId) ?? null
			: null

	if (error && !isEventOnlyCart) {
		return (
			<div className='flex items-center justify-center min-h-[50vh] sm:min-h-screen bg-background' style={{ padding: `${pad.y}px ${pad.x}px` }}>
				<div className='text-center max-w-md mx-auto'>
					<div className='text-red-500 text-lg sm:text-xl min991:text-2xl mb-4 sm:mb-6 font-semibold'>{error}</div>
					<div className='flex flex-col sm:flex-row gap-2 sm:gap-3 min991:gap-4 justify-center'>
						<button
							onClick={() => router.push('/rental')}
							className='bg-[#FA4616] text-white px-4 py-2.5 sm:px-6 sm:py-3 min991:px-8 min991:py-4 rounded uppercase font-semibold text-sm sm:text-base min991:text-lg'
						>
							Повернутися до каталогу
						</button>
						<button
							onClick={() => {
								setError(null)
								setIsProcessing(false)
							}}
							className='bg-gray-700 text-white px-4 py-2.5 sm:px-6 sm:py-3 min991:px-8 min991:py-4 rounded uppercase font-semibold text-sm sm:text-base min991:text-lg'
						>
							Спробувати ще раз
						</button>
					</div>
				</div>
			</div>
		)
	}

	if (isEventOnlyCart && event && firstEventItem) {
		const price = getTotalPrice()
		const location = [event.city?.name, event.address].filter(Boolean).join(', ')
		const sideLabel = selectedSide?.name ? selectedSide.name.toUpperCase() : null

		return (
			<>
				{showPhoneModal && (
					<PhoneModal
						phoneNumber={phoneNumber}
						onPhoneChange={(v) => {
							setPhoneNumber(v)
							setPhoneError(null)
						}}
						phoneError={phoneError}
						onSave={handleSavePhone}
						onCancel={() => router.push('/profile')}
						isSaving={isSavingPhone}
					/>
				)}

				<EventOnlyCheckout
					event={event}
					firstEventItem={firstEventItem}
					price={price}
					location={location}
					sideLabel={sideLabel}
					setEventSide={setEventSide}
					setError={setError}
					handleCheckout={handleCheckout}
					error={error}
					agreeTerms={agreeTerms}
					setAgreeTerms={setAgreeTerms}
					paymentMethod={paymentMethod}
					setPaymentMethod={setPaymentMethod}
					allowedPaymentMethods={allowedPaymentMethods}
					teamEventItems={teamEventItems}
					teamSelections={teamSelections}
					setTeamSelections={setTeamSelections}
					availableTeams={availableTeams}
					teamsLoading={teamsLoading}
					teamsError={teamsError}
				/>
			</>
		)
	}

	return (
		<>
			{showPhoneModal && (
				<PhoneModal
					phoneNumber={phoneNumber}
					onPhoneChange={(v) => {
						setPhoneNumber(v)
						setPhoneError(null)
					}}
					phoneError={phoneError}
					onSave={handleSavePhone}
					onCancel={() => router.push('/profile')}
					isSaving={isSavingPhone}
				/>
			)}

			<MixedCheckout
				items={items}
				getTotalPrice={getTotalPrice}
				setError={setError}
				handleCheckout={handleCheckout}
				error={error}
				agreeTerms={agreeTerms}
				setAgreeTerms={setAgreeTerms}
				paymentMethod={paymentMethod}
				setPaymentMethod={setPaymentMethod}
				allowedPaymentMethods={allowedPaymentMethods}
				teamEventItems={teamEventItems}
				teamSelections={teamSelections}
				setTeamSelections={setTeamSelections}
				availableTeams={availableTeams}
				teamsLoading={teamsLoading}
				teamsError={teamsError}
			/>
		</>
	)
}
