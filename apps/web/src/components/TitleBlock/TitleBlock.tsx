'use client';

import { TitleBlockProps } from '@/interfaces';
import { NEXT_PUBLIC_WEB_URL } from '@/utils/config';
import Link from 'next/link';
import React, { useLayoutEffect, useMemo } from 'react';

const TitleBlock = ({ ...props }: TitleBlockProps) => {
  const lastIndex = props.path.length - 1;
  const lastItem = lastIndex >= 0 ? props.path[lastIndex] : undefined;
  const [isShow, setIsShow] = React.useState(false);

 useLayoutEffect(() => {
  const handleResize = () => {
    setIsShow(window.innerWidth > 639);
  };
  handleResize(); 
  window.addEventListener("resize", handleResize);

  return () => window.removeEventListener("resize", handleResize);
}, []);

  const prefixItems = useMemo(
    () => props.path.slice(0, Math.max(lastIndex, 0)),
    [lastIndex, props.path],
  );

  const getItemLabel = (item: any, index: number): string => {
    return typeof item === 'string' ? item : item.label;
  };

  const getItemHref = (item: any): string | null => {
    return typeof item === 'object' && item?.href ? item.href : null;
  };

  const baseUrl = NEXT_PUBLIC_WEB_URL.replace(/\/$/, '');
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: props.path.map((item, index) => {
      const href = getItemHref(item);
      const schemaEntry: Record<string, unknown> = {
        '@type': 'ListItem',
        position: index + 1,
        name: getItemLabel(item, index),
      };

      if (href) {
        schemaEntry.item = `${baseUrl}${href}`;
      }

      return schemaEntry;
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div
        className={`flex flex-col border-b border-white p-5 min991:px-20 min991:py-14 relative ${props.className || ''}`}
      >
        <div
          className={`mb-9 uppercase text-xs font-normal ${props.breadcrumbClassName || ''}`}
        >
        <div className="relative w-full">
          {props.children && isShow && (
            <div className="absolute right-0 top-0 z-10">{props.children}</div>
          )}

          <div className={`${props.children && isShow ? 'pr-30' : ''}`}>
            {' '}
            <div className="flex flex-wrap items-baseline leading-relaxed">
              <div className="flex items-center text-gray-400 mr-2">
                {prefixItems.map((item, index) => (
                  <React.Fragment key={index}>
                    {getItemHref(item) ? (
                      <Link
                        href={getItemHref(item)!}
                        className="hover:text-white transition-colors whitespace-nowrap"
                      >
                        {getItemLabel(item, index)}
                      </Link>
                    ) : (
                      <span className="whitespace-nowrap">
                        {getItemLabel(item, index)}
                      </span>
                    )}
                    <span className="mx-2 shrink-0">&ndash;</span>
                  </React.Fragment>
                ))}
              </div>
              <div className="inline-block min-w-0">
                {lastItem &&
                  (getItemHref(lastItem) ? (
                    <Link
                      href={getItemHref(lastItem)!}
                      className="text-white hover:underline line-clamp-2 wrap-break-word"
                    >
                      {getItemLabel(lastItem, lastIndex)}
                    </Link>
                  ) : (
                    <span className="text-white line-clamp-2 wrap-break-word">
                      {getItemLabel(lastItem, lastIndex)}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </div>
        </div>

        <h1 className="font-semibold uppercase text-2xl min-[500px]:text-3xl min1127:text-4xl xl:text-5xl mb-6 mt-4 max-w-228.75">
          {props.title}
        </h1>

        {props.subtitle && (
          <p className="uppercase font-light text-base tracking-[0.05em] text-gray-300 max-w-228.75 wrap-break-word">
            {props.subtitle}
          </p>
        )}
      </div>
    </>
  );
};

export default TitleBlock;
