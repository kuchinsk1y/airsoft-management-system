export enum DealType {
  RENT = 'RENT',
  SALE = 'SALE',
}

export interface Product {
  id: number
  name: string
  price: number
  description: string
  image: string
  inStock: boolean
  isActive: boolean
  dealType: DealType
  cityId?: number
  city?: {
    id: number
    name: string
    slug: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface ProductFormData {
  name: string
  price: number
  description: string
  image: string
  inStock: boolean
  isActive: boolean
  dealType?: DealType
  city?: string
}
