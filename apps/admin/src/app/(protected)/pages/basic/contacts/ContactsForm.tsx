"use client"

import { useState, useRef, useEffect } from 'react'
import Toast, { ToastMessage } from '@/app/components/Toast'
import PageSeoSection from '@/app/components/seo/PageSeoSection'
import ContactEdit from './components/ContactEdit'
import ContactView from './components/ContactView'
import ContactCard from './components/ContactCard'
import type { ContactLocation, PageSeoData } from '@/types'
import { hasSeoChanges, normalizeSeo } from '@/app/utils/seo'
import { cloneContacts, getChangedContacts, hasMetaChanged, hasContactsChanges, stripClientIds, addPhoneAt, updatePhoneAt, deletePhoneAt } from '@/app/utils/contacts'
import { patchTemplate, updateTemplate } from '@/actions/template'
import styles from './animations.module.css'
import LoadingSpinner from '@/app/components/LoadingSpinner'

interface ContactsFormProps {
  initialContacts: ContactLocation[]
  initialTitle?: string
  initialDescription?: string
  initialSeo?: PageSeoData
}

export default function ContactsForm({ initialContacts, initialTitle, initialDescription, initialSeo }: ContactsFormProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content')
  const [contacts, setContacts] = useState<ContactLocation[]>(initialContacts.map(c => ({ ...c, id: crypto.randomUUID() })))
  const [title, setTitle] = useState<string>(initialTitle ?? '')
  const [description, setDescription] = useState<string>(initialDescription ?? '')
  const [seo, setSeo] = useState<PageSeoData>(normalizeSeo(initialSeo, initialTitle ?? '', initialDescription ?? '', '/contacts'))
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const initialRef = useRef<ContactLocation[]>(initialContacts)
  const initialTitleRef = useRef<string>(initialTitle ?? '')
  const initialDescriptionRef = useRef<string>(initialDescription ?? '')
  const initialSeoRef = useRef<PageSeoData>(normalizeSeo(initialSeo, initialTitle ?? '', initialDescription ?? '', '/contacts'))

  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, message, type }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  useEffect(() => {
    initialRef.current = cloneContacts(initialContacts)
    setContacts(cloneContacts(initialContacts).map(c => ({ ...c, id: crypto.randomUUID() })))
    initialTitleRef.current = initialTitle ?? ''
    initialDescriptionRef.current = initialDescription ?? ''
    setTitle(initialTitle ?? '')
    setDescription(initialDescription ?? '')
    const normalizedSeo = normalizeSeo(initialSeo, initialTitle ?? '', initialDescription ?? '', '/contacts')
    initialSeoRef.current = normalizedSeo
    setSeo(normalizedSeo)
  }, [initialContacts, initialTitle, initialDescription, initialSeo])

  function getChangedContactsLocal() {
    return getChangedContacts(contacts, initialRef.current)
  }

  function hasChanges() {
    const metaChanged = hasMetaChanged(title, initialTitleRef.current, description, initialDescriptionRef.current)
    const contentChanged = hasContactsChanges(contacts, initialRef.current)
    const seoChanged = hasSeoChanges(seo, initialSeoRef.current)
    return metaChanged || contentChanged || seoChanged
  }

  async function handleSave() {
    setSaving(true)
    const changedContacts = getChangedContactsLocal()
    const metaChanged = hasMetaChanged(title, initialTitleRef.current, description, initialDescriptionRef.current)
    const seoChanged = hasSeoChanges(seo, initialSeoRef.current)

    if (changedContacts.length === 0 && !metaChanged && !seoChanged) {
      addToast('Немає змін для збереження.', 'error')
      setSaving(false)
      return
    }

    const payload = stripClientIds(contacts)
    try {
      const cfg: Record<string, unknown> = {}
      if (metaChanged) {
        if (title !== initialTitleRef.current) cfg.title = title
        if (description !== initialDescriptionRef.current) cfg.description = description
      }
      if (seoChanged) cfg.seo = seo
      const contentChanged = hasContactsChanges(contacts, initialRef.current)
      if (contentChanged) cfg.content = payload

      let result = await patchTemplate('contacts', cfg)
      
      if (!result.success && result.error.includes('404')) {
        result = await updateTemplate('contacts', {
          title: title,
          description: description,
          seo,
          content: payload
        })
      }

      if (result.success) {
        addToast('Зміни успішно збережені!', 'success')
        initialRef.current = contacts.map(c => ({ ...c, phones: [...c.phones] }))
        initialTitleRef.current = title
        initialDescriptionRef.current = description
        initialSeoRef.current = { ...seo }
      } else {
        addToast('Помилка при збереженні: ' + result.error, 'error')
      }
    } catch (e) {
      addToast('Помилка мережі: ' + (e instanceof Error ? e.message : ''), 'error')
    }
    setSaving(false)
  }

  const addNewContact = () => {
    const newContact: ContactLocation = { id: crypto.randomUUID(), city: '', phones: [''], address: '', mapUrl: '' }
    setContacts(prev => [...prev, newContact])
    setEditingIndex(contacts.length)
  }

  const deleteContact = (index: number) => {
    setContacts(prev => prev.filter((_, i) => i !== index))
    if (editingIndex === index) setEditingIndex(null)
  }

  const updateContact = (index: number, field: keyof ContactLocation, value: string | string[]) => {
    setContacts(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addPhone = (index: number) => setContacts(prev => addPhoneAt(prev, index))
  const updatePhone = (contactIndex: number, phoneIndex: number, value: string) => setContacts(prev => updatePhoneAt(prev, contactIndex, phoneIndex, value))
  const deletePhone = (contactIndex: number, phoneIndex: number) => setContacts(prev => deletePhoneAt(prev, contactIndex, phoneIndex))

  return (
    <div className=" relative space-y-6">
      <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-black/20 p-1.5 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`h-9 px-4 rounded-lg text-sm transition-colors ${activeTab === 'content' ? 'bg-(--color-primary) text-white font-semibold' : 'text-gray-300 hover:bg-white/5'}`}
        >
          Контент
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('seo')}
          className={`h-9 px-4 rounded-lg text-sm transition-colors ${activeTab === 'seo' ? 'bg-(--color-primary) text-white font-semibold' : 'text-gray-300 hover:bg-white/5'}`}
        >
          SEO
        </button>
      </div>

      {activeTab === 'content' && (
        <>
          <div className="p-4 rounded-xl border-2 border-white/10 bg-black/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Заголовок сторінки (H1)</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-white/5 text-white px-3 py-2 rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none" placeholder="Напр., Контакти"/>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Опис сторінки</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-white/5 text-white px-3 py-2 rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none" placeholder="Короткий опис сторінки"/>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {contacts.map((contact, index) => (
              <div key={contact.id || index} className={styles.contactCard} style={{ animationDelay: `${index * 50}ms` }}>
                <ContactCard contact={contact} index={index} editingIndex={editingIndex} setEditingIndex={setEditingIndex} deleteContact={deleteContact}>
                  {editingIndex === index ? (
                    <ContactEdit contact={contact} index={index} updateContact={updateContact} addPhone={addPhone} updatePhone={updatePhone} deletePhone={deletePhone}/>
                  ) : (
                    <ContactView contact={contact} />
                  )}
                </ContactCard>
              </div>
            ))}
          </div>

          <button type="button" onClick={addNewContact} className="w-full h-12 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/20 text-gray-300 hover:border-(--color-primary) hover:text-(--color-primary) hover:bg-(--color-primary-hover)/5 transition-all">
            <span className="font-medium">Додати нову локацію (локально)</span>
          </button>
        </>
      )}

      {activeTab === 'seo' && (
        <PageSeoSection
          seo={seo}
          onChange={setSeo}
          heading="SEO налаштування сторінки контактів"
          idPrefix="contacts"
          canonicalPlaceholder="/contacts"
          ogImagePlaceholder="/uploads/og-contacts.jpg"
        />
      )}

        {saving && (
       <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-[1px] rounded-xl">
        <div className="sticky top-0 h-screen flex flex-col items-center justify-center gap-2">
          <LoadingSpinner thickness="normal" />
          <p className="text-sm text-gray-200">Зберігаємо зміни...</p>
        </div>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <button type="button" onClick={handleSave} disabled={saving || !hasChanges()} className="h-10 px-6 flex items-center gap-2 rounded-lg bg-(--color-primary) text-white text-sm font-semibold hover:bg-(--color-primary-hover) transition-colors shadow-lg shadow-[#ea580c]/20 disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? 'Зберігаємо...' : 'Зберегти зміни'}
        </button>
      </div>
      <Toast messages={toasts} onRemove={removeToast} />
    </div>
  )
}
