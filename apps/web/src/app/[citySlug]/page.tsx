import { getEvents } from '@/actions/events';
import { getCities, getCityBySlug } from '@/actions/cities';
import { toAbsoluteUrl } from '@/app/utils/template-metadata';
import { getLocalizedAlternates, getRequestLocale, localizePath } from '@/app/utils/locale-seo';
import CityPage from '@/components/city/CityPage';
import BannerCreateGame from '@/components/generics/banners/BannerCreateGame';
import BannerJoin from '@/components/generics/banners/BannerJoin';
import type { Event } from '@/interfaces';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getCityPageTitle, isDefaultCitySlug } from '@/utils/city-landing';
import { getContactByCitySlug } from '@/utils/contacts-page-data';

function sortUpcomingEvents(events: Event[]): Event[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return events
    .filter(event => {
      const eventDate = new Date(event.gameStartDate ?? event.startDate);
      if (Number.isNaN(eventDate.getTime())) {
        return false;
      }

      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= now;
    })
    .sort((left, right) => {
      const leftDate = new Date(left.gameStartDate ?? left.startDate).getTime();
      const rightDate = new Date(right.gameStartDate ?? right.startDate).getTime();
      return leftDate - rightDate;
    });
}

export async function generateStaticParams() {
  const cities = await getCities();
  return cities.map((c) => ({ citySlug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ citySlug: string }>;
}): Promise<Metadata> {
  const locale = await getRequestLocale();
  const { citySlug } = await params;

  if (isDefaultCitySlug(citySlug)) {
    return {
      alternates: {
        ...(await getLocalizedAlternates('/', locale)),
        canonical: toAbsoluteUrl(localizePath('/', locale)),
      },
    };
  }

  const contact = await getContactByCitySlug(citySlug);
  if (!contact) {
    return {
      title: 'Сторінку не знайдено | Strike Shop Action',
      robots: {
        index: false,
        follow: false,
      },
      alternates: {
        ...(await getLocalizedAlternates('/contacts', locale)),
        canonical: toAbsoluteUrl(localizePath('/contacts', locale)),
      },
    };
  }

  const cityData = await getCityBySlug(citySlug);
  const regionName = cityData?.region?.name ?? 'Україна';

  const title = `${getCityPageTitle(contact.city)} | Strike Shop Action`;
  const description = `${getCityPageTitle(contact.city)}. ${contact.city}, ${regionName}. Страйкбольні ігри від Strikeshop`;
  const canonicalPath = `/${contact.citySlug}`;
  const canonical = toAbsoluteUrl(localizePath(canonicalPath, locale));

  return {
    title,
    description,
    alternates: {
      ...(await getLocalizedAlternates(canonicalPath, locale)),
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ citySlug: string }>;
}) {
  const { citySlug } = await params;

  if (isDefaultCitySlug(citySlug)) {
    redirect('/');
  }

  const contact = await getContactByCitySlug(citySlug);
  if (!contact) {
    notFound();
  }

  const [events, cityData] = await Promise.all([
    getEvents({ isActive: true, citySlug }).then(sortUpcomingEvents),
    getCityBySlug(citySlug),
  ]);

  return (
    <>
      <CityPage
        contact={contact}
        events={events}
        seoText={cityData?.seoText}
        seoFaq={cityData?.seoFaq}
      />
      <BannerCreateGame pageKey="events" />
      <BannerJoin pageKey="events" />
    </>
  );
}