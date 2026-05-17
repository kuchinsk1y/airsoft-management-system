import { getUserEvents } from '@/actions/events';
import { ArchiveClient } from '@/app/profile/archive/ArchiveClient';
import { buildNoIndexMetadata } from '../../utils/noindex-metadata';

export const metadata = buildNoIndexMetadata({
  title: 'Архів ігор | Strike Shop Action',
  canonicalPath: '/profile/archive',
  description: 'Приватна сторінка архіву ігор користувача.',
});

export default async function ArchivePage() {
  const allEvents = await getUserEvents();
  const archivedEvents = allEvents.filter((event) => !event.isActive);

  return <ArchiveClient events={archivedEvents} />;
}
