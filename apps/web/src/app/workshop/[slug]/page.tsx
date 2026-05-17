import { getWorkshopItemBySlug } from '@/actions/workshop-items';
import { UnionIcon } from '@/components/icons/UnionIcon';
import TitleBlock from '@/components/TitleBlock/TitleBlock';
import {
  getLocalizedAlternates,
  getRequestLocale,
  localizePath,
} from '@/app/utils/locale-seo';
import { toAbsoluteUrl } from '@/app/utils/template-metadata';
import {
  RICH_CONTENT_ALLOWED_ATTRIBUTES,
  RICH_CONTENT_ALLOWED_SCHEMES,
  RICH_CONTENT_ALLOWED_SCHEMES_BY_TAG,
  RICH_CONTENT_ALLOWED_STYLES,
  RICH_CONTENT_ALLOWED_TAGS,
} from '@/utils/rich-content-sanitize';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import sanitizeHtml from 'sanitize-html';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const locale = await getRequestLocale();
  const { slug } = await params;
  const item = await getWorkshopItemBySlug(slug);

  if (!item) {
    return {
      title: 'Послугу не знайдено | Strike Shop Action',
      robots: {
        index: false,
        follow: false,
      },
      alternates: {
        ...(await getLocalizedAlternates('/workshop', locale)),
        canonical: toAbsoluteUrl(localizePath('/workshop', locale)),
      },
    };
  }

  const canonicalPath = `/workshop/${slug}`;
  const canonical = toAbsoluteUrl(localizePath(canonicalPath, locale));

  return {
    title: `${item.title} | Майстерня Strike Shop Action`,
    description: item.excerpt,
    alternates: {
      ...(await getLocalizedAlternates(canonicalPath, locale)),
      canonical,
    },
    openGraph: {
      title: `${item.title} | Майстерня Strike Shop Action`,
      description: item.excerpt,
      url: canonical,
      images: item.coverImage
        ? [{ url: toAbsoluteUrl(item.coverImage) }]
        : undefined,
    },
  };
}

export default async function WorkshopItemDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getWorkshopItemBySlug(slug);

  if (!item) {
    notFound();
  }

  const cleanHTML = sanitizeHtml(item.content || '', {
    allowedTags: RICH_CONTENT_ALLOWED_TAGS,
    allowedAttributes: RICH_CONTENT_ALLOWED_ATTRIBUTES,
    allowedStyles: RICH_CONTENT_ALLOWED_STYLES,
    allowedSchemes: RICH_CONTENT_ALLOWED_SCHEMES,
    allowedSchemesByTag: RICH_CONTENT_ALLOWED_SCHEMES_BY_TAG,
  });

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
      <section className="grid grid-cols-1 min991:grid-cols-[60%_40%] border-b">
        <div className="relative flex flex-col justify-center p-6 min991:px-20 min991:py-11 border-b border-white min991:border-b-0">
          <TitleBlock
            title={item.title}
            subtitle={item.excerpt}
            path={[
              { label: 'Головна', href: '/' },
              { label: 'Майстерня', href: '/workshop' },
              { label: item.title },
            ]}
            className="flex-1! border-0! p-0!"
            titleClassName="text-5xl min991:text-7xl mb-0 mt-10"
            breadcrumbClassName="mb-6"
            subtitleClassName="text-sm uppercase leading-6 min991:text-base"
          >
            <UnionIcon className="hidden h-10 sm:block min991:h-12" />
          </TitleBlock>

          {item.category === 'SERVICES' && (
            <div className="mt-8">
              <Link
                href={`/workshop/services?topic=${encodeURIComponent(item.title)}`}
                className="inline-flex h-13 min-w-43 items-center justify-center bg-[#FA4616] px-10 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#e53f12]"
              >
                Замовити
              </Link>
            </div>
          )}
        </div>

        <div className="relative min-h-56 min991:min-h-80">
          <Image
            src={item.coverImage ?? '/uploads/hero-event.png'}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 991px) 100vw, 43vw"
            priority
          />
        </div>
      </section>

      <article className="flex min-h-0 flex-1 flex-col uppercase">
        <section className="grid min-h-0 flex-1 grid-cols-1">
          <div className="relative flex min-h-0 flex-col justify-center gap-8 overflow-y-auto p-6 min991:px-20 min991:py-11 border-b border-white min991:border-r">
            <div className="pb-5">
              <h2 className="text-2xl min991:text-[32px] font-medium leading-8">
                ОПИС ПОСЛУГИ
              </h2>
            </div>

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
