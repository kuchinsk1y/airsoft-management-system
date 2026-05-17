import { getEvent, getEventGallery, getMyEventRegistrationStatus } from '@/actions/events';
import { getTemplate } from '@/actions/template';
import { toAbsoluteUrl } from '@/app/utils/template-metadata';
import { getLocalizedAlternates, getRequestLocale, localizePath } from '@/app/utils/locale-seo';
import {
  extractEventIdFromRouteParam,
  getEventPath,
  getEventRouteParam,
} from '@/utils/event-url';
import BannerJoin from '@/components/generics/banners/BannerJoin';
import type { Metadata } from 'next';
import EventPage from '@/pages/EventPage';
import { notFound, redirect } from 'next/navigation';

function toIsoDate(value?: string | Date): string | undefined {
  if (!value) return undefined;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;

  return parsed.toISOString();
}

const toQueryString = (
  searchParams: Record<string, string | string[] | undefined>,
): string => {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
      return;
    }

    params.set(key, value);
  });

  const query = params.toString();
  return query ? `?${query}` : '';
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const locale = await getRequestLocale();
  const { id: routeParam } = await params;
  const eventId = extractEventIdFromRouteParam(routeParam);

  if (eventId === null) {
    return {
      title: 'Подію не знайдено | Strike Shop Action',
      robots: {
        index: false,
        follow: false,
      },
      alternates: {
        ...(await getLocalizedAlternates('/events', locale)),
        canonical: toAbsoluteUrl(localizePath('/events', locale)),
      },
    };
  }

  const event = await getEvent(eventId);
  if (!event) {
    return {
      title: 'Подію не знайдено | Strike Shop Action',
      robots: {
        index: false,
        follow: false,
      },
      alternates: {
        ...(await getLocalizedAlternates('/events', locale)),
        canonical: toAbsoluteUrl(localizePath('/events', locale)),
      },
    };
  }

  const canonicalPath = getEventPath(event);
  const canonical = toAbsoluteUrl(localizePath(canonicalPath, locale));
  const title = `${event.name} | Strike Shop Action`;
  const regionName = event.city?.region?.name?.trim();
  const cityName = event.city?.name?.trim();
  const locationParts = [regionName, cityName].filter((item): item is string => Boolean(item));
  const location = locationParts.length > 0 ? locationParts.join(', ') : 'Україна';
  const description = `${event.name}. ${location}. Страйкбольні ігри від Strikeshop`;

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
      images: event.image ? [{ url: toAbsoluteUrl(event.image) }] : undefined,
    },
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id: routeParam }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const eventId = extractEventIdFromRouteParam(routeParam);

  if (eventId === null) notFound();

  const event = await getEvent(eventId);
  if (!event) notFound();

  const canonicalRouteParam = getEventRouteParam(event);
  if (routeParam !== canonicalRouteParam) {
    redirect(`${getEventPath(event)}${toQueryString(resolvedSearchParams)}`);
  }

  const regionParam = resolvedSearchParams.region;
  const region = Array.isArray(regionParam) ? regionParam[0] : regionParam;

  // Get gallery only for archived (finished) events.
  const isEventFinished = event.isActive === false;
  const [gallery, registrationStatus] = await Promise.all([
    isEventFinished ? getEventGallery(eventId) : Promise.resolve([]),
    getMyEventRegistrationStatus(eventId),
  ]);

  const templateResult = await getTemplate('events');

  let template: { breadcrumbs: string[] } | undefined;
  if (templateResult.success) {
    const data = templateResult.data as { breadcrumbs?: string[] };
    if (data.breadcrumbs) {
      template = {
        breadcrumbs: data.breadcrumbs,
      };
    }
  }

  const schemaLocationName = [event.city.name, event.address?.trim()]
    .filter(Boolean)
    .join(' - ');

  const eventSchema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description || undefined,
    image: event.image ? [toAbsoluteUrl(event.image)] : undefined,
    startDate: toIsoDate(event.gameStartDate || event.startDate),
    endDate: toIsoDate(event.endDate),
    eventStatus: event.isActive
      ? 'https://schema.org/EventScheduled'
      : 'https://schema.org/EventCancelled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: schemaLocationName || event.city.name,
      address: event.address?.trim() || undefined,
    },
    organizer: {
      '@type': 'Organization',
      name: event.application?.name || 'Strike Shop Action',
      telephone: event.application?.phoneNumber || undefined,
    },
    offers: {
      '@type': 'Offer',
      url: toAbsoluteUrl(getEventPath(event)),
      priceCurrency: 'UAH',
      price: String(event.price),
      availability: event.isActive
        ? 'https://schema.org/InStock'
        : 'https://schema.org/SoldOut',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
      />
      <EventPage
        event={event}
        template={template}
        region={region}
        gallery={gallery}
        isAlreadyRegistered={registrationStatus.isRegistered}
      />
      <BannerJoin pageKey="events" region={region} />
    </>
  );
}
