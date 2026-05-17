import { getAuthToken } from '@/utils/auth'
import { redirect } from 'next/navigation'
import CheckoutForm from './CheckoutForm'
import { buildNoIndexMetadata } from '../utils/noindex-metadata'

export const metadata = buildNoIndexMetadata({
	title: 'Оформлення замовлення | Strike Shop Action',
	canonicalPath: '/checkout',
	description: 'Службова сторінка оформлення замовлення.',
})

export default async function CheckoutPage() {
	const token = await getAuthToken()
	if (!token) {
		redirect('/login')
	}

	return <CheckoutForm />
}
