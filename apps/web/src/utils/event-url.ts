import type { Event } from '@/interfaces';
import { slugify } from '@/utils/slug';

type EventRouteData = Pick<Event, 'id' | 'name'> & {
  slug?: string | null;
};

const FALLBACK_EVENT_SLUG = 'event';

const getEventSlug = ({ name, slug }: EventRouteData): string => {
  if (typeof slug === 'string' && slug.trim().length > 0) {
    return slug;
  }

  const generatedSlug = slugify(name);
  return generatedSlug || FALLBACK_EVENT_SLUG;
};

export const getEventRouteParam = (event: EventRouteData): string =>
  `${getEventSlug(event)}-${event.id}`;

export const getEventPath = (event: EventRouteData): string =>
  `/events/${getEventRouteParam(event)}`;

export const extractEventIdFromRouteParam = (
  routeParam: string,
): number | null => {
  if (/^\d+$/.test(routeParam)) {
    return Number(routeParam);
  }

  const match = routeParam.match(/-(\d+)$/);
  if (!match) {
    return null;
  }

  return Number(match[1]);
};
