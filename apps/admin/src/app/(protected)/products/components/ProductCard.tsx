'use client'

import Image from 'next/image'
import { MdEdit, MdDelete, MdLocationOn, MdInventory } from 'react-icons/md'
import { NEXT_PUBLIC_API_URL } from '@/app/utils/config'
import { Product, DealType } from '../types'

interface ProductCardProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (productId: number) => void
  isLoading?: boolean
}

export default function ProductCard({ product, onEdit, onDelete, isLoading = false }: ProductCardProps) {
  const apiUrl = NEXT_PUBLIC_API_URL.replace(/\/$/, '')
  const imageSrc = (() => {
    if (!product.image) return ''
    const raw = product.image.trim().replace(/\\/g, '/')
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
    if (raw.startsWith('/uploads')) return `${apiUrl}${raw}`
    if (raw.startsWith('uploads')) return `${apiUrl}/uploads/${raw.replace(/^uploads\//, '')}`
    return `${apiUrl}/uploads/${raw.replace(/^\//, '')}`
  })()

  return (
    <div className="bg-black/30 border-2 border-white/10 rounded-xl overflow-hidden shadow-lg shadow-black/20 hover:shadow-black/30 transition-all duration-200 group">
      {/* Image */}
      <div className="relative w-full h-40 sm:h-48 bg-linear-to-b from-gray-900 to-black overflow-hidden">
        {imageSrc ? (
          <Image 
            src={imageSrc} 
            alt={product.name} 
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <MdInventory size={48} />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3 flex gap-2">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              product.isActive ? 'bg-green-900/80 text-green-200' : 'bg-gray-900/80 text-gray-300'
            }`}
          >
            {product.isActive ? 'Активний' : 'Неактивний'}
          </span>
        </div>

        {/* Deal Type Badge */}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-(--color-primary)/80 text-white">
            {product.dealType === DealType.RENT ? 'Оренда' : 'Продаж'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 space-y-3">
        {/* Title */}
        <h3 className="text-base sm:text-lg font-semibold text-white truncate" title={product.name}>
          {product.name}
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-gray-400 line-clamp-2 min-h-10">
          {product.description}
        </p>

        {/* Details */}
        <div className="space-y-2 pt-2">
          {/* City */}
          {product.city && (
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <MdLocationOn className="text-(--color-primary) shrink-0" size={16} />
              <span className="text-gray-300">{product.city.name}</span>
            </div>
          )}

          {/* Stock Status */}
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <MdInventory className="text-(--color-primary) shrink-0" size={16} />
            <span className={product.inStock ? 'text-green-400' : 'text-red-400'}>
              {product.inStock ? 'В наявності' : 'Немає в наявності'}
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-gray-400 text-xs sm:text-sm">Ціна:</span>
            <span className="text-(--color-primary) font-bold text-base sm:text-lg">
              {product.price} грн
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-white/10">
          <button
            onClick={() => onEdit(product)}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-900/50 hover:bg-(--color-primary)/10 hover:text-(--color-primary) text-gray-400 rounded-lg transition-colors disabled:opacity-50 text-xs sm:text-sm font-semibold"
            aria-label="Редагувати"
          >
            <MdEdit size={16} />
            <span className="hidden sm:inline">Редагувати</span>
          </button>
          <button
            onClick={() => onDelete(product.id)}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-900/50 hover:bg-red-500/10 hover:text-red-400 text-gray-400 rounded-lg transition-colors disabled:opacity-50 text-xs sm:text-sm font-semibold"
            aria-label="Видалити"
          >
            <MdDelete size={16} />
            <span className="hidden sm:inline">Видалити</span>
          </button>
        </div>
      </div>
    </div>
  )
}
