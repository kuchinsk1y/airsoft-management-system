export type WorkshopItemCategory = 'SERVICES' | 'SUPPORT'

export const WORKSHOP_ITEM_CATEGORY_OPTIONS: Array<{ value: WorkshopItemCategory; label: string }> = [
  { value: 'SERVICES', label: 'Послуги майстерні' },
  { value: 'SUPPORT', label: 'Експертна підтримка' },
]

export interface WorkshopItemAuthor {
  id: number
  nickName: string
  fullName?: string
  logoUrl?: string
}

export interface WorkshopItemUpdatedBy {
  id: number
  nickName: string
  fullName?: string
}

export interface WorkshopItem {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage?: string
  category: WorkshopItemCategory
  published: boolean
  publishedAt?: Date
  createdAt: Date
  updatedAt: Date
  author: WorkshopItemAuthor
  updatedBy?: WorkshopItemUpdatedBy
}

export interface WorkshopItemListResult {
  items: WorkshopItem[]
  total: number
  limit: number
  offset: number
}

export interface WorkshopItemListFilters {
  published?: boolean
  searchQuery?: string
  category?: WorkshopItemCategory
  limit?: number
  offset?: number
}

export interface WorkshopItemFormData {
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage: string
  category: WorkshopItemCategory | ''
  published: boolean
  publishedAt: string
}

export interface WorkshopItemUpsertPayload {
  title?: string
  slug?: string
  excerpt?: string
  content?: string
  coverImage?: string
  category?: WorkshopItemCategory
  published?: boolean
  publishedAt?: string
}

