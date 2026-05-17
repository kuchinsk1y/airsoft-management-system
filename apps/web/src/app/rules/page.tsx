import RulesPage from "@/pages/RulesPage";
import { buildTemplateMetadata } from '@/app/utils/template-metadata';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return buildTemplateMetadata({
    pageKey: 'rules',
    fallbackTitle: 'Правила гри | Strike Shop Action',
    fallbackCanonicalPath: '/rules',
  });
}

export default function Page() {
  return <RulesPage />;
}