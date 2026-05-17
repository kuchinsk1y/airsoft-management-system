import type { Partner, FaqItem, Banner } from './common';

export interface HeroBlock {
  type: 'hero';
  image: string;
}

export interface PartnersBlock {
  type: 'partners';
  title: string;
  items: Partner[];
}

export interface FaqBlock {
  type: 'faq';
  title: string;
  items: FaqItem[];
}

export interface ReviewsBlock {
  type: 'reviews';
  title?: string;
  items: string[];
}

export interface BannerBlock {
  type: 'banners';
  title?: string;
  items: Banner[];
}

export type ContentBlock =
  | HeroBlock
  | PartnersBlock
  | FaqBlock
  | ReviewsBlock
  | BannerBlock;
