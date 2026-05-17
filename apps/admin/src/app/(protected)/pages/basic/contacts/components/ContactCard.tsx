import { MdEdit, MdDelete, MdMap } from 'react-icons/md'
import type { ContactLocation } from '@/types'

interface ContactCardProps {
  contact: ContactLocation
  index: number
  editingIndex: number | null
  setEditingIndex: (index: number | null) => void
  deleteContact: (index: number) => void
  children: React.ReactNode
}

export default function ContactCard({ contact, index, editingIndex, setEditingIndex, deleteContact, children }: ContactCardProps) {
  return (
    <div key={contact.id || index} className={`p-6 rounded-xl border-2 transition-all ${editingIndex === index ? 'border-(--color-primary) bg-black/40' : 'border-white/10 bg-black/30'}`}>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-(--color-primary)/10">
            <MdMap className="text-xl text-(--color-primary)" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{contact.city || `Локація ${index + 1}`}</h3>
            <p className="text-xs text-gray-400">{editingIndex === index ? 'Режим редагування (локально)' : 'Натисніть "Редагувати" для змін'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setEditingIndex(editingIndex === index ? null : index)} className={`h-9 px-3 flex items-center gap-2 rounded-lg text-sm font-medium transition-colors ${editingIndex === index ? 'bg-(--color-primary) text-white hover:bg-(--color-primary-hover)' : 'border border-white/10 text-gray-200 hover:bg-white/5'}`}>
            <MdEdit className="text-base" />
            <span>{editingIndex === index ? 'Завершити' : 'Редагувати'}</span>
          </button>
          <button type="button" onClick={() => deleteContact(index)} className="h-9 px-3 flex items-center gap-2 rounded-lg border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors">
            <MdDelete className="text-base" />
            <span>Видалити</span>
          </button>
        </div>
      </div>
      {children}
    </div>
  )
}
