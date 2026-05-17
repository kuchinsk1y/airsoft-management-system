import MyTeamPage from '@/pages/MyTeamPage'
import { Suspense } from 'react'
import { buildNoIndexMetadata } from '../../utils/noindex-metadata'
import { getMyTeamRole, getMyTeams } from '@/actions/teams'

export const metadata = buildNoIndexMetadata({
	title: 'Команда | Strike Shop Action',
	canonicalPath: '/profile/team',
	description: 'Приватна сторінка керування командою.',
})

type TeamViewState = 'none' | 'owner' | 'member'

function resolveRoleFromTeam(team: any): TeamViewState | null {
	const rawRole =
		team?.myRole ??
		team?.role ??
		team?.memberRole ??
		team?.membershipRole ??
		null

	if (typeof rawRole !== 'string') {
		return null
	}

	const role = rawRole.trim().toLowerCase()
	if (role === 'owner' || role.includes('owner')) return 'owner'
	if (
		role === 'assistant' ||
		role.includes('assistant') ||
		role === 'staff' ||
		role.includes('staff') ||
		role === 'member' ||
		role.includes('member')
	) {
		return 'member'
	}

	return null
}

export default async function Page() {
	let initialResolvedState: TeamViewState | null = null
	let initialTeamId: number | null = null

	try {
		const teams = await getMyTeams()

		if (!Array.isArray(teams) || teams.length === 0) {
			initialResolvedState = 'none'
		} else {
			const firstTeamId = Number((teams as any[])[0]?.id)
			if (Number.isFinite(firstTeamId) && firstTeamId > 0) {
				initialTeamId = firstTeamId

				const derivedRole = resolveRoleFromTeam((teams as any[])[0])
				if (derivedRole) {
					initialResolvedState = derivedRole
				} else {
					const role = await getMyTeamRole(firstTeamId)
					initialResolvedState = role === 'owner' ? 'owner' : 'member'
				}
			} else {
				initialResolvedState = 'none'
			}
		}
	} catch {
		initialResolvedState = null
		initialTeamId = null
	}

	return (
		<Suspense fallback={null}>
			<MyTeamPage
				initialResolvedState={initialResolvedState}
				initialTeamId={initialTeamId}
			/>
		</Suspense>
	)
}

