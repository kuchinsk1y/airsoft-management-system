'use client'

import { useCallback, useEffect, useState } from 'react'
import { MdDelete, MdAdd } from 'react-icons/md'
import { getOrganization, updateOrganization, OrganizationResponse, SocialLinkDto } from '@/actions/organizations'
import { SOCIAL_NETWORKS_CONFIG } from '@/config/socialNetworks'
import LoadingSpinner from '@/app/components/LoadingSpinner'
import Toast, { ToastMessage } from '@/app/components/Toast'
import SaveButton from '../../pages/basic/main/components/SaveButton'

export default function OrganizationSettingsClient() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [savedData, setSavedData] = useState<OrganizationResponse | null>(null)
  const [formData, setFormData] = useState({
    companyName: '',
    logoUrl: '',
    websiteUrl: '',
    phone: '',
    socialLinks: [] as SocialLinkDto[],
  })

  const isDirty =
    formData.companyName !== (savedData?.companyName || '') ||
    formData.logoUrl !== (savedData?.logoUrl || '') ||
    formData.websiteUrl !== (savedData?.websiteUrl || '') ||
    formData.phone !== (savedData?.phone || '') ||
    JSON.stringify(formData.socialLinks) !== JSON.stringify(savedData?.socialLinks || [])

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Завантажити дані
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const result = await getOrganization()

      if (result.status === 'success' && result.data) {
        setSavedData(result.data)
        setFormData({
          companyName: result.data.companyName || '',
          logoUrl: result.data.logoUrl || '',
          websiteUrl: result.data.websiteUrl || '',
          phone: result.data.phone || '',
          socialLinks: result.data.socialLinks || [],
        })
      } else {
        addToast(result.message || 'Не вдалося завантажити дані', 'error')
      }

      setIsLoading(false)
    }

    fetchData()
  }, [addToast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddSocialLink = () => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: [...prev.socialLinks, { provider: '', url: '' }],
    }))
  }

  const handleRemoveSocialLink = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index),
    }))
  }

  const handleSocialLinkChange = (index: number, field: 'provider' | 'url', value: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.map((link, i) => (i === index ? { ...link, [field]: value } : link)),
    }))
  }

  const handleSave = async () => {
    if (!isDirty) {
      addToast('Немає змін для збереження', 'info')
      return
    }

    setIsSaving(true)

    const result = await updateOrganization({
      companyName: formData.companyName || undefined,
      logoUrl: formData.logoUrl || undefined,
      websiteUrl: formData.websiteUrl || undefined,
      phone: formData.phone || undefined,
      socialLinks: formData.socialLinks.length > 0 ? formData.socialLinks : undefined,
    })

    if (result.status === 'success' && result.data) {
      setSavedData(result.data)
      setFormData({
        companyName: result.data.companyName || '',
        logoUrl: result.data.logoUrl || '',
        websiteUrl: result.data.websiteUrl || '',
        phone: result.data.phone || '',
        socialLinks: result.data.socialLinks || [],
      })
      addToast('Дані організації успішно оновлені', 'success')
    } else if (result.status === 'unauthenticated') {
      addToast('Ви не авторизовані. Будь ласка, увійдіть ще раз.', 'error')
    } else if (result.status === 'forbidden') {
      addToast('Ви не маєте прав для редагування організаційних даних', 'error')
    } else {
      addToast(result.message || 'Помилка при оновленні даних', 'error')
    }

    setIsSaving(false)
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="relative space-y-6">
      <Toast messages={toasts} onRemove={removeToast} />

      <section className="space-y-5 p-6 rounded-xl border-2 border-white/10 bg-black/30">
        <div>
          <h2 className="text-lg font-semibold text-white">Основні дані</h2>
          <p className="text-xs text-gray-400 mt-1">
            Назва, сайт, телефон і логотип для Organization schema.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label htmlFor="companyName" className="text-xs text-gray-400 font-medium">
                Назва компанії
              </label>
              <input
                id="companyName"
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                placeholder="Strike Shop Action"
                className="bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="websiteUrl" className="text-xs text-gray-400 font-medium">
                Веб-сайт
              </label>
              <input
                id="websiteUrl"
                type="url"
                name="websiteUrl"
                value={formData.websiteUrl}
                onChange={handleInputChange}
                placeholder="https://example.com"
                className="bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone" className="text-xs text-gray-400 font-medium">
                Телефон
              </label>
              <input
                id="phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+380971672730"
                className="bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label htmlFor="logoUrl" className="text-xs text-gray-400 font-medium">
                URL логотипу
              </label>
              <input
                id="logoUrl"
                type="url"
                name="logoUrl"
                value={formData.logoUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/logo.png"
                className="bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
              />
            </div>
        </div>
      </section>

      <section className="space-y-5 p-6 rounded-xl border-2 border-white/10 bg-black/30">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-white">Соціальні мережі</h2>
            <p className="text-xs text-gray-400 mt-1">
              Ці посилання потрапляють у sameAs для SEO schema та у футер сайту.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddSocialLink}
            className="h-9 px-4 flex items-center gap-2 rounded-lg bg-(--color-primary) text-white text-sm font-semibold hover:bg-(--color-primary-hover) transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSaving}
          >
            <MdAdd className="text-base" />
            <span>Додати мережу</span>
          </button>
        </div>

        <div className="space-y-4">
          {formData.socialLinks.map((link, index) => (
            <div key={index} className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_40px] md:grid-cols-[minmax(160px,220px)_minmax(0,1fr)_40px] gap-3 items-end">
                <div className="col-span-2 md:col-span-1 flex flex-col gap-1.5">
                  <label className="text-xs text-gray-400 font-medium">Платформа</label>
                  <select
                    value={link.provider}
                    onChange={(e) => handleSocialLinkChange(index, 'provider', e.target.value)}
                    aria-label="Виберіть платформу"
                    className="bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
                  >
                    <option value="" disabled>— оберіть платформу —</option>
                    {SOCIAL_NETWORKS_CONFIG.map((net) => (
                      <option key={net.key} value={net.key}>{net.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-400 font-medium">URL / Посилання</label>
                  {(() => {
                    const cfg = SOCIAL_NETWORKS_CONFIG.find((n) => n.key === link.provider)
                    const inputType = link.provider === 'phone' ? 'tel' : link.provider === 'email' ? 'email' : 'url'
                    return (
                      <input
                        type={inputType}
                        placeholder={cfg?.placeholder ?? 'https://'}
                        value={link.url}
                        onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                        className="bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
                      />
                    )
                  })()}
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveSocialLink(index)}
                  className="h-10 w-10 justify-self-end flex items-center justify-center rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSaving}
                  title="Видалити соціальну мережу"
                >
                  <MdDelete className="text-base" />
                  <span className="sr-only">Видалити</span>
                </button>
              </div>
            </div>
          ))}

          {formData.socialLinks.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-6 text-center">
              <p className="text-sm text-gray-400">Соціальні мережі ще не додані</p>
            </div>
          )}
        </div>
      </section>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => {
            if (savedData) {
              setFormData({
                companyName: savedData.companyName || '',
                logoUrl: savedData.logoUrl || '',
                websiteUrl: savedData.websiteUrl || '',
                phone: savedData.phone || '',
                socialLinks: savedData.socialLinks || [],
              })
            }
          }}
          disabled={!isDirty || isSaving}
          className="h-10 px-4 flex items-center rounded-lg border border-white/10 text-gray-200 text-sm hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Скасувати зміни
        </button>
        <SaveButton
          isSaving={isSaving}
          onClick={handleSave}
          disabled={!isDirty}
        />
      </div>

      {isSaving && (
        <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-[1px] rounded-xl">
          <div className="sticky top-0 h-screen flex flex-col items-center justify-center gap-2">
            <LoadingSpinner thickness="normal" />
            <p className="text-sm text-gray-200">Зберігаємо зміни...</p>
          </div>
        </div>
      )}
    </div>
  )
}
