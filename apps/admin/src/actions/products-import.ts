'use server'

import { z } from 'zod'
import { ProductFormData, DealType } from '@/app/(protected)/products/types'
import { createProduct } from './products'

export interface ImportResult {
  total: number
  success: number
  failed: number
  errors: Array<{ row: number; error: string }>
}

const productImportSchema = z.object({
  name: z.string().min(1, "Назва обов'язкова"),
  price: z.coerce.number().positive("Ціна повинна бути більше 0"),
  description: z.string().min(1, "Опис обов'язковий"),
  image: z.string().default('default.png'),
  inStock: z.boolean().default(true),
  isActive: z.boolean().default(true),
  dealType: z.enum([DealType.RENT, DealType.SALE]).default(DealType.RENT),
  city: z.string().optional(),
})

// Маппинг украинских названий на английские поля
const FIELD_MAPPING: Record<string, string> = {
  'назва': 'name',
  'название': 'name',
  'name': 'name',
  'ціна': 'price',
  'цена': 'price',
  'price': 'price',
  'опис': 'description',
  'описание': 'description',
  'description': 'description',
  'зображення': 'image',
  'изображение': 'image',
  'image': 'image',
  'картинка': 'image',
  'в наявності': 'inStock',
  'в наличии': 'inStock',
  'inStock': 'inStock',
  'наявність': 'inStock',
  'наличие': 'inStock',
  'активний': 'isActive',
  'активный': 'isActive',
  'isActive': 'isActive',
  'тип угоди': 'dealType',
  'тип сделки': 'dealType',
  'dealType': 'dealType',
  'тип': 'dealType',
  'місто': 'city',
  'город': 'city',
  'city': 'city',
}

const DEAL_TYPE_MAPPING: Record<string, DealType> = {
  'оренда': DealType.RENT,
  'аренда': DealType.RENT,
  'rent': DealType.RENT,
  'продаж': DealType.SALE,
  'продажа': DealType.SALE,
  'sale': DealType.SALE,
}

/**
 * Импортировать продукты из CSV
 * 
 * CSV формат (укр):
 * Назва,Ціна,Опис,Зображення,В наявності,Активний,Тип угоди,Місто
 * 
 * CSV формат (англ):
 * name,price,description,image,inStock,isActive,dealType,city
 */
export async function importProductsFromCSV(csvData: string[][]): Promise<ImportResult> {
  const result: ImportResult = {
    total: csvData.length - 1,
    success: 0,
    failed: 0,
    errors: [],
  }

  if (csvData.length < 2) {
    result.errors.push({ row: 0, error: 'CSV файл порожній або містить лише заголовки' })
    return result
  }

  const headers = csvData[0].map((h) => h.trim().toLowerCase())
  const columnMap: Record<string, number> = {}

  headers.forEach((header, index) => {
    const englishField = FIELD_MAPPING[header]
    if (englishField) columnMap[englishField] = index
  })

  const requiredFields = ['name', 'price', 'description']
  const missingFields = requiredFields.filter((field) => columnMap[field] === undefined)

  if (missingFields.length > 0) {
    result.errors.push({
      row: 1,
      error: `Відсутні обов'язкові колонки: ${missingFields.join(', ')}`,
    })
    return result
  }

  // Пропускаем заголовок
  const dataRows = csvData.slice(1)

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]
    const rowNumber = i + 2

    try {
      const name = row[columnMap.name]?.trim()
      const price = row[columnMap.price]?.trim()
      const description = row[columnMap.description]?.trim()
      const image = row[columnMap.image]?.trim()
      const inStock = row[columnMap.inStock]?.trim()
      const isActive = row[columnMap.isActive]?.trim()
      const dealType = row[columnMap.dealType]?.trim()
      const city = row[columnMap.city]?.trim()

      const parseBoolean = (value: string | undefined): boolean | undefined => {
        if (!value) return undefined
        const lower = value.toLowerCase()
        return lower === 'true' || lower === 'так' || lower === 'да' || lower === '1' || lower === 'yes'
      }

      const parsedDealType = dealType ? DEAL_TYPE_MAPPING[dealType.toLowerCase()] || DealType.RENT : DealType.RENT

      const validated = productImportSchema.parse({
        name,
        price,
        description,
        image,
        inStock: parseBoolean(inStock),
        isActive: parseBoolean(isActive),
        dealType: parsedDealType,
        city,
      })

      const productData: ProductFormData = {
        ...validated,
        city: validated.city || undefined,
      }

      await createProduct(productData)
      result.success++
    } catch (error) {
      result.failed++
      result.errors.push({
        row: rowNumber,
        error: error instanceof Error ? error.message : 'Невідома помилка',
      })
    }
  }

  return result
}
