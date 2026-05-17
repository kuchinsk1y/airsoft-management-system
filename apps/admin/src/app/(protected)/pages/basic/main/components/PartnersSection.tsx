import { useState } from 'react'
import Image from 'next/image'
import { MdAdd, MdDelete, MdEdit, MdBusiness, MdImage } from 'react-icons/md'
import { uploadTemplateImage } from '@/actions/template'
import { NEXT_PUBLIC_API_URL } from '@/app/utils/config'

type Partner = {
  id: number
  logo: string
  link: string
  alt: string
}

interface PartnersSectionProps {
  section?: {
    items: Partner[]
  }
  onChange: (items: Partner[]) => void
}

export default function PartnersSection({ section, onChange }: PartnersSectionProps) {
  const initialPartners = section?.items ?? []
  const [items, setItems] = useState<Partner[]>(initialPartners)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [uploading, setUploading] = useState<number | null>(null)
  if (!section) return null

  const handleLogoUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(index)
    const field = `partnersSection.items[${index}].logo`
    try {
      const result = await uploadTemplateImage('main', file, field)
      if (!result.success) throw new Error(result.error)
      const url = (result.data as { url: string }).url
      updatePartner(index, 'logo', url)
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      setUploading(null)
    }
  }

  const addItem = () => {
    const newPartner: Partner = {
      id: items.length + 1,
      logo: '',
      link: '',
      alt: `Партнер ${items.length + 1}`,
    }
    const newItems = [...items, newPartner]
    setItems(newItems)
    onChange(newItems)
    setEditingIndex(items.length)
  }

  const removeItem = (id: number) => {
    const newItems = items.filter((p) => p.id !== id)
    setItems(newItems)
    onChange(newItems)
    if (editingIndex !== null && items[editingIndex]?.id === id) setEditingIndex(null)
  }

  const updatePartner = (index: number, field: keyof Partner, value: string) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
    onChange(updated)
  }

  return (
    <section className="space-y-5 rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,107,0,0.08),transparent_40%),rgba(255,255,255,0.02)] p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Партнери</h2>
          <p className="mt-1 text-xs text-gray-400">Логотипи партнерів на головній сторінці</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-xs text-gray-300">
          <span>Всього: {items.length}</span>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((partner, index) => (
          <div
            key={partner.id}
            className={`rounded-2xl border p-4 transition-all sm:p-5 ${
              editingIndex === index
                ? 'border-(--color-primary)/55 bg-black/45 shadow-[0_14px_40px_rgba(255,107,0,0.08)]'
                : 'border-white/10 bg-black/25 hover:border-white/20'
            }`}
          >
            {/* Header row */}
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                {partner.logo ? (
                  <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/30">
                    <Image
                      src={
                        partner.logo.startsWith('/uploads')
                          ? `${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}${partner.logo}`
                          : partner.logo
                      }
                      alt={partner.alt}
                      fill
                      className="object-contain bg-white/5"
                    />
                  </div>
                ) : (
                  <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded-lg bg-(--color-primary)/10">
                    <MdBusiness className="text-xl text-(--color-primary)" />
                  </div>
                )}
                <h3 className="truncate text-base font-semibold text-white">
                  {partner.alt || `Партнер ${index + 1}`}
                </h3>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                  className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors ${
                    editingIndex === index
                      ? 'bg-(--color-primary) text-white hover:bg-(--color-primary-hover)'
                      : 'border border-white/10 text-gray-200 hover:bg-white/5'
                  }`}
                >
                  <MdEdit className="text-base" />
                  <span>{editingIndex === index ? 'Завершити' : 'Редагувати'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(partner.id)}
                  title="Видалити партнера"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/25 text-red-400 transition-colors hover:bg-red-500/10"
                >
                  <MdDelete className="text-base" />
                </button>
              </div>
            </div>

            {/* Edit form */}
            {editingIndex === index && (
              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-400">Назва партнера</label>
                  <input
                    name={`partners[${index}][alt]`}
                    value={partner.alt}
                    onChange={(e) => updatePartner(index, 'alt', e.target.value)}
                    placeholder="Введіть назву компанії"
                    title="Назва партнера"
                    className="rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-400">URL сайту партнера</label>
                  <input
                    name={`partners[${index}][link]`}
                    value={partner.link}
                    onChange={(e) => updatePartner(index, 'link', e.target.value)}
                    placeholder="https://example.com"
                    title="Посилання партнера"
                    type="url"
                    className="rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
                  />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-xs font-medium text-gray-400">Логотип</label>
                  <div className="flex items-start gap-4">
                    <label className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-3 rounded-lg border-2 border-dashed border-white/10 bg-neutral-900/60 px-4 py-3 transition-all hover:border-(--color-primary) hover:bg-(--color-primary-hover)/5">
                        <MdImage className="text-2xl text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-white">
                            {uploading === index ? 'Завантаження...' : 'Оберіть логотип'}
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, WEBP до 5MB. Рекомендовано: 600×240 (прозорий фон).
                          </p>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLogoUpload(index, e)}
                        disabled={uploading === index}
                        className="hidden"
                      />
                    </label>
                    {partner.logo && (
                      <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/30">
                        <Image
                          src={
                            partner.logo.startsWith('/uploads')
                              ? `${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}${partner.logo}`
                              : partner.logo
                          }
                          alt={partner.alt}
                          fill
                          className="object-contain bg-white/5"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/20 text-gray-300 transition-all hover:border-(--color-primary) hover:bg-(--color-primary-hover)/5 hover:text-(--color-primary)"
      >
        <MdAdd className="text-xl" />
        <span className="font-medium">Додати партнера</span>
      </button>
    </section>
  );
}
