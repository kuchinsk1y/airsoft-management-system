'use client'

import { useState, useCallback, useEffect } from 'react'
import Toast, { ToastMessage } from '@/app/components/Toast'
import { updateRegionSeo, type Region, type FaqItem } from '@/actions/regions'
import { updateCitySeo, type City } from '@/actions/cities'

type Tab = 'region' | 'city'

type RegionsCitiesSeoClientProps = {
  regions: Region[]
  allCities: City[]
}

function FaqEditor({
  items,
  onChange,
}: {
  items: FaqItem[]
  onChange: (items: FaqItem[]) => void
}) {
  const addItem = () => onChange([...items, { question: '', answer: '' }])

  const updateItem = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item,
    )
    onChange(updated)
  }

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm font-medium text-gray-300">FAQ блок</p>
        <button
          type="button"
          onClick={addItem}
          className="h-8 px-3 rounded-lg border border-white/10 text-xs font-medium text-gray-100 hover:bg-white/5 transition-colors"
        >
          + Додати питання
        </button>
      </div>

      {items.map((item, index) => (
        <div key={index} className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs text-gray-400 mt-1 font-medium">#{index + 1}</span>
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="h-7 px-2 rounded-md text-xs text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-colors ml-auto"
            >
              Видалити
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium">Питання</label>
            <input
              type="text"
              value={item.question}
              onChange={(e) => updateItem(index, 'question', e.target.value)}
              className="w-full bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
              placeholder="Введіть питання..."
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium">Відповідь</label>
            <textarea
              value={item.answer}
              onChange={(e) => updateItem(index, 'answer', e.target.value)}
              rows={3}
              className="w-full bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent resize-y"
              placeholder="Введіть відповідь..."
            />
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <p className="text-xs text-gray-500 italic">Немає питань. Натисніть &ldquo;+ Додати питання&rdquo;</p>
      )}
    </div>
  )
}

