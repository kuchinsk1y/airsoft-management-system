import type { PageSeoData } from '@/types'

const SEO_FIELDS: Array<keyof PageSeoData> = [
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

export function buildDefaultSeo(title = '', description = '', canonicalUrl = '/'): PageSeoData {
  return {
    browserTitle: title ? `${title} | Strike Shop Action` : '',
    ruBrowserTitle: '',
    metaDescription: description,
    ruMetaDescription: '',
    ogImage: '',
    index: true,
    follow: true,
    includeSitemap: true,
    canonicalUrl,
    seoText: '',
    seoFaq: [],
  }
}

export function normalizeSeo(
  seo: Partial<PageSeoData> | undefined,
  title = '',
  description = '',
  canonicalUrl = '/',
): PageSeoData {
  const defaults = buildDefaultSeo(title, description, canonicalUrl)

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

export function hasSeoChanges(current: PageSeoData, initial: PageSeoData): boolean {
  for (const field of SEO_FIELDS) {
    if (field === 'seoFaq') {
      if (JSON.stringify(current.seoFaq) !== JSON.stringify(initial.seoFaq)) return true
      continue
    }

    if (current[field] !== initial[field]) return true
  }
  return false
}