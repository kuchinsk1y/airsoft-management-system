import DashboardPageClient from './DashboardPageClient'
import * as eventsApi from '@/actions/events'
import * as ordersApi from '@/actions/orders'
import * as commentsApi from '@/actions/comments'
import * as teamsApi from '@/actions/teams'
import * as usersApi from '@/actions/users'

export default async function DashboardPage() {
  const serverFetchedAt = Date.now()
  const [
    initialEvents,
    initialTeamsCount,
    initialUsersCount,
    initialNewOrdersCount,
    initialPendingModerationCount,
    initialPendingCommentsCount,
  ] = await Promise.all([
    eventsApi.fetchEvents().catch(() => []),
    teamsApi.getTeamsCount().catch(() => 0),
    usersApi.getUsersCount().catch(() => 0),
    ordersApi.fetchNewOrdersBadgeCount().catch(() => 0),
    eventsApi.fetchPendingModerationCount().catch(() => 0),
    commentsApi.getCommentsByStatus('PENDING').then((items) => items.length).catch(() => 0),
  ])

  return (
    <DashboardPageClient
      initialEvents={initialEvents}
      initialTeamsCount={initialTeamsCount}
      initialUsersCount={initialUsersCount}
      initialNewOrdersCount={initialNewOrdersCount}
      initialPendingModerationCount={initialPendingModerationCount}
      initialPendingCommentsCount={initialPendingCommentsCount}
      serverFetchedAt={serverFetchedAt}
    />
  )
}
