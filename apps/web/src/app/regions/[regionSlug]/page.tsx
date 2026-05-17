import { getEvents } from '@/actions/events';
import { getAllRegions, getRegionBySlug } from '@/actions/regions';
import { getCities } from '@/actions/cities';
import { toAbsoluteUrl } from '@/app/utils/template-metadata';
import { getLocalizedAlternates, getRequestLocale, localizePath } from '@/app/utils/locale-seo';
import RegionPage from '@/components/region/RegionPage';
import BannerCreateGame from '@/components/generics/banners/BannerCreateGame';
import BannerJoin from '@/components/generics/banners/BannerJoin';
import type { Event } from '@/interfaces';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

function sortUpcomingEvents(events: Event[]): Event[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return events
    .filter((event) => {
      const eventDate = new Date(event.gameStartDate ?? event.startDate);
      if (Number.isNaN(eventDate.getTime())) return false;
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= now;
    })
    .sort((a, b) => {
      const aDate = new Date(a.gameStartDate ?? a.startDate).getTime();
      const bDate = new Date(b.gameStartDate ?? b.startDate).getTime();
      return aDate - bDate;
    });
}

export async function generateStaticParams() {
  const regions = await getAllRegions();
  return regions.map((r) => ({ regionSlug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ regionSlug: string }>;
}): Promise<Metadata> {
  const locale = await getRequestLocale();
  const { regionSlug } = await params;

  const region = await getRegionBySlug(regionSlug);
  if (!region) {
    return {
      title: 'Сторінку не знайдено | Strike Shop Action',
      robots: { index: false, follow: false },
    };
  }

  const regionCities = await getCities(regionSlug);
  const representativeCity = regionCities[0]?.name ?? region.name;

  const title = `Страйкбол у ${region.name} | Strike Shop Action`;
  const description = `Страйкбол у ${region.name}. ${region.name}, ${representativeCity}. Страйкбольні ігри від Strikeshop`;
  const canonicalPath = `/regions/${regionSlug}`;
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
  params: Promise<{ regionSlug: string }>;
}) {
  const { regionSlug } = await params;

  const region = await getRegionBySlug(regionSlug);
  if (!region) {
    notFound();
  }

  const [cities, events] = await Promise.all([
    getCities(regionSlug),
    getEvents({ regionSlug, isActive: true }),
  ]);

  return (
    <>
      <RegionPage
        regionName={region.name}
        regionSlug={region.slug}
        cities={cities}
        events={sortUpcomingEvents(events)}
        seoText={region.seoText}
        seoFaq={region.seoFaq}
      />
      <BannerCreateGame pageKey="events" />
      <BannerJoin pageKey="events" />
    </>
  );
}
