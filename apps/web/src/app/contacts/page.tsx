import ContactPage from '@/pages/ContactPage'
import { buildTemplateMetadata } from '@/app/utils/template-metadata'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
	return buildTemplateMetadata({
		pageKey: 'contacts',
		fallbackTitle: 'Контакти | Strike Shop Action',
		fallbackCanonicalPath: '/contacts',
	})
}

export default function Page() {
	return <ContactPage />
}
