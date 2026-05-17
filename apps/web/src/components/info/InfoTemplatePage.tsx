'use client';

import { getTemplate } from '@/actions/template';
import TitleBlock from '@/components/TitleBlock/TitleBlock';
import { BreadcrumbItem, TemplateData } from '@/interfaces';
import { useEffect, useState } from 'react';
import sanitizeHtml from 'sanitize-html';
import {
  RICH_CONTENT_ALLOWED_ATTRIBUTES,
  RICH_CONTENT_ALLOWED_SCHEMES,
  RICH_CONTENT_ALLOWED_SCHEMES_BY_TAG,
  RICH_CONTENT_ALLOWED_STYLES,
  RICH_CONTENT_ALLOWED_TAGS,
} from '@/utils/rich-content-sanitize';
import SeoTextBlock from '@/components/seo/SeoTextBlock';

export type InfoTemplatePageProps = {
  pageKey: string;
  fallbackTitle: string;
  breadcrumbPath: BreadcrumbItem[];
};

export default function InfoTemplatePage({
  pageKey,
  fallbackTitle,
  breadcrumbPath,
}: InfoTemplatePageProps) {
  const [title, setTitle] = useState(fallbackTitle);
  const [content, setContent] = useState('');
  const [seoText, setSeoText] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await getTemplate(pageKey);
      if (cancelled) return;

      if (result.success) {
        const data = result.data as TemplateData<string> & {
          seo?: {
            seoText?: string;
          };
        };
        if (data?.title) setTitle(data.title);
        setContent(typeof data?.content === 'string' ? data.content : '');
        setSeoText(
          typeof data?.seo?.seoText === 'string' ? data.seo.seoText : '',
        );
      }
      setLoaded(true);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [pageKey]);

  const cleanHTML = sanitizeHtml(content || '', {
    allowedTags: RICH_CONTENT_ALLOWED_TAGS,
    allowedAttributes: RICH_CONTENT_ALLOWED_ATTRIBUTES,
    allowedStyles: RICH_CONTENT_ALLOWED_STYLES,
    allowedSchemes: RICH_CONTENT_ALLOWED_SCHEMES,
    allowedSchemesByTag: RICH_CONTENT_ALLOWED_SCHEMES_BY_TAG,

    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        target: '_blank',
        rel: 'noopener noreferrer',
      }),
    },

    disallowedTagsMode: 'discard',
  });

  return (
    <>
      <TitleBlock
        title={title}
        path={breadcrumbPath}
        className="border-b-0"
        titleClassName="text-4xl min991:text-6xl wrap-break-word"
      />
      <div className="px-5 py-8 min991:px-20 min991:py-12">
        <article className="w-full">
          {!loaded ? (
            <p className="text-gray-400 text-center font-light py-10">
              Завантаження...
            </p>
          ) : content ? (
            <div
              className="rich-content max-w-none uppercase font-light text-gray-300 space-y-4 wrap-break-word
              [&_img]:h-auto [&_img]:max-w-full
              [&_p]:text-sm [&_p]:leading-6
              min640:[&_p]:text-base min640:[&_p]:leading-7
              min991:[&_p]:text-lg min991:[&_p]:leading-8
              [&_h2]:text-xl min640:[&_h2]:text-2xl min991:[&_h2]:text-3xl
              [&_h3]:text-lg min640:[&_h3]:text-xl min991:[&_h3]:text-2xl"
              dangerouslySetInnerHTML={{ __html: cleanHTML }}
            />
          ) : (
            <p className="text-gray-500 text-center font-light italic">
              Контент відсутній
            </p>
          )}
        </article>
      </div>
      <SeoTextBlock text={seoText} className="min991:px-20" />
    </>
  );
}
