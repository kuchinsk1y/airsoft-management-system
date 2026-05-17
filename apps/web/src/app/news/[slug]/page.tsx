import {
  getAdjacentNewsBySlug,
  getNewsBySlug,
  getNewsList,
} from '@/actions/news';
import { toAbsoluteUrl } from '@/app/utils/template-metadata';
import {
  getLocalizedAlternates,
  getRequestLocale,
  localizePath,
} from '@/app/utils/locale-seo';
import Image from 'next/image';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import sanitizeHtml from 'sanitize-html';
import {
  RICH_CONTENT_ALLOWED_ATTRIBUTES,
  RICH_CONTENT_ALLOWED_SCHEMES,
  RICH_CONTENT_ALLOWED_SCHEMES_BY_TAG,
  RICH_CONTENT_ALLOWED_STYLES,
  RICH_CONTENT_ALLOWED_TAGS,
} from '@/utils/rich-content-sanitize';
import { UnionIcon } from '@/components/icons/UnionIcon';
import TitleBlock from '@/components/TitleBlock/TitleBlock';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const locale = await getRequestLocale();
  const { slug } = await params;
  const news = await getNewsBySlug(slug);

  if (!news) {
    return {
      title: 'Новину не знайдено | Strike Shop Action',
      robots: {
        index: false,
        follow: false,
      },
      alternates: {
        ...(await getLocalizedAlternates('/news', locale)),
        canonical: toAbsoluteUrl(localizePath('/news', locale)),
      },
    };
  }

  const canonicalPath = `/news/${slug}`;
  const canonical = toAbsoluteUrl(localizePath(canonicalPath, locale));
  const title = `${news.title} | Strike Shop Action`;
  const description = news.excerpt || 'Новина Strike Shop Action.';

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
      images: news.coverImage
        ? [{ url: toAbsoluteUrl(news.coverImage) }]
        : undefined,
    },
  };
}

export default async function NewsDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const locale = await getRequestLocale();
  const { slug } = await params;
  const news = await getNewsBySlug(slug);

  if (!news) {
    notFound();
  }

  const adjacentNews = await getAdjacentNewsBySlug(slug, 2);
  const relatedNews =
    adjacentNews.length > 0
      ? adjacentNews
      : (await getNewsList({ limit: 5, offset: 0 })).items
          .filter((item) => item.slug !== slug)
          .slice(0, 4);

  const cleanHTML = sanitizeHtml(news.content || '', {
    allowedTags: RICH_CONTENT_ALLOWED_TAGS,
    allowedAttributes: RICH_CONTENT_ALLOWED_ATTRIBUTES,
    allowedStyles: RICH_CONTENT_ALLOWED_STYLES,
    allowedSchemes: RICH_CONTENT_ALLOWED_SCHEMES,
    allowedSchemesByTag: RICH_CONTENT_ALLOWED_SCHEMES_BY_TAG,
  });

  const canonicalPath = `/news/${slug}`;
  const canonicalUrl = toAbsoluteUrl(localizePath(canonicalPath, locale));
  const fallbackPublisherLogo = toAbsoluteUrl('/TopLogo.svg');
  const datePublished =
    typeof news.publishedAt === 'string'
      ? news.publishedAt
      : news.publishedAt instanceof Date
        ? news.publishedAt.toISOString()
        : typeof news.createdAt === 'string'
          ? news.createdAt
          : news.createdAt instanceof Date
            ? news.createdAt.toISOString()
            : undefined;
  const dateModified =
    typeof news.updatedAt === 'string'
      ? news.updatedAt
      : news.updatedAt instanceof Date
        ? news.updatedAt.toISOString()
        : datePublished;
  const authorName = news.author.fullName || news.author.nickName;
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: news.title,
    description: news.excerpt || 'Новина Strike Shop Action.',
    mainEntityOfPage: canonicalUrl,
    url: canonicalUrl,
    image: news.coverImage ? [toAbsoluteUrl(news.coverImage)] : undefined,
    datePublished,
    dateModified,
    articleSection: news.category,
    author: {
      '@type': 'Person',
      name: authorName,
      image: news.author.logoUrl
        ? toAbsoluteUrl(news.author.logoUrl)
        : undefined,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Strike Shop Action',
      logo: {
        '@type': 'ImageObject',
        url: fallbackPublisherLogo,
      },
    },
  };

  const proseClassName = `
            rich-content prose prose-invert max-w-none 
            prose-p:text-gray-200 
            prose-headings:text-white 
            prose-a:text-(--color-primary)
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4
            [&_li]:my-1
            [&_table]:w-full [&_table]:border-collapse [&_table]:my-6
            [&_th]:border [&_th]:border-white/40 [&_th]:p-2 [&_th]:align-top
            [&_td]:border [&_td]:border-white/30 [&_td]:p-2 [&_td]:align-top
            [&_thead_th]:bg-white/5
          `;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col border-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <section className="grid grid-cols-1 min991:grid-cols-[60%_40%]  border-b">
        <div className="relative flex flex-col justify-center p-6 min991:px-20 min991:py-11 border-b border-white min991:border-b-0">
          <TitleBlock
            title={news.title ?? 'НОВИНИ'}
            path={[
              { label: 'Головна', href: '/' },
              { label: 'Новини', href: '/news' },
              { label: news.title },
            ]}
            className="flex-1! border-0! p-0!"
            breadcrumbClassName="mb-6"
          >
            <UnionIcon className="hidden h-10 sm:block min991:h-12" />
          </TitleBlock>
        </div>
        <div className="relative min-h-56 min991:min-h-80">
          <Image
            src={news.coverImage ?? '/uploads/hero-event.png'}
            alt={news.title ?? 'Новини'}
            fill
            className="object-cover"
            sizes="(max-width: 991px) 100vw, 43vw"
            priority
          />
        </div>
      </section>

      <article className="flex min-h-0 flex-1 flex-col uppercase">
        <section className="grid min-h-0 flex-1 grid-cols-1">
          <div className="relative flex min-h-0 flex-col justify-center gap-6 overflow-y-auto p-6 min991:gap-8 min991:px-20 min991:py-11 border-b border-white min991:border-b-0 min991:border-r min991:border-white">
            <div
              className={proseClassName}
              dangerouslySetInnerHTML={{ __html: cleanHTML }}
            />
          </div>
        </section>
      </article>
    </div>
  );
}
