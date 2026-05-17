'use client'

import { ApplicationResponse, createApplication } from '@/actions/applications'
import LoadingSpinner from '@/app/components/LoadingSpinner'
import { useApplication } from '@/contexts/ApplicationContext'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { MdClose } from 'react-icons/md'

interface CreateApplicationFormProps {
  onSuccess?: (app: ApplicationResponse) => void
}

export default function CreateApplicationForm({ onSuccess }: CreateApplicationFormProps) {
  const router = useRouter()
  const { refreshApplications } = useApplication()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phoneNumber: '',
    description: '',
  })

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target
      setFormData((prev) => ({ ...prev, [name]: value }))
    },
    []
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setError(null)

      if (!formData.name.trim()) return setError('Назва організації обовязкова')

      try {
        setIsLoading(true)
        const newApp = await createApplication({
          name: formData.name,
          address: formData.address || undefined,
          phoneNumber: formData.phoneNumber || undefined,
          description: formData.description || undefined,
        })

        const { isAdmin } = await refreshApplications()

        localStorage.removeItem('createAppModalDismissed')

        await new Promise(resolve => setTimeout(resolve, 100))

        if (onSuccess) onSuccess(newApp)

        router.push(isAdmin ? '/dashboard' : '/events')
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Помилка при створенні організації'
        setError(errorMsg)
        console.error('Failed to create application:', err)
      } finally {
        setIsLoading(false)
      }
    },
    [formData, onSuccess, router, refreshApplications]
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-100/10 rounded-lg flex items-start gap-2">
          <MdClose className="shrink-0 mt-0.5" size={16} />
          <p>{error}</p>
        </div>
      )}

      {/* Назва */}
      <label className="flex flex-col">
        <p className="text-white text-base font-medium pb-2">
          Назва організації <span className="text-red-500">*</span>
        </p>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="StrikeShop Team"
          className="form-input w-full rounded-lg p-4 text-white bg-transparent border border-white/30 focus:outline-none focus:ring-1 focus:ring-orange-500"
          disabled={isLoading}
        />
      </label>

      {/* Адреса */}
      <label className="flex flex-col">
        <p className="text-white text-base font-medium pb-2">
          Адреса
        </p>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          placeholder="вул. Головна, 123"
          className="form-input w-full rounded-lg p-4 text-white bg-transparent border border-white/30 focus:outline-none focus:ring-1 focus:ring-orange-500"
          disabled={isLoading}
        />
      </label>

      {/* Контактний номер */}
      <label className="flex flex-col">
        <p className="text-white text-base font-medium pb-2">
          Контактний номер
        </p>
        <input
          type="tel"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleInputChange}
          placeholder="+380671112233"
          className="form-input w-full rounded-lg p-4 text-white bg-transparent border border-white/30 focus:outline-none focus:ring-1 focus:ring-orange-500"
          disabled={isLoading}
        />
      </label>

      {/* Опис */}
      <label className="flex flex-col">
        <p className="text-white text-base font-medium pb-2">
          Опис
        </p>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Розповідьте про вашу організацію..."
          rows={4}
          className="form-input w-full rounded-lg p-4 text-white bg-transparent border border-white/30 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
          disabled={isLoading}
        />
      </label>

      {/* Кнопка */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
      >
        {isLoading ? 'Створення...' : 'Створити організацію'}
      </button>
      {isLoading ? (
        <div className="flex items-center justify-center">
          <LoadingSpinner size="sm" thickness="thin" />
        </div>
      ) : (
        <div className='h-6'></div>
      )}

    </form>
  )
}
