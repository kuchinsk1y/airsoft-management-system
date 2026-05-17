import type { PageSeoData } from './pages'

export interface WorkshopCardData {
  image: string
  title: string
  description: string
}

export interface WorkshopServicesBlock {
  type: 'services'
  title: string
  items: WorkshopCardData[]
}

export interface WorkshopSupportBlock {
  type: 'support'
  title: string
  items: WorkshopCardData[]
}

export interface WorkshopContactsBlock {
  type: 'contacts'
  title: string
  address: string[]
  phone: string[]
  workingHours: string[]
}

export type WorkshopContentBlock =
  | WorkshopServicesBlock
  | WorkshopSupportBlock
  | WorkshopContactsBlock

export interface WorkshopPageData {
  title: string
  description: string
  heroImage: string
  seo: PageSeoData
  content: WorkshopContentBlock[]
}
