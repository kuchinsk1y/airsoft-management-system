export type NewsCategory = 'AIRSOFT' | 'STRIKESHOP'

export const NEWS_CATEGORY_OPTIONS: Array<{ value: NewsCategory; label: string }> = [
  { value: 'AIRSOFT', label: 'Новини страйкболу' },
  { value: 'STRIKESHOP', label: 'Новини StrikeShop' },
]

export interface NewsAuthor {
  id: number
  nickName: string
  fullName?: string
  logoUrl?: string
}

export interface NewsUpdatedBy {
  id: number
  nickName: string
  fullName?: string
}

export interface NewsItem {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage?: string
  category: NewsCategory
  published: boolean
  publishedAt?: Date
  createdAt: Date
  updatedAt: Date
  author: NewsAuthor
  updatedBy?: NewsUpdatedBy
}

export interface NewsListResult {
  items: NewsItem[]
  total: number
  limit: number
  offset: number
}

export interface NewsListFilters {
  published?: boolean
  searchQuery?: string
  category?: NewsCategory
  limit?: number
  offset?: number
}

export interface NewsFormData {
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage: string
  category: NewsCategory | ''
  published: boolean
  publishedAt: string
}

export interface NewsUpsertPayload {
  title?: string
  slug?: string
  excerpt?: string
  content?: string
  coverImage?: string
  category?: NewsCategory
  published?: boolean
  publishedAt?: string
}
