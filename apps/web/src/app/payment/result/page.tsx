import PaymentResultClient from '@/components/payment/PaymentResultClient';
import { Suspense } from 'react';
import { buildNoIndexMetadata } from '../../utils/noindex-metadata';

export const metadata = buildNoIndexMetadata({
	title: 'Результат оплати | Strike Shop Action',
	canonicalPath: '/payment/result',
	description: 'Службова сторінка статусу оплати.',
});

export default function PaymentResultPage() {
	return (
		<Suspense fallback={null}>
			<PaymentResultClient />
		</Suspense>
	);
}
