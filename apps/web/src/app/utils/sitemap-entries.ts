import { NEXT_PUBLIC_API_URL, NEXT_PUBLIC_WEB_URL, STATIC_API_KEY } from '@/utils/config';
import { getResolvedContactsPageData } from '@/utils/contacts-page-data';
import { getEventPath } from '@/utils/event-url';
import { getProductPath } from '@/utils/product-url';
import type { MetadataRoute } from 'next';

type TemplateConfigResponse = {
  seo?: {
    includeSitemap?: boolean;
  };
};

type NewsListResponse = {
  items?: Array<{
    slug?: string;
    updatedAt?: string;
    publishedAt?: string;
    createdAt?: string;
  }>;
  total?: number;
};

type EntityItem = {
  id?: number;
  slug?: string;
  name?: string;
  updatedAt?: string;
  createdAt?: string;
};

const WEB_BASE_URL = NEXT_PUBLIC_WEB_URL.replace(/\/$/, '');
const API_BASE_URL = NEXT_PUBLIC_API_URL.replace(/\/$/, '');
const API_HEADERS = {
  'x-api-key': STATIC_API_KEY,
};

function toAbsoluteUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${WEB_BASE_URL}${normalizedPath}`;
}

function toValidDate(value?: string): Date {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

async function shouldIncludeTemplatePage(
  pageKey: string,
  fallback = true,
): Promise<boolean> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/template/${encodeURIComponent(pageKey)}`,
      {
        headers: API_HEADERS,
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      return fallback;
    }

    const data = (await response.json()) as TemplateConfigResponse;
    if (typeof data?.seo?.includeSitemap === 'boolean') {
      return data.seo.includeSitemap;
    }

    return fallback;
  } catch {
    return fallback;
  }
}

async function getNewsSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const limit = 100;
  let offset = 0;
  let total = Number.POSITIVE_INFINITY;
  let iterationGuard = 0;

  while (offset < total && iterationGuard < 50) {
    iterationGuard += 1;

    const response = await fetch(
      `${API_BASE_URL}/news?limit=${limit}&offset=${offset}`,
      {
        headers: API_HEADERS,
        cache: 'no-store',
      },
    ).catch(() => null);

    if (!response || !response.ok) {
      break;
    }

    const data = (await response.json()) as NewsListResponse;
    const items = Array.isArray(data.items) ? data.items : [];

    if (items.length === 0) {
      break;
    }

    for (const item of items) {
      if (!item.slug) {
        continue;
      }

      entries.push({
        url: toAbsoluteUrl(`/news/${item.slug}`),
        lastModified: toValidDate(
          item.updatedAt || item.publishedAt || item.createdAt,
        ),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }

    total =
      typeof data.total === 'number' ? data.total : offset + items.length;
    offset += limit;
  }

  return entries;
}

async function getEntityEntries(
  endpoint: string,
  getPath: (item: EntityItem) => string | null,
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
  priority: number,
): Promise<MetadataRoute.Sitemap> {
  const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
    headers: API_HEADERS,
    cache: 'no-store',
  }).catch(() => null);

  if (!response || !response.ok) {
    return [];
  }

  const data = (await response.json()) as EntityItem[];
  const items = Array.isArray(data) ? data : [];

  const entries: MetadataRoute.Sitemap = [];

  for (const item of items) {
    if (typeof item.id !== 'number') {
      continue;
    }

    const path = getPath(item);
    if (!path) {
      continue;
    }

    entries.push({
      url: toAbsoluteUrl(path),
      lastModified: toValidDate(item.updatedAt || item.createdAt),
      changeFrequency,
      priority,
    });
  }

  return entries;
}

