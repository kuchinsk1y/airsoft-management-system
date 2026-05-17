import type { ContactLocation } from '@/types'
import { MdAdd, MdDelete } from 'react-icons/md'

interface ContactEditProps {
  contact: ContactLocation
  index: number
  updateContact: (index: number, field: keyof ContactLocation, value: string | string[]) => void
  addPhone: (index: number) => void
  updatePhone: (contactIndex: number, phoneIndex: number, value: string) => void
  deletePhone: (contactIndex: number, phoneIndex: number) => void
}

export default function ContactEdit({ contact, index, updateContact, addPhone, updatePhone, deletePhone }: ContactEditProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-400 font-medium">Місто</label>
          <input type="text" value={contact.city} onChange={e => updateContact(index, 'city', e.target.value)} placeholder="Назва міста" className="bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"/>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-400 font-medium">Адреса</label>
          <input type="text" value={contact.address} onChange={e => updateContact(index, 'address', e.target.value)} placeholder="Вулиця, будинок" className="bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"/>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-400 font-medium">Телефони</label>
          <button type="button" onClick={() => addPhone(index)} className="text-xs text-(--color-primary) hover:text-(--color-primary) font-medium flex items-center gap-1">
            <MdAdd className="text-sm" /> Додати телефон
          </button>
        </div>
        <div className="space-y-2">
          {contact.phones.map((phone, phoneIndex) => (
            <div key={phoneIndex} className="flex gap-2">
              <input type="text" value={phone} onChange={e => updatePhone(index, phoneIndex, e.target.value)} placeholder="+38 (0XX) XXX-XX-XX" className="flex-1 bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"/>
              {contact.phones.length > 1 && (
                <button type="button" onClick={() => deletePhone(index, phoneIndex)} title="Видалити телефон" className="h-9 px-3 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                  <MdDelete className="text-base" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-gray-400 font-medium">Google Maps URL</label>
        <input type="url" value={contact.mapUrl} onChange={e => updateContact(index, 'mapUrl', e.target.value)} placeholder="https://www.google.com/maps?q=..." className="bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"/>
        <p className="text-xs text-gray-500">Відкрийте Google Maps, знайдіть адресу і скопіюйте посилання</p>
      </div>
    </div>
  )
}
