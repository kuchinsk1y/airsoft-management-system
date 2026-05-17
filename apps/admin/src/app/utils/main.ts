import type {
  MainPageData,
  BannerBlock,
  ContentBlock,
  HeroBlock,
  PartnersBlock,
  FaqBlock,
  ReviewsBlock,
  PageSeoData,
} from '@/types'

export function buildDefaultMainSeo(title = '', description = ''): PageSeoData {
  return {
    browserTitle: title ? `${title} | Strike Shop Action` : '',
    ruBrowserTitle: '',
    metaDescription: description,
    ruMetaDescription: '',
    ogImage: '',
    index: true,
    follow: true,
    includeSitemap: true,
    canonicalUrl: '/',
    seoText: '',
    seoFaq: [],
  }
}

function normalizeSeoFaq(value: unknown): Array<{ question: string; answer: string }> {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      if (typeof item !== 'object' || item === null) {
        return { question: '', answer: '' }
      }

      const obj = item as Record<string, unknown>
      return {
        question: typeof obj.question === 'string' ? obj.question : '',
        answer: typeof obj.answer === 'string' ? obj.answer : '',
      }
    })
    .filter((item) => item.question.trim().length > 0 || item.answer.trim().length > 0)
}

export function normalizeMainSeo(seo: Partial<PageSeoData> | undefined, title = '', description = ''): PageSeoData {
  const defaults = buildDefaultMainSeo(title, description)
  return {
    browserTitle: typeof seo?.browserTitle === 'string' ? seo.browserTitle : defaults.browserTitle,
    ruBrowserTitle: typeof seo?.ruBrowserTitle === 'string' ? seo.ruBrowserTitle : defaults.ruBrowserTitle,
    metaDescription: typeof seo?.metaDescription === 'string' ? seo.metaDescription : defaults.metaDescription,
    ruMetaDescription: typeof seo?.ruMetaDescription === 'string' ? seo.ruMetaDescription : defaults.ruMetaDescription,
    ogImage: typeof seo?.ogImage === 'string' ? seo.ogImage : defaults.ogImage,
    index: typeof seo?.index === 'boolean' ? seo.index : defaults.index,
    follow: typeof seo?.follow === 'boolean' ? seo.follow : defaults.follow,
    includeSitemap: typeof seo?.includeSitemap === 'boolean' ? seo.includeSitemap : defaults.includeSitemap,
    canonicalUrl: typeof seo?.canonicalUrl === 'string' ? seo.canonicalUrl : defaults.canonicalUrl,
    seoText: typeof seo?.seoText === 'string' ? seo.seoText : defaults.seoText,
    seoFaq: normalizeSeoFaq(seo?.seoFaq),
  }
}

export function blockByType<T extends ContentBlock>(
  data: MainPageData,
  type: string,
): T | undefined {
  return data.content.find((b) => b.type === type) as T | undefined;
}

export function hasMainMetaChanged(
  cur: MainPageData,
  init: MainPageData,
): boolean {
  return cur.title !== init.title || cur.description !== init.description;
}

export function hasMainSeoChanged(cur: MainPageData, init: MainPageData): boolean {
  const fields: Array<keyof PageSeoData> = [
    'browserTitle',
    'ruBrowserTitle',
    'metaDescription',
    'ruMetaDescription',
    'ogImage',
    'index',
    'follow',
    'includeSitemap',
    'canonicalUrl',
    'seoText',
    'seoFaq',
  ]

  for (const field of fields) {
    if (field === 'seoFaq') {
      if (JSON.stringify(cur.seo.seoFaq) !== JSON.stringify(init.seo.seoFaq)) return true
      continue
    }

    if (cur.seo[field] !== init.seo[field]) return true
  }

  return false
}

export function hasHeroChanged(cur: MainPageData, init: MainPageData): boolean {
  const c = blockByType<HeroBlock>(cur, 'hero');
  const i = blockByType<HeroBlock>(init, 'hero');
  return (i?.image || null) !== (c?.image || null);
}

export function hasPartnersChanged(
  cur: MainPageData,
  init: MainPageData,
): boolean {
  const c = blockByType<PartnersBlock>(cur, 'partners')?.items || [];
  const i = blockByType<PartnersBlock>(init, 'partners')?.items || [];
  if (i.length !== c.length) return true;
  for (let idx = 0; idx < i.length; idx++) {
    const a = i[idx];
    const b = c[idx];
    if (!b) return true;
    if (a.logo !== b.logo || a.link !== b.link || a.alt !== b.alt) return true;
  }
  return false;
}

export function hasBannersChanged(
  cur: MainPageData,
  init: MainPageData,
): boolean {
  const c = blockByType<BannerBlock>(cur, 'banners')?.items || [];
  const i = blockByType<BannerBlock>(init, 'banners')?.items || [];

  if (i.length !== c.length) return true;

  for (let idx = 0; idx < i.length; idx++) {
    const a = i[idx];
    const b = c[idx];

    if (!b) return true;

    if (
      a.title !== b.title ||
      a.image !== b.image ||
      a.description !== b.description ||
      a.link !== b.link ||
      a.isActive !== b.isActive
    ) {
      return true;
    }
  }

  return false;
}

export function hasFaqChanged(cur: MainPageData, init: MainPageData): boolean {
  const c = blockByType<FaqBlock>(cur, 'faq')?.items || [];
  const i = blockByType<FaqBlock>(init, 'faq')?.items || [];
  if (i.length !== c.length) return true;
  for (let idx = 0; idx < i.length; idx++) {
    const a = i[idx];
    const b = c[idx];
    if (!b) return true;
    if (a.question !== b.question || a.answer !== b.answer) return true;
  }
  return false;
}

export function hasReviewsChanged(
  cur: MainPageData,
  init: MainPageData,
): boolean {
  const c = blockByType<ReviewsBlock>(cur, 'reviews')?.items || [];
  const i = blockByType<ReviewsBlock>(init, 'reviews')?.items || [];
  if (i.length !== c.length) return true;
  for (let idx = 0; idx < i.length; idx++) {
    if (i[idx] !== c[idx]) return true;
  }
  return false;
}

export function hasMainContentChanged(
  cur: MainPageData,
  init: MainPageData,
): boolean {
  if (cur.content.length !== init.content.length) return true;
  if (hasHeroChanged(cur, init)) return true;
  if (hasPartnersChanged(cur, init)) return true;
  if (hasFaqChanged(cur, init)) return true;
  if (hasReviewsChanged(cur, init)) return true;
  if (hasBannersChanged(cur, init)) return true;
  return false;
}

export function hasMainChanges(cur: MainPageData, init: MainPageData): boolean {
  return hasMainMetaChanged(cur, init) || hasMainSeoChanged(cur, init) || hasMainContentChanged(cur, init)
}

export function buildMainPatchConfig(cur: MainPageData, init: MainPageData): Record<string, unknown> {
  const cfg: Record<string, unknown> = {}
  if (cur.title !== init.title) cfg.title = cur.title
  if (cur.description !== init.description) cfg.description = cur.description
  if (hasMainSeoChanged(cur, init)) cfg.seo = cur.seo
  if (hasMainContentChanged(cur, init)) cfg.content = cur.content
  return cfg
}
