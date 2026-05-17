import { redirect } from 'next/navigation';
import { buildNoIndexMetadata } from '../../utils/noindex-metadata';

export const metadata = buildNoIndexMetadata({
  title: 'Команда | Strike Shop Action',
  canonicalPath: '/profile/team',
  description: 'Службовий перехід до сторінки команди.',
});

export default async function TeamLinkRedirectPage({
  params,
}: {
  params: { id: string };
}) {
  const teamId = encodeURIComponent(params.id);
  redirect(`/profile/team?teamId=${teamId}`);
}

