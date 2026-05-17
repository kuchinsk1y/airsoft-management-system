'use client';

import { ProfileLinks } from '@/interfaces';
import { NEXT_PUBLIC_WEB_URL } from '@/utils/config';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const HOME_BREADCRUMB_LABEL = 'Страйкбол';

type BreadCrumbsProps = {
  className?: string;
} & (
  | { links: ProfileLinks[]; title?: never }
  | { title: string; links?: never }
);

export default function BreadCrumbs({
  links,
  title,
  className,
}: BreadCrumbsProps) {
  const pathname = usePathname() ?? '';
  const webBaseUrl = NEXT_PUBLIC_WEB_URL.replace(/\/$/, '');
  const toSchemaUrl = (href: string) => `${webBaseUrl}${href.startsWith('/') ? href : `/${href}`}`;

  const showCabinetArrow = 
    pathname === '/profile' ||
    pathname === '/profile/team' ||
    pathname === '/workshop' ||
    pathname === '/profile/orders' ||
    pathname === '/public-offer' ||
    pathname === '/terms' ||
    pathname.startsWith('/news/');
  

  if (title) {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: HOME_BREADCRUMB_LABEL,
          item: toSchemaUrl('/'),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: title,
          item: toSchemaUrl(pathname || '/'),
        },
      ],
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />

        <div className={`border-b border-[#FFFFFF] py-3.5 min991:py-13 px-2.5 min991:px-10 flex items-center justify-between gap-4`}>
          <nav className="flex flex-wrap items-center text-xs tracking-widest uppercase">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              {HOME_BREADCRUMB_LABEL}
            </Link>
            <span className="mx-2 text-gray-400">—</span>
            <span className="text-[#FFFFFF]">{title}</span>
          </nav>
          <img
            src="/Union-event.svg"
            alt=""
            aria-hidden
            className="hidden min-[420px]:block w-[84.45px] h-8.25 pointer-events-none select-none"
          />
        </div>
      </>
    );
  }

  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbLinks = links ?? [];

  const crumbs = segments
    .map((_, i) => '/' + segments.slice(0, i + 1).join('/'))
    .map((href) => {
      const match = breadcrumbLinks.find((link) => link.href === href);
      let label = match
        ? match.title
        : (href.split('/').pop()?.toUpperCase() ?? href);

      if (href.startsWith('/profile') && href === '/profile') {
        label = 'ОСОБИСТИЙ КАБІНЕТ';
      }
      if (href === '/profile/orders') {
        label = 'МОЇ ЗАМОВЛЕННЯ';
      }

      return {
        href,
        label,
      };
    });

  const schemaItems = title
    ? [
        {
          href: '/',
          label: HOME_BREADCRUMB_LABEL,
        },
        {
          href: pathname || '/',
          label: title,
        },
      ]
    : [
        {
          href: '/',
          label: HOME_BREADCRUMB_LABEL,
        },
        ...crumbs,
      ];

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: schemaItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: toSchemaUrl(item.href),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className={`border-b border-[#FFFFFF] py-3.5 min991:py-13 px-2.5 min991:px-10 flex items-center justify-between gap-4 ${className}`}>
        <nav className="flex flex-wrap items-center text-[#999999] text-xs tracking-widest uppercase">
          <Link href="/" className=" hover:text-white transition-colors">
            {HOME_BREADCRUMB_LABEL}
          </Link>

          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;

            return (
              <div key={crumb.href}
              className={`flex items-center ${isLast ? 'flex-1 min-w-0' : 'shrink-0'}`}
              >
                <span className="mx-2 shrink-0">—</span>

                {isLast ? (
                  <span className="text-[#FFFFFF] truncate min-w-0 block">{crumb.label}</span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {crumb.label}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        {showCabinetArrow ? (
          <img
            src="/Union-event.svg"
            alt=""
            aria-hidden="true"
            className="hidden min-[461px]:block w-[84.45px] h-8.25 pointer-events-none select-none"
          />
        ) : null}
      </div>
    </>
  );
}
