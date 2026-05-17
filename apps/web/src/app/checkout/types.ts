import type {
	CartItem,
	CheckoutEventInfo,
	CheckoutFirstEventItem,
	CheckoutTeam,
	PaymentMethod,
} from '@/interfaces'
import type { Dispatch, SetStateAction } from 'react'

export type { CheckoutEventInfo, CheckoutFirstEventItem, CheckoutTeam, PaymentMethod } from '@/interfaces'

export interface CheckoutSharedProps {
	setError: (err: string | null) => void
	handleCheckout: () => Promise<void>
	error: string | null
	agreeTerms: boolean
	setAgreeTerms: (v: boolean) => void
	paymentMethod: PaymentMethod
	setPaymentMethod: (m: PaymentMethod) => void
	allowedPaymentMethods: PaymentMethod[]
	teamEventItems: CartItem[]
	teamSelections: Record<number, number>
	setTeamSelections: Dispatch<SetStateAction<Record<number, number>>>
	availableTeams: CheckoutTeam[]
	teamsLoading: boolean
	teamsError: string | null
}

export interface EventOnlyCheckoutProps extends CheckoutSharedProps {
	event: CheckoutEventInfo
	firstEventItem: CheckoutFirstEventItem
	price: number
	location: string
	sideLabel: string | null
	setEventSide: (itemId: string, eventSideId: number) => void
}

export interface MixedCheckoutProps extends CheckoutSharedProps {
	items: CartItem[]
	getTotalPrice: () => number
}
