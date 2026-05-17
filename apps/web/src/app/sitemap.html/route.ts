import { getSitemapEntries } from '../utils/sitemap-entries';
import { NEXT_PUBLIC_WEB_URL } from '@/utils/config';
import { getResolvedContactsPageData } from '@/utils/contacts-page-data';

const STRUCTURE_PATHS = [
  '/',
  '/events',
  '/weekend-game',
  '/what-is-airsoft',
  '/game-types',
  '/gallery',
  '/events/archive',
  '/rental',
  '/workshop',
  '/workshop/services',
  '/rules',
  '/privacy-policy',
  '/contacts',
  '/ratings',
  '/ratings/teams-rating',
  '/ratings/players-rating',
];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function GET(): Promise<Response> {
  const [entries, contactsPageData] = await Promise.all([
    getSitemapEntries(),
    getResolvedContactsPageData(),
  ]);
  const baseUrl = NEXT_PUBLIC_WEB_URL.replace(/\/$/, '');
  const structurePaths = new Set(STRUCTURE_PATHS);

  const structureEntriesFromSitemap = entries
    .map((entry) => entry.url)
    .filter((url) => {
      try {
        const pathname = new URL(url).pathname.replace(/\/$/, '') || '/';
        return structurePaths.has(pathname);
      } catch {
        return false;
      }
    });

  const requiredStructureEntries = STRUCTURE_PATHS.map((path) =>
    `${baseUrl}${path}`,
  );

  const cityEntries = contactsPageData.contacts
    .filter((contact) => !contact.isDefaultCity)
    .map((contact) => `${baseUrl}${contact.cityHref}`);

  const uniqueUrls = Array.from(
    new Set([...requiredStructureEntries, ...structureEntriesFromSitemap, ...cityEntries]),
  ).sort((a, b) => a.localeCompare(b));

  const linksHtml = uniqueUrls
    .map((url) => {
      const escapedUrl = escapeHtml(url);
      return `<li><a href="${escapedUrl}">${escapedUrl}</a></li>`;
    })
    .join('');

  const html = `<!doctype html>
<html lang="uk">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Карта сайту | Strike Shop Action</title>
    <style>
      body { font-family: Arial, sans-serif; background: #0b0b0b; color: #f3f3f3; margin: 0; }
      main { max-width: 960px; margin: 0 auto; padding: 24px; }
      h1 { font-size: 28px; margin-bottom: 16px; }
      p { color: #b6b6b6; margin-bottom: 20px; }
      ul { margin: 0; padding-left: 20px; }
      li { margin: 8px 0; }
      a { color: #ff6a2a; text-decoration: none; word-break: break-all; }
      a:hover { text-decoration: underline; }
    </style>
  </head>
  <body>
    <main>
      <h1>Карта сайту</h1>
      <p>Список канонічних сторінок, відкритих для індексації.</p>
      <ul>${linksHtml}</ul>
    </main>
  </body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, s-maxage=900, stale-while-revalidate=3600',
    },
  });
}
