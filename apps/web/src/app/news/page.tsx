import { getNewsList } from '@/actions/news';
import { getTemplate } from '@/actions/template';
import { buildTemplateMetadata, toAbsoluteUrl } from '@/app/utils/template-metadata';
import { getLocalizedAlternates, getRequestLocale, localizePath } from '@/app/utils/locale-seo';
import ContactCard from '@/components/ContactCard/ContactCard';
import LatestNews from '@/components/news/LatestNews';
import { PageProps } from '@/interfaces';
import type { Metadata } from 'next';
import NewsPage from '@/pages/NewsPage';
import { getResolvedContactsPageData } from '@/utils/contacts-page-data';

const NEWS_LIMIT = 6;

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const locale = await getRequestLocale();
  const params = await searchParams;
  const offset = Number(params.offset ?? '0');
  const hasSearch = Boolean(params.searchQuery?.trim());
  const hasPagination = Number.isFinite(offset) && offset > 0;

  const metadata = await buildTemplateMetadata({
    pageKey: 'news',
    fallbackTitle: 'Новини | Strike Shop Action',
    fallbackCanonicalPath: '/news',
  });

  // Search results — noindex, canonical = base page
  if (hasSearch) {
    return {
      ...metadata,
      alternates: {
        ...(await getLocalizedAlternates('/news', locale)),
        canonical: toAbsoluteUrl(localizePath('/news', locale)),
      },
      robots: { index: false, follow: true },
    };
  }

  // Pagination pages — index: true, title includes page number, canonical = current URL
  if (hasPagination) {
    const pageNumber = Math.floor(offset / NEWS_LIMIT) + 1;
    const rawTitle = typeof metadata.title === 'string' ? metadata.title : 'Новини';
    const rawDescription =
      typeof metadata.description === 'string' && metadata.description.trim().length > 0
        ? metadata.description.trim()
        : 'Новини Strike Shop Action.';
    const baseTitle = rawTitle.endsWith(' | Strike Shop Action')
      ? rawTitle.slice(0, -' | Strike Shop Action'.length).trimEnd()
      : rawTitle;
    const paginatedTitle = `${baseTitle} – сторінка ${pageNumber} | Strike Shop Action`;
    const paginatedDescription = `${rawDescription} - сторінка ${pageNumber}`;
    const canonicalPath = `${localizePath('/news', locale)}?offset=${offset}`;
    const canonicalUrl = toAbsoluteUrl(canonicalPath);

    return {
      ...metadata,
      title: paginatedTitle,
      description: paginatedDescription,
      alternates: {
        ...(await getLocalizedAlternates('/news', locale)),
        canonical: canonicalUrl,
      },
      robots: { index: true, follow: true },
      openGraph: {
        ...metadata.openGraph,
        title: paginatedTitle,
        description: paginatedDescription,
        url: canonicalUrl,
      },
    };
  }

  return metadata;
}


export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const searchQuery = params.searchQuery?.trim() || '';
  const category =
    params.category === 'AIRSOFT' || params.category === 'STRIKESHOP'
      ? params.category
      : undefined;
  const offsetRaw = Number(params.offset);
  const offset = Number.isFinite(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;
  const limit = NEWS_LIMIT;
  const currentPage = Math.floor(offset / limit);
  const shouldReuseLatestFromMainFeed = offset === 0 && !searchQuery;
  const latestNewsPromise = shouldReuseLatestFromMainFeed
    ? Promise.resolve(null)
    : getNewsList({ limit: 4, offset: 0 });

  const [dataNews, latestDataNews, newsTemplateResult, contactsPageData] = await Promise.all([
    getNewsList({ limit, offset, searchQuery, category }),
    latestNewsPromise,
    getTemplate('news'),
    getResolvedContactsPageData(),
  ]);
  const contacts = contactsPageData.contacts;

  const newsTemplate = newsTemplateResult.success
    ? (newsTemplateResult.data as Record<string, unknown>)
    : null;
  const newsTitle = typeof newsTemplate?.title === 'string' ? newsTemplate.title : undefined;
  const newsHeroImage =
    typeof newsTemplate?.heroImage === 'string' ? newsTemplate.heroImage : undefined;
  const newsSeoText =
    typeof (newsTemplate?.seo as { seoText?: unknown } | undefined)?.seoText === 'string'
      ? ((newsTemplate?.seo as { seoText?: string }).seoText ?? '')
      : '';
  const paginatedTitle =
    currentPage > 0
      ? `${newsTitle ?? 'НОВИНИ'} – сторінка ${currentPage + 1}`
      : newsTitle;

  const latestNews = shouldReuseLatestFromMainFeed
    ? dataNews.items.slice(0, 4)
    : latestDataNews?.items ?? [];

  return (
    <>
      <NewsPage
        items={dataNews.items}
        total={dataNews.total}
        currentPage={currentPage}
        limit={limit}
        searchQuery={searchQuery}
        title={paginatedTitle}
        heroImage={newsHeroImage}
        seoText={newsSeoText}
      />
      <LatestNews lastNews={latestNews} />
      <div className="flex flex-col border-t border-white">
        <div className="flex items-center p-6 min991:px-20 min991:py-14 uppercase text-[32px] tracking-[8%] font-semibold py-10 border-b border-white">
          Контакти
        </div>
        <div className="flex flex-wrap">
          {contacts?.map((contact, index) => (
            <ContactCard key={index} {...contact} />
          ))}
        </div>
      </div>
    </>
  );
}
