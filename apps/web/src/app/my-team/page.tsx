import MyTeamPage from '@/pages/MyTeamPage'
import { Suspense } from 'react'
import { buildNoIndexMetadata } from '../utils/noindex-metadata'

export const metadata = buildNoIndexMetadata({
	title: 'Моя команда | Strike Shop Action',
	canonicalPath: '/my-team',
	description: 'Службова сторінка керування командою.',
})

export default function Page() {
	return (
		<Suspense fallback={null}>
			<MyTeamPage />
		</Suspense>
	)
}