async function getCityLandingEntries(): Promise<MetadataRoute.Sitemap> {
  const { contacts } = await getResolvedContactsPageData();
  const uniquePaths = Array.from(
    new Set(
      contacts
        .filter(contact => !contact.isDefaultCity)
        .map(contact => contact.cityHref),
    ),
  );

  return uniquePaths.map(path => ({
    url: toAbsoluteUrl(path),
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));
}

export async function getSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const staticCandidates = [
    {
      path: '/',
      pageKey: 'main',
      priority: 1.0,
      changeFrequency: 'daily' as const,
    },
    {
      path: '/events',
      pageKey: 'events',
      priority: 0.9,
      changeFrequency: 'daily' as const,
    },
    {
      path: '/weekend-game',
      pageKey: 'weekend-game',
      priority: 0.7,
      changeFrequency: 'weekly' as const,
    },
    {
      path: '/rental',
      pageKey: 'rental',
      priority: 0.8,
      changeFrequency: 'weekly' as const,
    },
    {
      path: '/workshop',
      pageKey: 'workshop',
      priority: 0.8,
      changeFrequency: 'weekly' as const,
    },
    {
      path: '/rules',
      pageKey: 'rules',
      priority: 0.7,
      changeFrequency: 'monthly' as const,
    },
    {
      path: '/contacts',
      pageKey: 'contacts',
      priority: 0.7,
      changeFrequency: 'monthly' as const,
    },
    {
      path: '/about',
      pageKey: 'about',
      priority: 0.6,
      changeFrequency: 'monthly' as const,
    },
    {
      path: '/what-is-airsoft',
      pageKey: 'what-is-airsoft',
      priority: 0.6,
      changeFrequency: 'monthly' as const,
    },
    {
      path: '/game-types',
      pageKey: 'game-types',
      priority: 0.6,
      changeFrequency: 'monthly' as const,
    },
    {
      path: '/gallery',
      pageKey: 'gallery',
      priority: 0.7,
      changeFrequency: 'weekly' as const,
    },
    {
      path: '/privacy-policy',
      pageKey: 'privacy',
      priority: 0.5,
      changeFrequency: 'monthly' as const,
    },
    {
      path: '/legal',
      pageKey: 'legal',
      priority: 0.5,
      changeFrequency: 'monthly' as const,
    },
    {
      path: '/payment-delivery',
      pageKey: 'payment-delivery',
      priority: 0.5,
      changeFrequency: 'monthly' as const,
    },
    {
      path: '/public-offer',
      pageKey: 'public-offer',
      priority: 0.5,
      changeFrequency: 'monthly' as const,
    },
    {
      path: '/terms',
      pageKey: 'terms',
      priority: 0.5,
      changeFrequency: 'monthly' as const,
    },
    {
      path: '/news',
      pageKey: undefined,
      priority: 0.8,
      changeFrequency: 'daily' as const,
    },
    {
      path: '/ratings',
      pageKey: 'ratings',
      priority: 0.6,
      changeFrequency: 'weekly' as const,
    },
    {
      path: '/ratings/players-rating',
      pageKey: undefined,
      priority: 0.5,
      changeFrequency: 'weekly' as const,
    },
    {
      path: '/ratings/teams-rating',
      pageKey: undefined,
      priority: 0.5,
      changeFrequency: 'weekly' as const,
    },
    {
      path: '/ratings/organizers-rating',
      pageKey: undefined,
      priority: 0.5,
      changeFrequency: 'weekly' as const,
    },
  ];

  const staticEntriesRaw = await Promise.all(
    staticCandidates.map(
      async (
        candidate,
      ): Promise<MetadataRoute.Sitemap[number] | null> => {
        const include = candidate.pageKey
          ? await shouldIncludeTemplatePage(candidate.pageKey)
          : true;

        if (!include) {
          return null;
        }

        return {
          url: toAbsoluteUrl(candidate.path),
          lastModified: new Date(),
          changeFrequency: candidate.changeFrequency,
          priority: candidate.priority,
        };
      },
    ),
  );

  const staticEntries: MetadataRoute.Sitemap = [];
  for (const entry of staticEntriesRaw) {
    if (entry) {
      staticEntries.push(entry);
    }
  }

  const [newsEntries, eventEntries, productEntries, cityEntries] = await Promise.all([
    getNewsSitemapEntries(),
    getEntityEntries(
      'events?isActive=true',
      (item) =>
        typeof item.id === 'number'
          ? getEventPath({
              id: item.id,
              name: item.name || `event-${item.id}`,
            })
          : null,
      'daily',
      0.8,
    ),
    getEntityEntries(
      'products?isActive=true',
      (item) =>
        typeof item.id === 'number' && typeof item.slug === 'string' && item.slug.length > 0
          ? getProductPath({ id: item.id, slug: item.slug })
          : typeof item.id === 'number'
            ? `/products/${item.id}`
            : null,
      'weekly',
      0.7,
    ),
    getCityLandingEntries(),
  ]);

  return [...staticEntries, ...cityEntries, ...newsEntries, ...eventEntries, ...productEntries];
}
