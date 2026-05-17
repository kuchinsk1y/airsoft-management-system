'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Image from 'next/image'
import { MdAdd, MdSearch, MdFilterList, MdEdit, MdDelete, MdLocationOn, MdInventory, MdChevronLeft, MdChevronRight } from 'react-icons/md'
import ProductsImportModal from './components/ProductsImportModal'
import styles from './ListReveal.module.css'
import StatsGrid from './components/StatsGrid'
import LoadingSpinner from '../../components/LoadingSpinner'
import ProductFormModal from './components/ProductFormModal'
import DeleteConfirmModal from './components/DeleteConfirmModal'
import CSVImportButton from '../../components/CSVImportButton'
import CSVExportButton from '../../components/CSVExportButton'
import Toast, { ToastMessage } from '@/app/components/Toast'
import { Product, DealType, ProductFormData } from './types'
import * as productsApi from '@/actions/products'

const PAGE_SIZE = 25

export default function ProductsPageClient() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDealType, setFilterDealType] = useState<string>('Всі')
  const [filterCity, setFilterCity] = useState<string>('Всі')
  const [filterStock, setFilterStock] = useState<string>('Всі')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteConfirmProductId, setDeleteConfirmProductId] = useState<number | null>(null)
  const [deleteConfirmProductName, setDeleteConfirmProductName] = useState('')
  const [isDeletingProduct, setIsDeletingProduct] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const addToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
      const id = `${Date.now()}-${Math.random()}`
      setToasts((prev) => [...prev, { id, message, type }])
    },
    [],
  )

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true)
        setLoadError(null)
        const data = await productsApi.fetchProducts()
        setProducts(data)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Помилка підключення до сервера'
        setLoadError(errorMsg)
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }

    loadProducts()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterDealType, filterCity, filterStock])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (filterDealType !== 'Всі' && product.dealType !== filterDealType) return false
      if (filterCity !== 'Всі' && product.city?.name !== filterCity) return false
      if (filterStock === 'В наявності' && !product.inStock) return false
      if (filterStock === 'Немає в наявності' && product.inStock) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query)
        )
      }
      return true
    })
  }, [products, filterDealType, filterCity, filterStock, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE))
  const paginatedProducts = useMemo(
    () => filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredProducts, currentPage],
  )

  const uniqueCities = useMemo(() => {
    const cities = products.map((p) => p.city?.name).filter(Boolean) as string[]
    return ['Всі', ...Array.from(new Set(cities))]
  }, [products])

  const dealTypes = ['Всі', DealType.RENT, DealType.SALE]
  const stockTypes = ['Всі', 'В наявності', 'Немає в наявності']

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditingProduct(null)
    setIsModalOpen(true)
  }

  const handleDelete = async (productId: number) => {
    const productToDelete = products.find(p => p.id === productId)
    setDeleteConfirmProductId(productId)
    setDeleteConfirmProductName(productToDelete?.name || '')
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirmProductId) return
    
    setIsDeletingProduct(true)
    try {
      await productsApi.deleteProduct(deleteConfirmProductId)
      setProducts((prev) => prev.filter((p) => p.id !== deleteConfirmProductId))
      addToast('Продукт видалено', 'success')
    } catch (err) {
      console.error('Failed to delete product:', err)
      addToast('Помилка при видаленні продукту', 'error')
    } finally {
      setIsDeletingProduct(false)
      setDeleteConfirmOpen(false)
      setDeleteConfirmProductId(null)
      setDeleteConfirmProductName('')
    }
  }

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false)
    setDeleteConfirmProductId(null)
    setDeleteConfirmProductName('')
  }

  const handleUpsert = async (data: ProductFormData, id?: number, imageFile?: File) => {
    try {
      if (!id && !imageFile) return addToast('Будь ласка, завантажте зображення продукту', 'error')
      if (!data.name.trim()) return addToast('Вкажіть назву продукту', 'error')
      if (!data.description.trim()) return addToast('Додайте опис продукту', 'error')
      if (!data.price || data.price <= 0) return addToast('Ціна має бути більшою за 0', 'error')
      if (imageFile && !data.image) data.image = imageFile.name

      let savedProduct: Product
      if (id) {
        // Обновление с картинкой или без
        savedProduct = await productsApi.updateProductWithImage(id, data, imageFile)
        setProducts((prev) => prev.map((p) => (p.id === savedProduct.id ? savedProduct : p)))
        addToast('Продукт успішно оновлений', 'success')
      } else {
        // Создание с картинкой в одной транзакции
        savedProduct = await productsApi.createProductWithImage(data, imageFile)
        setProducts((prev) => [savedProduct, ...prev])
        addToast('Продукт успішно створений', 'success')
      }

      // Обновляем список
      const fresh = await productsApi.fetchProducts()
      setProducts(fresh)

      setIsModalOpen(false)
      setEditingProduct(null)
    } catch (err) {
      console.error('Failed to upsert product:', err)
      addToast(id ? 'Помилка при оновленні продукту' : 'Помилка при створенні продукту', 'error')
    }
  }

  const stats = useMemo(() => {
    return {
      total: products.length,
      active: products.filter((p) => p.isActive).length,
      inStock: products.filter((p) => p.inStock).length,
      rent: products.filter((p) => p.dealType === DealType.RENT).length,
      sale: products.filter((p) => p.dealType === DealType.SALE).length,
    }
  }, [products])

  const exportHeaders = ['Назва', 'Опис', 'Ціна', 'Зображення', 'Тип угоди', 'Місто', 'В наявності', 'Статус']

  const exportData = filteredProducts.map((product) => [
    product.name,
    product.description,
    product.price ?? '',
    product.image || '',
    product.dealType || '',
    product.city?.name || '',
    product.inStock ? 'Так' : 'Ні',
    product.isActive ? 'Активний' : 'Неактивний',
  ])

  const handleExportSuccess = useCallback(() => {
    addToast('Продукти скачені у CSV', 'success')
  }, [addToast])

  const handleExportError = useCallback(
    (message: string) => {
      addToast(message, 'error')
    },
    [addToast],
  )


  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Продукти</h1>
          <p className="text-gray-400 text-sm">Керування товарами та обладнанням</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <CSVImportButton onClick={() => setIsImportOpen(true)} disabled={isLoading} />
          <CSVExportButton
            headers={exportHeaders}
            data={exportData}
            fileName="products"
            disabled={isLoading || filteredProducts.length === 0}
            onSuccess={handleExportSuccess}
            onError={handleExportError}
          />
          <button
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-(--color-primary) hover:bg-(--color-primary-hover) text-white rounded-lg font-semibold transition-colors text-sm"
            onClick={handleCreate}
          >
            <MdAdd size={20} />
            <span className="hidden sm:inline">Додати продукт</span>
            <span className="sm:hidden">Додати</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatsGrid stats={stats} />

      {/* Filters */}
      <div className="p-3 sm:p-4 rounded-xl border-2 border-white/10 bg-black/30 mb-6">
        <div className="flex items-center gap-2 text-white mb-4">
          <MdFilterList size={20} />
          <h2 className="font-semibold">Фільтри</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Search */}
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Пошук..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 text-white placeholder-gray-500 rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none text-xs sm:text-sm"
            />
          </div>

          {/* Deal Type Filter */}
          <select
            value={filterDealType}
            onChange={(e) => setFilterDealType(e.target.value)}
            title="Фільтр по типу угоди"
            className="px-4 py-2 bg-white/5 text-white rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none text-xs sm:text-sm"
          >
            {dealTypes.map((type) => (
              <option key={type} value={type}>
                {type === DealType.RENT ? 'Оренда' : type === DealType.SALE ? 'Продаж' : type}
              </option>
            ))}
          </select>

          {/* City Filter */}
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            title="Фільтр по місту"
            className="px-4 py-2 bg-white/5 text-white rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none text-xs sm:text-sm"
          >
            {uniqueCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value)}
            title="Фільтр по наявності"
            className="px-4 py-2 bg-white/5 text-white rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none text-xs sm:text-sm"
          >
            {stockTypes.map((stock) => (
              <option key={stock} value={stock}>
                {stock}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      ) : loadError ? (
        <div className="p-4 rounded-lg border-2 border-red-500/30 bg-red-500/10">
          <p className="text-red-400 text-sm font-medium">⚠️ {loadError}</p>
          <p className="text-red-400/70 text-xs mt-1">Перевірте чи запущен backend сервер на порту 3101</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 rounded-xl border-2 border-white/10 bg-black/30 text-center">
          <p className="text-gray-400 text-lg">Продукти не знайдено</p>
          <p className="text-gray-500 text-sm mt-2">Спробуйте змінити фільтри або додати новий продукт</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className={`hidden md:block rounded-xl border border-white/10 overflow-hidden overflow-y-hidden mb-4 ${styles.containerEnter}`}>
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col className="w-18" />
                <col />
                <col className="w-25" />
                <col className="w-37.5" />
                <col className="w-29.5" />
                <col className="w-26" />
                <col className="w-20" />
              </colgroup>
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Фото</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Назва</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Ціна</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Тип / Місто</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Наявність</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Статус</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Дії</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((product, index) => {
                  const imgSrc = product.image
                  return (
                    <tr
                      key={product.id}
                      className={`border-b border-white/6 last:border-0 hover:bg-white/[0.035] transition-colors duration-150 ${styles.rowReveal}`}
                      style={{ animationDelay: `${Math.min(index * 28, 280)}ms` }}
                    >
                      <td className="px-3 py-2.5">
                        <div className="w-13 h-13 relative rounded-lg overflow-hidden bg-white/5 border border-white/10 shrink-0">
                          {imgSrc ? (
                            <Image
                              src={imgSrc}
                              alt={product.name}
                              fill
                              sizes="52px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                              <MdInventory size={22} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="font-semibold text-white truncate leading-snug" title={product.name}>{product.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{product.description}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-(--color-primary) font-bold whitespace-nowrap">{product.price} грн</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-1 ${
                            product.dealType === DealType.RENT
                              ? 'bg-(--color-primary)/15 text-(--color-primary)'
                              : 'bg-purple-500/15 text-purple-300'
                          }`}
                        >
                          {product.dealType === DealType.RENT ? 'Оренда' : 'Продаж'}
                        </span>
                        {product.city && (
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <MdLocationOn size={12} className="text-gray-500 shrink-0" />
                            <span className="truncate">{product.city.name}</span>
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                            product.inStock ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${ product.inStock ? 'bg-green-400' : 'bg-red-400'}`} />
                          {product.inStock ? 'Є' : 'Немає'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                            product.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-500/15 text-gray-400'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${product.isActive ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                          {product.isActive ? 'Актив.' : 'Неакт.'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(product)}
                            title="Редагувати"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <MdEdit size={17} />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            title="Видалити"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <MdDelete size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className={`md:hidden space-y-2.5 mb-4 ${styles.containerEnter}`}>
            {paginatedProducts.map((product, index) => {
              const imgSrc = product.image
              return (
                <div
                  key={product.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-black/30 hover:bg-white/4 transition-colors ${styles.cardReveal}`}
                  style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
                >
                  <div className="w-14 h-14 relative rounded-lg overflow-hidden bg-white/5 border border-white/10 shrink-0">
                    {imgSrc ? (
                      <Image src={imgSrc} alt={product.name} fill sizes="56px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <MdInventory size={22} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate leading-snug">{product.name}</p>
                    <p className="text-(--color-primary) font-bold text-sm mt-0.5">{product.price} грн</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                          product.dealType === DealType.RENT
                            ? 'bg-(--color-primary)/15 text-(--color-primary)'
                            : 'bg-purple-500/15 text-purple-300'
                        }`}
                      >
                        {product.dealType === DealType.RENT ? 'Оренда' : 'Продаж'}
                      </span>
                      {product.city && (
                        <span className="text-xs text-gray-400 flex items-center gap-0.5">
                          <MdLocationOn size={11} />
                          {product.city.name}
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs ${
                          product.inStock ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${product.inStock ? 'bg-green-400' : 'bg-red-400'}`} />
                        {product.inStock ? 'Є' : 'Немає'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => handleEdit(product)}
                      title="Редагувати"
                      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <MdEdit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      title="Видалити"
                      className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <MdDelete size={18} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-2 px-1">
              <p className="text-gray-400 text-sm order-2 sm:order-1">
                Показано{' '}
                <span className="text-white font-medium">
                  {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredProducts.length)}
                </span>
                {' '}з{' '}
                <span className="text-white font-medium">{filteredProducts.length}</span>
              </p>
              <div className="flex items-center gap-1 order-1 sm:order-2">
                <button
                  onClick={() => setCurrentPage((p) => p - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Попередня сторінка"
                >
                  <MdChevronLeft size={20} />
                </button>
                {(() => {
                  const pages: (number | '\u2026')[] = []
                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i)
                  } else {
                    pages.push(1)
                    if (currentPage > 3) pages.push('\u2026')
                    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i)
                    if (currentPage < totalPages - 2) pages.push('\u2026')
                    pages.push(totalPages)
                  }
                  return pages.map((p, i) =>
                    p === '\u2026' ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-gray-600 text-sm select-none">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p as number)}
                        className={`min-w-8.5 h-8.5 rounded-lg text-sm font-medium transition-colors ${
                          p === currentPage
                            ? 'bg-(--color-primary) text-white shadow-sm'
                            : 'text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )
                })()}
                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Наступна сторінка"
                >
                  <MdChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingProduct(null)
        }}
        onSubmit={handleUpsert}
        initialProduct={editingProduct || undefined}
      />

      <DeleteConfirmModal
        isOpen={deleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        productName={deleteConfirmProductName}
        isLoading={isDeletingProduct}
      />

      {/* Import Modal */}
      <ProductsImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => window.location.reload()}
      />

      {/* Toast Notifications */}
      <Toast messages={toasts} onRemove={removeToast} />
    </div>
  )
}
