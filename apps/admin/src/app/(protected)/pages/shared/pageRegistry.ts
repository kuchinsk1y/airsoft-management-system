import type { ComponentType } from 'react'
import {
  MdBuild,
  MdContactMail,
  MdGavel,
  MdHome,
  MdInfo,
  MdLeaderboard,
  MdNewspaper,
  MdPayment,
  MdPrivacyTip,
} from 'react-icons/md'

export type PageSection = 'basic' | 'info'

export interface PageCardConfig {
  id: string
  section: PageSection
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
  href: string
  editable: boolean
}

export interface TemplatePageEditorConfig {
  key: string
  defaultTitle: string
  editorTitle: string
  editorSubtitle: string
  backHref: string
  canonicalPath: string
  titlePlaceholder: string
  contentPlaceholder: string
  seoHeading: string
  seoOgImagePlaceholder: string
}

const PAGE_CARDS: PageCardConfig[] = [
  {
    id: 'main',
    section: 'basic',
    title: 'Головна',
    description: 'Основна цільова сторінка сайту.',
    icon: MdHome,
    href: '/pages/basic/main',
    editable: true,
  },
  {
    id: 'about',
    section: 'basic',
    title: 'Про компанію',
    description: 'Інформація про компанію та її історію.',
    icon: MdInfo,
    href: '/pages/basic/about',
    editable: true,
  },
  {
    id: 'weekend-game',
    section: 'basic',
    title: 'Гра вихідного дня',
    description: 'Сторінка для анонсу та опису гри вихідного дня.',
    icon: MdInfo,
    href: '/pages/basic/weekend-game',
    editable: true,
  },
  {
    id: 'rules',
    section: 'basic',
    title: 'Правила страйкболу',
    description: 'Звід правил та рекомендацій для гравців.',
    icon: MdGavel,
    href: '/pages/basic/rules',
    editable: true,
  },
  {
    id: 'workshop',
    section: 'basic',
    title: 'Майстерня Strikeshop',
    description: 'Послуги з ремонту та тюнінгу обладнання.',
    icon: MdBuild,
    href: '/pages/basic/workshop',
    editable: true,
  },
  {
    id: 'contacts',
    section: 'basic',
    title: 'Контакти',
    description: 'Адреси, телефони та карта проїзду.',
    icon: MdContactMail,
    href: '/pages/basic/contacts',
    editable: true,
  },
  {
    id: 'ratings',
    section: 'basic',
    title: 'Рейтинги',
    description: 'Головна сторінка рейтингових таблиць.',
    icon: MdLeaderboard,
    href: '/pages/basic/ratings',
    editable: true,
  },
  {
    id: 'privacy',
    section: 'info',
    title: 'Політика конфіденційності',
    description: 'Правила обробки персональних даних користувачів.',
    icon: MdPrivacyTip,
    href: '/pages/info/privacy',
    editable: true,
  },
  {
    id: 'news',
    section: 'info',
    title: 'Новини',
    description: 'Заголовок та головне зображення сторінки новин.',
    icon: MdNewspaper,
    href: '/pages/info/news',
    editable: true,
  },
  {
    id: 'gallery',
    section: 'info',
    title: 'Галерея',
    description: 'Заголовок, опис та SEO сторінки галереї.',
    icon: MdNewspaper,
    href: '/pages/info/gallery',
    editable: true,
  },
  {
    id: 'terms',
    section: 'info',
    title: 'Політика користування сайтом',
    description: 'Умови використання сайту та сервісів.',
    icon: MdGavel,
    href: '/pages/info/terms',
    editable: true,
  },
  {
    id: 'public-offer',
    section: 'info',
    title: 'Договір публічної оферти',
    description: 'Публічна оферта та умови укладення договору.',
    icon: MdGavel,
    href: '/pages/info/public-offer',
    editable: true,
  },
  {
    id: 'payment',
    section: 'info',
    title: 'Оплата і доставка',
    description: 'Способи оплати, терміни та умови доставки.',
    icon: MdPayment,
    href: '/pages/info/payment',
    editable: true,
  },
  {
    id: 'legal',
    section: 'info',
    title: 'Статутні документи',
    description: 'Юридична інформація та документація компанії.',
    icon: MdGavel,
    href: '/pages/info/legal',
    editable: true,
  },
  {
    id: 'what-is-airsoft',
    section: 'info',
    title: 'Що таке страйкбол',
    description: 'Базова інформація про страйкбол для нових гравців.',
    icon: MdInfo,
    href: '/pages/info/what-is-airsoft',
    editable: true,
  },
  {
    id: 'game-types',
    section: 'info',
    title: 'Типи ігор',
    description: 'Опис форматів і типів страйкбольних ігор.',
    icon: MdInfo,
    href: '/pages/info/game-types',
    editable: true,
  },
]

