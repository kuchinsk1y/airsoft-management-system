import { buildNoIndexMetadata } from '../../utils/noindex-metadata';
import NotificationsPageClient from './NotificationsPageClient';

export const metadata = buildNoIndexMetadata({
  title: 'Сповіщення | Strike Shop Action',
  canonicalPath: '/profile/notifications',
  description: 'Приватна сторінка сповіщень користувача.',
});

export default function NotificationsPage() {
  return <NotificationsPageClient />;
}
