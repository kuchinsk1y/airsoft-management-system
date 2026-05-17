import { getTemplate } from '@/actions/template';
import { getWorkshopItemList } from '@/actions/workshop-items';
import { buildTemplateMetadata } from '@/app/utils/template-metadata';
import { FaqItem, WorkshopData } from '@/interfaces';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

const WorkshopPage = dynamic(() => import('@/pages/WorkshopPage'));

function normalizeFaq(value: unknown): FaqItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item !== 'object' || item === null) {
        return { question: '', answer: '' };
      }

      const obj = item as Record<string, unknown>;
      return {
        question: typeof obj.question === 'string' ? obj.question : '',
        answer: typeof obj.answer === 'string' ? obj.answer : '',
      };
    })
    .filter((item) => item.question.trim().length > 0 && item.answer.trim().length > 0);
}

export async function generateMetadata(): Promise<Metadata> {
  return buildTemplateMetadata({
    pageKey: 'workshop',
    fallbackTitle: 'Майстерня | Strike Shop Action',
    fallbackCanonicalPath: '/workshop',
  });
}

export default async function page() {
  const [result, workshopItems] = await Promise.all([
    getTemplate('workshop'),
    getWorkshopItemList({ limit: 100, offset: 0 }),
  ]);

  if (!result.success) {
    console.error(result.error);
    return (
      <div className="text-gray-400 text-center mt-6">Помилка завантаження</div>
    );
  }

  const templateData = result.data as WorkshopData;
  const seoText =
    typeof (result.data as { seo?: { seoText?: unknown } })?.seo?.seoText === 'string'
      ? ((result.data as { seo?: { seoText?: string } }).seo?.seoText ?? '')
      : '';
  const seoFaq = normalizeFaq((result.data as { seo?: { seoFaq?: unknown } })?.seo?.seoFaq);
  const itemList = workshopItems.items ?? [];

  const templateServicesBlock = Array.isArray(templateData.content)
    ? templateData.content.find((block) => block.type === 'services')
    : undefined;
  const templateSupportBlock = Array.isArray(templateData.content)
    ? templateData.content.find((block) => block.type === 'support')
    : undefined;
  const templateContactsBlock = Array.isArray(templateData.content)
    ? templateData.content.find((block) => block.type === 'contacts')
    : undefined;

  const servicesItems = itemList
    .filter((item) => item.category === 'SERVICES')
    .map((item) => ({
      title: item.title,
      description: item.excerpt,
      image: item.coverImage ?? '',
      slug: item.slug,
    }));

  const supportItems = itemList
    .filter((item) => item.category === 'SUPPORT')
    .map((item) => ({
      title: item.title,
      description: item.excerpt,
      image: item.coverImage ?? '',
      slug: item.slug,
    }));

  const nextContent = [
    {
      type: 'services' as const,
      title:
        templateServicesBlock && templateServicesBlock.type === 'services'
          ? templateServicesBlock.title
          : 'Послуги майстерні',
      items: servicesItems,
    },
    {
      type: 'support' as const,
      title:
        templateSupportBlock && templateSupportBlock.type === 'support'
          ? templateSupportBlock.title
          : 'Експертна підтримка',
      items: supportItems,
    },
    templateContactsBlock && templateContactsBlock.type === 'contacts'
      ? templateContactsBlock
      : {
          type: 'contacts' as const,
          title: '',
          address: [],
          phone: [],
          workingHours: [],
        },
  ];

  return <WorkshopPage data={{ ...templateData, content: nextContent }} seoText={seoText} seoFaq={seoFaq} />;
}
