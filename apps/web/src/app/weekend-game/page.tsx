import { buildTemplateMetadata } from '@/app/utils/template-metadata';
import type { Metadata } from 'next';
import WeekendGamePage from '@/pages/WeekendGamePage';

export async function generateMetadata(): Promise<Metadata> {
  return buildTemplateMetadata({
    pageKey: 'weekend-game',
    fallbackTitle: 'Гра вихідного дня | Strike Shop Action',
    fallbackCanonicalPath: '/weekend-game',
  });
}

export default function Page() {
  return <WeekendGamePage />;
}