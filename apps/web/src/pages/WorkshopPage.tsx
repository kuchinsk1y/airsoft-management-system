import { UnionIcon } from '@/components/icons/UnionIcon';
import TitleBlock from '@/components/TitleBlock/TitleBlock';
import WorkshopSection from '@/components/workshop/WorkshopSection';
import Image from 'next/image';
import { RiMapPin2Fill } from 'react-icons/ri';
import { FaPhone } from 'react-icons/fa6';
import { MdOutlineDateRange } from 'react-icons/md';
import {
  WorkshopContactsBlock,
  WorkshopContentBlock,
  WorkshopCardData,
  WorkshopData,
  WorkshopServicesBlock,
  WorkshopSupportBlock,
  FaqItem,
} from '@/interfaces';
import SeoTextBlock from '@/components/seo/SeoTextBlock';
import FaqBlock from '@/components/seo/FaqBlock';

function normalizePhoneHref(phone: string): string {
  const normalized = phone.replace(/[^+\d]/g, '');
  return `tel:${normalized}`;
}

function normalizeMapHref(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function isWorkshopBlock(block: unknown): block is WorkshopContentBlock {
  if (typeof block !== 'object' || block === null) {
    return false;
  }

  return 'type' in block;
}

function normalizeCards(items: unknown): WorkshopCardData[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter(
      (item): item is WorkshopCardData =>
        typeof item === 'object' && item !== null,
    )
    .map((item) => ({
      title: typeof item.title === 'string' ? item.title : '',
      description: typeof item.description === 'string' ? item.description : '',
      image: typeof item.image === 'string' ? item.image : '',
      slug: typeof item.slug === 'string' ? item.slug : undefined,
    }))
    .filter((item) => item.title.trim().length > 0 || item.description.trim().length > 0 || item.image.trim().length > 0);
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

export default function WorkshopPage({
  data,
  seoText = '',
  seoFaq,
}: {
  data: WorkshopData;
  seoText?: string;
  seoFaq?: FaqItem[];
}) {
  const title = typeof data?.title === 'string' ? data.title : '';
  const description = typeof data?.description === 'string' ? data.description : '';
  const heroImage = typeof data?.heroImage === 'string' ? data.heroImage : '';
  const content = Array.isArray(data?.content) ? data.content.filter(isWorkshopBlock) : [];

  const services = content.find(
    (b) => b.type === 'services',
  ) as WorkshopServicesBlock;
  const support = content.find(
    (b) => b.type === 'support',
  ) as WorkshopSupportBlock;
  const contacts = content.find(
    (b) => b.type === 'contacts',
  ) as WorkshopContactsBlock;

  const servicesCards = normalizeCards(services?.items);
  const supportCards = normalizeCards(support?.items);
  const addresses = normalizeStringArray(contacts?.address);
  const phones = normalizeStringArray(contacts?.phone);
  const workingHours = normalizeStringArray(contacts?.workingHours);

  return (
    <>
      <div className="grid grid-cols-1 border-white min991:grid-cols-[60%_40%]">
        <div className="relative p-5 min991:border-r min991:border-white min991:px-20 min991:py-14">
          <TitleBlock
            title={title}
            subtitle={description}
            path={[{ label: 'Головна', href: '/' }, { label: title }]}
            className="mb-0 flex-col gap-5 border-0! p-0!"
            titleClassName="mb-0 text-[40px] font-semibold leading-[100%] min991:text-[72px]"
            breadcrumbClassName="mb-0 text-[10px] font-normal min991:text-xs"
            subtitleClassName="text-sm uppercase leading-6 min991:text-base"
          >
            <UnionIcon className="hidden h-10 sm:block min991:h-12" />
          </TitleBlock>
        </div>

        <div className="relative h-[72vw] w-full border-y border-white min991:h-full min991:border-y-0">
          {heroImage ? (
            <Image
              src={heroImage}
              alt="Workshop Image"
              fill
              className="object-cover"
              sizes="(max-width: 991px) 100vw, 40vw"
              priority
            />
          ) : (
            <div className="h-full w-full bg-[#111]" />
          )}
        </div>
      </div>
      <WorkshopSection title={services?.title ?? ''} cards={servicesCards} />
      <WorkshopSection title={support?.title ?? ''} cards={supportCards} />
      <div className="w-full py-5 text-2xl min991:text-[32px] min991:py-14 border-white border-b uppercase leading-8 text-center">
        {contacts?.title}
      </div>
      <div className="grid grid-cols-1 min991:grid-cols-3 min991:border-y">
        <div className="flex flex-col p-5 min991:px-10 min991:py-8  gap-5 border-b min991:border-r min991:border-b-0 py-5">
          <div className="flex items-center gap-3">
            <RiMapPin2Fill />
            <h3 className="text-[20px] min991:text-2xl font-medium uppercase leading-6 min991:leading-7">
              Адреса
            </h3>
          </div>
          <div className="flex flex-col gap-5 uppercase leading-6">
            {addresses.map((address, index) => (
              <a
                key={`${address}-${index}`}
                href={normalizeMapHref(address)}
                target="_blank"
                rel="noreferrer"
                className="transition-opacity duration-200 hover:opacity-70"
              >
                {address}
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-col p-5 min991:px-10 min991:py-8  gap-5 border-b min991:border-r min991:border-b-0 py-5">
          <div className="flex items-center gap-3">
            <FaPhone />
            <h3 className="text-[20px] min991:text-2xl font-medium uppercase leading-6 min991:leading-7">
              Телефон
            </h3>
          </div>
          <div className="flex flex-col gap-5 uppercase leading-6">
            {phones.map((phone, index) => (
              <a
                key={`${phone}-${index}`}
                href={normalizePhoneHref(phone)}
                className="transition-opacity duration-200 hover:opacity-70"
              >
                {phone}
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-col p-5 min991:px-10 min991:py-8  gap-5 border-b min991:border-r min991:border-b-0 py-5">
          <div className="flex items-center gap-3">
            <MdOutlineDateRange />
            <h3 className="text-[20px] min991:text-2xl font-medium uppercase leading-6 min991:leading-7">
              Графік роботи
            </h3>
          </div>
          <div className="flex flex-col gap-5 uppercase leading-6">
            {workingHours.map((workingHour, index) => {
              const [days, hours = ''] = workingHour.split(': ', 2);
              return (
                <div key={`${workingHour}-${index}`} className="flex flex-col gap-1">
                  <span className="text-[12px] uppercase leading-4">{days}:</span>
                  <span className="uppercase leading-6">{hours}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <SeoTextBlock text={seoText} className="min991:px-20" />
      <FaqBlock items={seoFaq} className="min991:px-20" />
    </>
  );
}