export default function RegionsCitiesSeoClient({
  regions,
  allCities,
}: RegionsCitiesSeoClientProps) {
  const initialRegion = regions[0]
  const initialCity = allCities[0]

  const [tab, setTab] = useState<Tab>('region')
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(
    initialRegion?.id ?? null,
  )
  const [selectedCityId, setSelectedCityId] = useState<number | null>(
    initialCity?.id ?? null,
  )

  const [regionSeoText, setRegionSeoText] = useState<string>(initialRegion?.seoText ?? '')
  const [regionFaq, setRegionFaq] = useState<FaqItem[]>(initialRegion?.seoFaq ?? [])

  const [citySeoText, setCitySeoText] = useState<string>(initialCity?.seoText ?? '')
  const [cityFaq, setCityFaq] = useState<FaqItem[]>(initialCity?.seoFaq ?? [])

  const [saving, setSaving] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = (message: string, type: ToastMessage['type'] = 'info') => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, message, type }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  useEffect(() => {
    if (!selectedRegionId) return
    const region = regions.find((r) => r.id === selectedRegionId)
    if (!region) return

    setRegionSeoText(region.seoText ?? '')
    setRegionFaq(region.seoFaq ?? [])
  }, [selectedRegionId, regions])

  useEffect(() => {
    if (!selectedCityId) return
    const city = allCities.find((c) => c.id === selectedCityId)
    if (!city) return

    setCitySeoText(city.seoText ?? '')
    setCityFaq(city.seoFaq ?? [])
  }, [selectedCityId, allCities])

  const handleSelectRegion = useCallback(
    (id: number) => {
      setSelectedRegionId(id)
      const region = regions.find((r) => r.id === id)
      if (region) {
        setRegionSeoText(region.seoText ?? '')
        setRegionFaq(region.seoFaq ?? [])
      }
    },
    [regions],
  )

  const handleSelectCity = useCallback(
    (id: number) => {
      setSelectedCityId(id)
      const city = allCities.find((c) => c.id === id)
      if (city) {
        setCitySeoText(city.seoText ?? '')
        setCityFaq(city.seoFaq ?? [])
      }
    },
    [allCities],
  )

  const handleSaveRegion = async () => {
    if (!selectedRegionId) return
    setSaving(true)
    const result = await updateRegionSeo(selectedRegionId, {
      seoText: regionSeoText.trim() || null,
      seoFaq: regionFaq.filter((f) => f.question.trim() && f.answer.trim()),
    })
    setSaving(false)
    if (result.success) {
      addToast('SEO регіону збережено', 'success')
    } else {
      addToast(`Помилка: ${result.error}`, 'error')
    }
  }

  const handleSaveCity = async () => {
    if (!selectedCityId) return
    setSaving(true)
    const result = await updateCitySeo(selectedCityId, {
      seoText: citySeoText.trim() || null,
      seoFaq: cityFaq.filter((f) => f.question.trim() && f.answer.trim()),
    })
    setSaving(false)
    if (result.success) {
      addToast('SEO міста збережено', 'success')
    } else {
      addToast(`Помилка: ${result.error}`, 'error')
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Toast messages={toasts} onRemove={removeToast} />

      <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-black/20 p-1.5 w-fit">
        <button
          type="button"
          onClick={() => setTab('region')}
          className={`h-9 px-4 rounded-lg text-sm transition-colors ${tab === 'region' ? 'bg-(--color-primary) text-white font-semibold' : 'text-gray-300 hover:bg-white/5'}`}
        >
          Регіони
        </button>
        <button
          type="button"
          onClick={() => setTab('city')}
          className={`h-9 px-4 rounded-lg text-sm transition-colors ${tab === 'city' ? 'bg-(--color-primary) text-white font-semibold' : 'text-gray-300 hover:bg-white/5'}`}
        >
          Міста
        </button>
      </div>

      {tab === 'region' && (
        <section className="space-y-5 p-6 rounded-xl border-2 border-white/10 bg-black/30">
          <div>
            <h2 className="text-lg font-semibold text-white">SEO регіону</h2>
            <p className="text-xs text-gray-400 mt-1">Оберіть регіон, відредагуйте SEO текст та FAQ.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium">Регіон</label>
            <select
              title="Виберіть регіон"
              value={selectedRegionId ?? ''}
              onChange={(e) => handleSelectRegion(Number(e.target.value))}
              className="w-full bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
            >
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium">SEO текст</label>
            <textarea
              value={regionSeoText}
              onChange={(e) => setRegionSeoText(e.target.value)}
              rows={6}
              className="w-full bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent resize-y"
              placeholder="SEO текст для сторінки регіону..."
            />
          </div>

          <FaqEditor items={regionFaq} onChange={setRegionFaq} />

          <div className="pt-1">
            <button
              type="button"
              onClick={handleSaveRegion}
              disabled={saving || !selectedRegionId}
              className="h-9 px-4 rounded-lg bg-(--color-primary) text-white text-sm font-semibold hover:bg-(--color-primary-hover) transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Збереження...' : 'Зберегти'}
            </button>
          </div>
        </section>
      )}

      {tab === 'city' && (
        <section className="space-y-5 p-6 rounded-xl border-2 border-white/10 bg-black/30">
          <div>
            <h2 className="text-lg font-semibold text-white">SEO міста</h2>
            <p className="text-xs text-gray-400 mt-1">Оберіть місто, відредагуйте SEO текст та FAQ.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium">Місто</label>
            <select
              title="Виберіть місто"
              value={selectedCityId ?? ''}
              onChange={(e) => handleSelectCity(Number(e.target.value))}
              className="w-full bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
            >
              {allCities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.region ? ` (${c.region.name})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium">SEO текст</label>
            <textarea
              value={citySeoText}
              onChange={(e) => setCitySeoText(e.target.value)}
              rows={6}
              className="w-full bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent resize-y"
              placeholder="SEO текст для сторінки міста..."
            />
          </div>

          <FaqEditor items={cityFaq} onChange={setCityFaq} />

          <div className="pt-1">
            <button
              type="button"
              onClick={handleSaveCity}
              disabled={saving || !selectedCityId}
              className="h-9 px-4 rounded-lg bg-(--color-primary) text-white text-sm font-semibold hover:bg-(--color-primary-hover) transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Збереження...' : 'Зберегти'}
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
