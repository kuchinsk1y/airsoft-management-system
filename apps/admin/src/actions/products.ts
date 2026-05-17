'use server'

/**
 * Products API
 */
import { Product, ProductFormData } from '@/app/(protected)/products/types'
import { getAuthToken } from '@/app/auth/server-utils'
import { NEXT_PUBLIC_API_URL, NEXT_PUBLIC_API_KEY } from '@/app/utils/config'

const API_URL = NEXT_PUBLIC_API_URL.replace(/\/$/, '')
const API_KEY = NEXT_PUBLIC_API_KEY

if (!API_URL || !API_KEY) {
  throw new Error('Missing required environment variables: NEXT_PUBLIC_API_URL or NEXT_PUBLIC_API_KEY')
}

const normalizeProduct = (product: Product | undefined): Product => {
  if (!product) return product as unknown as Product

  const image = (() => {
    const raw = (product.image || '').toString().trim().replace(/\\/g, '/')
    if (!raw) return ''
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
    if (raw.startsWith('/uploads')) return `${API_URL.replace(/\/$/, '')}${raw}`
    if (raw.startsWith('uploads')) return `${API_URL.replace(/\/$/, '')}/uploads/${raw.replace(/^uploads\//, '')}`
    return `${API_URL.replace(/\/$/, '')}/uploads/${raw.replace(/^\//, '')}`
  })()

  const city = product.city ? product.city : undefined

  return {
    ...(product as Product),
    image,
    city,
  }
}

/**
 * Получить все продукты
*/
export async function fetchProducts(filters?: {
  isActive?: boolean
  dealType?: 'RENT' | 'SALE'
  city?: string
  searchQuery?: string
  minPrice?: number
  maxPrice?: number
}): Promise<Product[]> {
  try {
    const params = new URLSearchParams()
    
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive))
    if (filters?.dealType) params.append('dealType', filters.dealType)
    if (filters?.city) params.append('city', filters.city)
    if (filters?.searchQuery) params.append('searchQuery', filters.searchQuery)
    if (filters?.minPrice !== undefined) params.append('minPrice', String(filters.minPrice))
    if (filters?.maxPrice !== undefined) params.append('maxPrice', String(filters.maxPrice))

    if (filters?.isActive !== undefined) {
      params.append('isActive', String(filters.isActive))
      const url = `${API_URL}/products${params.toString() ? `?${params.toString()}` : ''}`

      const response = await fetch(url, {
        headers: {
          'X-API-Key': API_KEY,
        },
        cache: 'no-store',
      })

      if (!response.ok) throw new Error(`API error: ${response.status}`)

      const data = await response.json()
      const list = Array.isArray(data) ? data : [data]
      return list.map(normalizeProduct)
    }

    const baseParams = params.toString()
    const [activeRes, inactiveRes] = await Promise.all([
      fetch(`${API_URL}/products?${baseParams ? `${baseParams}&` : ''}isActive=true`, {
        headers: {
          'X-API-Key': API_KEY,
        },
        cache: 'no-store',
      }),
      fetch(`${API_URL}/products?${baseParams ? `${baseParams}&` : ''}isActive=false`, {
        headers: {
          'X-API-Key': API_KEY,
        },
        cache: 'no-store',
      }),
    ])

    if (!activeRes.ok || !inactiveRes.ok) throw new Error(`API error: ${activeRes.status}/${inactiveRes.status}`)

    const activeData = await activeRes.json()
    const inactiveData = await inactiveRes.json()

    const activeList = Array.isArray(activeData) ? activeData : [activeData]
    const inactiveList = Array.isArray(inactiveData) ? inactiveData : [inactiveData]

    return [...activeList, ...inactiveList].map(normalizeProduct)
  } catch (error) {
    console.error('Error fetching products:', error)
    throw error
  }
}

