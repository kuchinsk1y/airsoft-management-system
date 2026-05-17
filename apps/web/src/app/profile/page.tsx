import ProfilePage from '@/pages/ProfilePage'
import { buildNoIndexMetadata } from '../utils/noindex-metadata'
import { fetchMyEquipment } from '@/actions/equipment'

export const metadata = buildNoIndexMetadata({
	title: 'Профіль | Strike Shop Action',
	canonicalPath: '/profile',
	description: 'Приватний кабінет користувача.',
})

export default async function Page() {
	const initialEquipment = await fetchMyEquipment()
	return <ProfilePage initialEquipment={initialEquipment} />
}