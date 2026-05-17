'use client'

import { useState } from 'react'
import { MdAdd, MdDelete } from 'react-icons/md'
import type { WorkshopContactsBlock } from '@/types'
import DeleteBlockConfirmModal from './DeleteConfirmModal'

type ContactsFieldKey = 'address' | 'phone' | 'workingHours'

interface PendingDeleteRow {
  field: ContactsFieldKey
  index: number
  value: string
}

interface WorkshopContactsSectionProps {
  block: WorkshopContactsBlock
  onChange: (block: WorkshopContactsBlock) => void
}

interface StringArrayFieldProps {
  label: string
  values: string[]
  placeholder?: string
  onAdd: () => void
  onUpdate: (i: number, v: string) => void
  onDelete: (i: number) => void
}

function StringArrayField({ label, values, placeholder, onAdd, onUpdate, onDelete }: StringArrayFieldProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      {values.map((v, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={v}
            onChange={e => onUpdate(i, e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => onDelete(i)}
            aria-label={`Видалити рядок ${i + 1} у полі ${label}`}
            title="Видалити рядок"
            className="p-2 rounded text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <MdDelete />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-(--color-primary) transition-colors"
      >
        <MdAdd />
        Додати рядок
      </button>
    </div>
  )
}

export default function WorkshopContactsSection({ block, onChange }: WorkshopContactsSectionProps) {
  const [pendingDeleteRow, setPendingDeleteRow] =
    useState<PendingDeleteRow | null>(null)

  const update = (partial: Partial<WorkshopContactsBlock>) => onChange({ ...block, ...partial })

  const requestDelete = (field: ContactsFieldKey, index: number, value: string) => {
    setPendingDeleteRow({ field, index, value })
  }

  const confirmDelete = () => {
    if (!pendingDeleteRow) return

    const { field, index } = pendingDeleteRow
    update({ [field]: block[field].filter((_, idx) => idx !== index) })
    setPendingDeleteRow(null)
  }

  return (
    <section className="space-y-5 p-6 rounded-xl border-2 border-white/10 bg-black/30">
      <div>
        <h2 className="text-lg font-semibold text-white">Контакти</h2>
        <p className="text-xs text-gray-400 mt-1">Адреса, телефони та графік роботи майстерні.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-gray-400 font-medium">Заголовок секції</label>
        <input
          value={block.title}
          onChange={e => update({ title: e.target.value })}
          placeholder="Напр., Контакти"
          className="bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StringArrayField
          label="Адреса"
          values={block.address}
          placeholder="вул. Прикладна, 1"
          onAdd={() => update({ address: [...block.address, ''] })}
          onUpdate={(i, v) => update({ address: block.address.map((a, idx) => (idx === i ? v : a)) })}
          onDelete={i => requestDelete('address', i, block.address[i] || '')}
        />
        <StringArrayField
          label="Телефон"
          values={block.phone}
          placeholder="+380 XX XXX XX XX"
          onAdd={() => update({ phone: [...block.phone, ''] })}
          onUpdate={(i, v) => update({ phone: block.phone.map((p, idx) => (idx === i ? v : p)) })}
          onDelete={i => requestDelete('phone', i, block.phone[i] || '')}
        />
        <StringArrayField
          label="Графік роботи"
          values={block.workingHours}
          placeholder="Пн-Пт: 10:00 - 19:00"
          onAdd={() => update({ workingHours: [...block.workingHours, ''] })}
          onUpdate={(i, v) =>
            update({ workingHours: block.workingHours.map((w, idx) => (idx === i ? v : w)) })
          }
          onDelete={i => requestDelete('workingHours', i, block.workingHours[i] || '')}
        />
      </div>

      <DeleteBlockConfirmModal
        isOpen={pendingDeleteRow !== null}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteRow(null)}
        blockName={pendingDeleteRow?.value || undefined}
      />
    </section>
  )
}