/**
 * Получить один продукт по ID
*/
export async function fetchProduct(id: number): Promise<Product> {
  try {
    const response = await fetch(`${API_URL}/products/${id}`, {
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) throw new Error(`API error: ${response.status}`)

    const data = await response.json()
    return normalizeProduct(data)
  } catch (error) {
    console.error('Error fetching product:', error)
    throw error
  }
}

/**
 * Создать новый продукт с загрузкой изображения
*/
export async function createProductWithImage(
  data: ProductFormData,
  imageFile?: File
): Promise<Product> {
  try {
    const token = await getAuthToken()
    if (!token) {
      console.error('[createProductWithImage] No auth token')
      throw new Error('Не авторизовані')
    }

    // Сначала создаем продукт
    // data.image содержит имя файла (если выбран file.name) или путь из базы
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[createProductWithImage] Backend error:', {
        status: response.status,
        error: errorData
      })
      throw new Error(errorData?.message || `Помилка ${response.status}: ${response.statusText}`)
    }

    let product = await response.json()

    // Если есть файл - загружаем его сразу
    if (imageFile) {
      const form = new FormData()
      form.append('file', imageFile)

      const uploadResponse = await fetch(`${API_URL}/products/${product.id}/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-API-Key': API_KEY,
        },
        body: form,
      })

      if (!uploadResponse.ok) {
        const text = await uploadResponse.text().catch(() => '')
        console.error('[createProductWithImage] Image upload failed:', {
          status: uploadResponse.status,
          error: text
        })
        throw new Error(`Помилка завантаження зображення: ${text || uploadResponse.status}`)
      }

      const uploadResult = await uploadResponse.json()
      // Используем URL из ответа - это правильный путь загруженного файла
      if (uploadResult?.url) {
        product.image = uploadResult.url
      } else if (uploadResult?.product?.id) {
        product = uploadResult.product
      } else if (uploadResult?.id) {
        product = uploadResult
      }
    }

    if (product?.id) {
      const fullProductResponse = await fetch(`${API_URL}/products/${product.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-API-Key': API_KEY,
        },
      })

      if (fullProductResponse.ok) {
        const fullProduct = await fullProductResponse.json()
        product = fullProduct
      }
    } else {
      console.error('[createProductWithImage] No ID in product:', product)
    }

    return normalizeProduct(product)
  } catch (error) {
    console.error('[createProductWithImage] Exception:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Невідома помилка при створенні продукту')
  }
}

/**
 * Обновить продукт с загрузкой изображения
*/
export async function updateProductWithImage(
  id: number,
  data: Partial<ProductFormData>,
  imageFile?: File
): Promise<Product> {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Не авторизовані')

    // Если будет загружена новая картинка - отправляем имя файла
    const payload = { ...data }
    if (imageFile && 'image' in payload) payload.image = imageFile.name

    // Обновляем данные продукта
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-API-Key': API_KEY,
        },
        body: JSON.stringify(payload),
      })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[updateProductWithImage] Backend error:', {
        status: response.status,
        error: errorData
      })
      throw new Error(`API error: ${response.status}`)
    }

    let product = await response.json()

    // Если есть новый файл - загружаем его
    if (imageFile) {
      const form = new FormData()
      form.append('file', imageFile)

      const uploadResponse = await fetch(`${API_URL}/products/${id}/upload-image`, {
        method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-API-Key': API_KEY,
          },
        body: form,
      })

      if (!uploadResponse.ok) {
        const text = await uploadResponse.text().catch(() => '')
        console.error('[updateProductWithImage] Image upload failed:', {
          status: uploadResponse.status,
          error: text
        })
        throw new Error(`Помилка завантаження зображення: ${text || uploadResponse.status}`)
      }

      const uploadResult = await uploadResponse.json()
      // Используем URL из ответа как при createProductWithImage
      if (uploadResult?.url) {
        product.image = uploadResult.url
      } else if (uploadResult?.product?.id) {
        product = uploadResult.product
      } else if (uploadResult?.id) {
        product = uploadResult
      }
    }

    return normalizeProduct(product)
  } catch (error) {
    console.error('Error updating product with image:', error)
    throw error
  }
}

/**
 * Создать новый продукт
*/
export async function createProduct(data: ProductFormData): Promise<Product> {
  return createProductWithImage(data, undefined)
}

/**
 * Обновить продукт
*/
export async function updateProduct(
  id: number,
  data: Partial<ProductFormData>
): Promise<Product> {
  return updateProductWithImage(id, data, undefined)
}

/**
 * Удалить продукт
*/
export async function deleteProduct(id: number): Promise<void> {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Не авторизовані')

    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-API-Key': API_KEY,
      },
    })

    if (!response.ok) throw new Error(`API error: ${response.status}`)
  } catch (error) {
    console.error('Error deleting product:', error)
    throw error
  }
}

/**
 * Завантажити зображення продукту
*/
export async function uploadProductImage(productId: number, file: File): Promise<Product> {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Не авторизовані')

    const form = new FormData()
    form.append('file', file)

    const response = await fetch(`${API_URL}/products/${productId}/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': API_KEY,
      },
      body: form,
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(text || `API error: ${response.status}`)
    }

    const result = await response.json()
    return normalizeProduct(result.product || result)
  } catch (error) {
    console.error('Error uploading product image:', error)
    throw error
  }
}