const TEMPLATE_PAGE_EDITORS: Record<string, TemplatePageEditorConfig> = {
  about: {
    key: 'about',
    defaultTitle: 'Про компанію',
    editorTitle: 'Про компанію',
    editorSubtitle: 'Редагування заголовка та контенту сторінки',
    backHref: '/pages/basic',
    canonicalPath: '/about',
    titlePlaceholder: 'Наприклад: Про компанію',
    contentPlaceholder: '',
    seoHeading: 'SEO налаштування сторінки Про компанію',
    seoOgImagePlaceholder: '/uploads/og-about.jpg',
  },
  'weekend-game': {
    key: 'weekend-game',
    defaultTitle: 'Гра вихідного дня',
    editorTitle: 'Гра вихідного дня',
    editorSubtitle: 'Редагування заголовка та контенту сторінки',
    backHref: '/pages/basic',
    canonicalPath: '/weekend-game',
    titlePlaceholder: 'Наприклад: Гра вихідного дня',
    contentPlaceholder: '',
    seoHeading: 'SEO налаштування сторінки Гра вихідного дня',
    seoOgImagePlaceholder: '/uploads/og-weekend-game.jpg',
  },
  privacy: {
    key: 'privacy',
    defaultTitle: 'Політика конфіденційності',
    editorTitle: 'Політика конфіденційності',
    editorSubtitle: 'Редагування заголовка, контенту та SEO',
    backHref: '/pages/info',
    canonicalPath: '/privacy-policy',
    titlePlaceholder: 'Наприклад: Політика конфіденційності',
    contentPlaceholder: '',
    seoHeading: 'SEO налаштування сторінки Політика конфіденційності',
    seoOgImagePlaceholder: '/uploads/og-privacy.jpg',
  },
  terms: {
    key: 'terms',
    defaultTitle: 'Політика користування сайтом',
    editorTitle: 'Політика користування сайтом',
    editorSubtitle: 'Редагування заголовка, контенту та SEO',
    backHref: '/pages/info',
    canonicalPath: '/terms-of-use',
    titlePlaceholder: 'Наприклад: Політика користування сайтом',
    contentPlaceholder: '',
    seoHeading: 'SEO налаштування сторінки Політика користування сайтом',
    seoOgImagePlaceholder: '/uploads/og-terms.jpg',
  },
  'public-offer': {
    key: 'public-offer',
    defaultTitle: 'Договір публічної оферти',
    editorTitle: 'Договір публічної оферти',
    editorSubtitle: 'Редагування заголовка, контенту та SEO',
    backHref: '/pages/info',
    canonicalPath: '/public-offer',
    titlePlaceholder: 'Наприклад: Договір публічної оферти',
    contentPlaceholder: '',
    seoHeading: 'SEO налаштування сторінки Договір публічної оферти',
    seoOgImagePlaceholder: '/uploads/og-public-offer.jpg',
  },
  payment: {
    key: 'payment',
    defaultTitle: 'Оплата і доставка',
    editorTitle: 'Оплата і доставка',
    editorSubtitle: 'Редагування заголовка, контенту та SEO',
    backHref: '/pages/info',
    canonicalPath: '/payment',
    titlePlaceholder: 'Наприклад: Оплата і доставка',
    contentPlaceholder: '',
    seoHeading: 'SEO налаштування сторінки Оплата і доставка',
    seoOgImagePlaceholder: '/uploads/og-payment.jpg',
  },
  legal: {
    key: 'legal',
    defaultTitle: 'Статутні документи',
    editorTitle: 'Статутні документи',
    editorSubtitle: 'Редагування заголовка, контенту та SEO',
    backHref: '/pages/info',
    canonicalPath: '/legal',
    titlePlaceholder: 'Наприклад: Статутні документи',
    contentPlaceholder: '',
    seoHeading: 'SEO налаштування сторінки Статутні документи',
    seoOgImagePlaceholder: '/uploads/og-legal.jpg',
  },
  'what-is-airsoft': {
    key: 'what-is-airsoft',
    defaultTitle: 'Що таке страйкбол',
    editorTitle: 'Що таке страйкбол',
    editorSubtitle: 'Редагування заголовка, контенту та SEO',
    backHref: '/pages/info',
    canonicalPath: '/what-is-airsoft',
    titlePlaceholder: 'Наприклад: Що таке страйкбол',
    contentPlaceholder: '',
    seoHeading: 'SEO налаштування сторінки Що таке страйкбол',
    seoOgImagePlaceholder: '/uploads/og-what-is-airsoft.jpg',
  },
  'game-types': {
    key: 'game-types',
    defaultTitle: 'Типи ігор',
    editorTitle: 'Типи ігор',
    editorSubtitle: 'Редагування заголовка, контенту та SEO',
    backHref: '/pages/info',
    canonicalPath: '/game-types',
    titlePlaceholder: 'Наприклад: Типи ігор',
    contentPlaceholder: '',
    seoHeading: 'SEO налаштування сторінки Типи ігор',
    seoOgImagePlaceholder: '/uploads/og-game-types.jpg',
  },
  news: {
    key: 'news',
    defaultTitle: 'Новини',
    editorTitle: 'Новини',
    editorSubtitle: 'Редагування заголовка, зображення та SEO сторінки новин',
    backHref: '/pages/info',
    canonicalPath: '/news',
    titlePlaceholder: 'Наприклад: Новини',
    contentPlaceholder: '',
    seoHeading: 'SEO налаштування сторінки Новини',
    seoOgImagePlaceholder: '/uploads/og-news.jpg',
  },
  gallery: {
    key: 'gallery',
    defaultTitle: 'ГАЛЕРЕЯ',
    editorTitle: 'Галерея',
    editorSubtitle: 'Редагування заголовка, опису та SEO сторінки галереї',
    backHref: '/pages/info',
    canonicalPath: '/gallery',
    titlePlaceholder: 'Наприклад: Галерея',
    contentPlaceholder: 'Короткий опис під заголовком сторінки галереї',
    seoHeading: 'SEO налаштування сторінки Галерея',
    seoOgImagePlaceholder: '/uploads/og-gallery.jpg',
  },
}

export function getPageCardsBySection(section: PageSection): PageCardConfig[] {
  return PAGE_CARDS.filter((page) => page.section === section)
}

export function getTemplatePageEditorConfig(key: string): TemplatePageEditorConfig {
  const config = TEMPLATE_PAGE_EDITORS[key]

  if (!config) {
    throw new Error(`Unknown template page key: ${key}`)
  }

  return config
}
