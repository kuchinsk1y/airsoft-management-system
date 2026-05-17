import { useState } from 'react'
import { MdAdd, MdDelete, MdEdit, MdQuestionAnswer, MdExpandMore, MdExpandLess } from 'react-icons/md'

type FaqItem = {
  id: number
  question: string
  answer: string
}

interface Section {
  type: string
  title: string
  items: FaqItem[]
}

interface FaqSectionProps {
  section?: Section
  onChange: (items: FaqItem[]) => void
}

export default function FaqSection({ section, onChange }: FaqSectionProps) {
  const initialFaq = section?.items ?? []
  const [items, setItems] = useState<FaqItem[]>(initialFaq)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const add = () => {
    const newItem: FaqItem = { id: items.length + 1, question: '', answer: '' }
    const newItems = [...items, newItem]
    setItems(newItems)
    onChange(newItems)
    setEditingIndex(newItems.length - 1)
  }

  const remove = (id: number) => {
    const newItems = items.filter((x) => x.id !== id)
    setItems(newItems)
    onChange(newItems)
    if (editingIndex !== null && items[editingIndex]?.id === id) setEditingIndex(null)
  }

  const updateItem = (index: number, field: keyof FaqItem, value: string) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
    onChange(updated)
  }

  return (
    <section className="space-y-5 rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,107,0,0.08),transparent_40%),rgba(255,255,255,0.02)] p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Питання – відповіді</h2>
          <p className="mt-0.5 text-xs text-gray-400">Всього: {items.length}</p>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="rounded-lg border border-white/10 bg-white/2 transition-all hover:border-white/20"
          >
            {/* Header / Collapsed View */}
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <MdQuestionAnswer className="shrink-0 text-lg text-(--color-primary)" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">
                    {item.question || `Питання ${index + 1}`}
                  </p>
                  {editingIndex !== index && (
                    <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">
                      {item.answer || 'Немає відповіді'}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                  className="h-8 px-2.5 flex items-center gap-1.5 rounded-md text-xs font-medium transition-colors border border-white/10 text-gray-300 hover:bg-white/5"
                  title={editingIndex === index ? 'Завершити редагування' : 'Редагувати'}
                >
                  {editingIndex === index ? (
                    <>
                      <MdExpandLess className="text-sm" />
                      <span className="hidden sm:inline">Згорнути</span>
                    </>
                  ) : (
                    <>
                      <MdEdit className="text-sm" />
                      <span className="hidden sm:inline">Редагувати</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="h-8 px-2.5 flex items-center gap-1.5 rounded-md border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/10 transition-colors"
                  title="Видалити"
                >
                  <MdDelete className="text-sm" />
                  <span className="hidden sm:inline">Видалити</span>
                </button>
              </div>
            </div>

            {/* Expanded Edit View */}
            {editingIndex === index && (
              <>
                <div className="border-t border-white/10" />
                <div className="p-4 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-400 block mb-2">
                      Питання
                    </label>
                    <textarea
                      name={`faq[${index}][question]`}
                      value={item.question}
                      onChange={(e) => updateItem(index, 'question', e.target.value)}
                      placeholder="Введіть питання"
                      rows={2}
                      className="w-full bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent placeholder:text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-400 block mb-2">
                      Відповідь
                    </label>
                    <textarea
                      name={`faq[${index}][answer]`}
                      value={item.answer}
                      onChange={(e) => updateItem(index, 'answer', e.target.value)}
                      placeholder="Введіть детальну відповідь"
                      rows={4}
                      className="w-full bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent placeholder:text-gray-600"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        ))}

        {/* Add New Button */}
        <button
          type="button"
          onClick={add}
          className="w-full h-10 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-white/20 text-gray-400 hover:border-(--color-primary) hover:text-(--color-primary) hover:bg-(--color-primary)/5 transition-all text-sm font-medium"
        >
          <MdAdd className="text-base" />
          Додати питання
        </button>
      </div>
    </section>
  )
}
