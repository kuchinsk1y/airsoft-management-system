import { getMyComments } from '@/actions/comments';
import { buildNoIndexMetadata } from '../../utils/noindex-metadata';
import ReviewsClient from './ReviewsClient';

export const metadata = buildNoIndexMetadata({
  title: 'Мої відгуки | Strike Shop Action',
  canonicalPath: '/profile/reviews',
  description: 'Приватна сторінка відгуків користувача.',
});

export default async function ReviewsPage() {
  const comments = await getMyComments('COMPANY');

  return <ReviewsClient initialComments={comments} />;
}
