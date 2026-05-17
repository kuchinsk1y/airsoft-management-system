import OrderForm from '@/components/workshop/OrderForm';
import { toAbsoluteUrl } from '@/app/utils/template-metadata';
import type { Metadata } from 'next';
import { getLocalizedAlternates, getRequestLocale, localizePath } from '@/app/utils/locale-seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return {
    title: 'Послуги майстерні | Strike Shop Action',
    description: 'Форма замовлення послуг майстерні Strike Shop Action.',
    alternates: {
      ...(await getLocalizedAlternates('/workshop/services', locale)),
      canonical: toAbsoluteUrl(localizePath('/workshop/services', locale)),
    },
  };
}

const inputList = [
  { label: "Ваше ім'я", name: 'name', placeholder: "Введіть ваше ім'я" },
  { label: 'Телефон', name: 'phoneNumber', placeholder: 'Введіть ваш телефон' },
  {
    label: "Ваш email",
    name: 'email',
    placeholder: 'Введіть ваш email',
  },
  { label: 'Тема', name: 'topic', placeholder: 'Введіть тему' },
  {
    label: "Ваша компанія (необов'язково)",
    name: 'company',
    placeholder: 'Введіть назву компанії',
  },
];

export default async function page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const topic = (await searchParams).topic;
  return (
      <OrderForm topic={topic || ''} fields={inputList} />
  );
}
