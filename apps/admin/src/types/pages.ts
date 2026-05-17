import type { ContentBlock } from './content';
import type { Rule } from './rules';
import type { ContactLocation } from './common';
import strict from 'node:assert/strict';

export interface PageSeoData {
  browserTitle: string
  ruBrowserTitle: string
  metaDescription: string
  ruMetaDescription: string
  ogImage: string
  index: boolean
  follow: boolean
  includeSitemap: boolean
  canonicalUrl: string
  seoText: string
  seoFaq: Array<{
    question: string
    answer: string
  }>
}

export interface MainPageData {
  title: string
  description: string
  content: ContentBlock[]
  seo: PageSeoData
}

export interface RulesPageData {
  title: string;
  description: string;
  content: Rule[];
}

export interface ContactsPageData {
  title: string;
  description: string;
  content: ContactLocation[];
}

export interface AboutPageData {
  title: string
  content: string
}
