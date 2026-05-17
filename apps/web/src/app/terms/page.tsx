import { getTemplate } from '@/actions/template';
import BreadCrumbs from '@/components/Profile/BreadCrumbs';
import { Metadata } from 'next';
import sanitizeHtml from 'sanitize-html';
import { buildTemplateMetadata } from '@/app/utils/template-metadata';
import {
  RICH_CONTENT_ALLOWED_ATTRIBUTES,
  RICH_CONTENT_ALLOWED_SCHEMES,
  RICH_CONTENT_ALLOWED_SCHEMES_BY_TAG,
  RICH_CONTENT_ALLOWED_STYLES,
  RICH_CONTENT_ALLOWED_TAGS,
} from '@/utils/rich-content-sanitize';
import BannerJoin from '@/components/generics/banners/BannerJoin';
import SeoTextBlock from '@/components/seo/SeoTextBlock';

interface TermsTemplateConfig {
  success: boolean;
  data: {
    title: string;
    content: string;
    seo?: {
      seoText?: string;
    };
  };
}

export async function generateMetadata(): Promise<Metadata> {
  return buildTemplateMetadata({
    pageKey: 'terms',
    fallbackTitle: 'Політика користування сайтом | Strike Shop Action',
    fallbackCanonicalPath: '/terms',
  });
}

export default async function TermsPage() {
  const breadcrumbsLinks = [
    { title: 'ГОЛОВНА', href: '/' },
    { title: 'ПОЛІТИКА КОРИСТУВАННЯ САЙТОМ', href: '/terms' },
  ];

  const data = await getTemplate('terms');
  if (!data.success) {
    return (
      <div className="text-center mt-4 text-[grey] ">
        Не вдалося завантажити дані політики користування сайтом.
      </div>
    );
  }

  const { title, content, seo } = (data as TermsTemplateConfig).data;

  const cleanHTML = sanitizeHtml(content || '', {
    allowedTags: RICH_CONTENT_ALLOWED_TAGS,
    allowedAttributes: RICH_CONTENT_ALLOWED_ATTRIBUTES,
    allowedStyles: RICH_CONTENT_ALLOWED_STYLES,
    allowedSchemes: RICH_CONTENT_ALLOWED_SCHEMES,
    allowedSchemesByTag: RICH_CONTENT_ALLOWED_SCHEMES_BY_TAG,
  });

  return (
    <>
      <div className="flex flex-col border-b border-white overflow-x-auto">
        <BreadCrumbs
          links={breadcrumbsLinks}
          className="border-b-0 px-5 pt-3 min991:px-20 min991:pt-12 min991:pb-3 mb-3 tracking-[-0.05em] uppercase text-xs font-normal
          [&_nav]:tracking-normal 
          [&_a]:tracking-normal 
          [&_span]:tracking-normal [&_span]:mx-0.5
          [&_nav]:gap-1"
        />

        <div className="px-5 pb-8 min991:px-20 min991:pb-12 min991:pt-0">
          <article className="w-full">
            <h1 className=" uppercase space-y-4 text-left text-5xl min991:text-6xl wrap-break-word font-semibold min991:pb-8 min991:pt-0 mb-8 min991:mb-10">
              {title}
            </h1>
            <div
              className="rich-content max-w-none w-full  uppercase font-light text-gray-300 space-y-4 wrap-break-word 
              pt-10 min991:pt-14 
              [&_a]:underline! [&_a]:underline-offset-4! [&_a]:text-white [&_a:hover]:opacity-80
              [&_img]:h-auto [&_img]:max-w-full
              [&_p]:text-sm [&_p]:leading-6
              min640:[&_p]:text-base min640:[&_p]:leading-7
              min991:[&_p]:text-lg min991:[&_p]:leading-8
              [&_h2]:text-xl min640:[&_h2]:text-2xl min991:[&_h2]:text-3xl
              [&_h3]:text-lg min640:[&_h3]:text-xl min991:[&_h3]:text-2xl
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4
              [&_li]:my-1
              [&_table]:w-full [&_table]:border-collapse [&_table]:my-6
              [&_th]:border [&_th]:border-white/40 [&_th]:p-2 [&_th]:align-top
              [&_td]:border [&_td]:border-white/30 [&_td]:p-2 [&_td]:align-top
              [&_thead_th]:bg-white/5
             "
              dangerouslySetInnerHTML={{ __html: cleanHTML }}
            />
          </article>
        </div>
      </div>
      <SeoTextBlock text={seo?.seoText} className="min991:px-20" />
      <BannerJoin pageKey="rental" />
    </>
  );
}
