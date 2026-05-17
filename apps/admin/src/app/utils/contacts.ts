import type { ContactLocation } from '@/types'

export function cloneContacts(contacts: ContactLocation[]): ContactLocation[] {
  return contacts.map(c => ({ ...c, phones: [...c.phones] }))
}

export function isContactChanged(a: ContactLocation, b: ContactLocation): boolean {
  if (!a || !b) return true
  if (a.city !== b.city) return true
  if (a.address !== b.address) return true
  if (a.mapUrl !== b.mapUrl) return true
  if ((a.phones?.length || 0) !== (b.phones?.length || 0)) return true
  for (let i = 0; i < (a.phones?.length || 0); i++) {
    const av = (a.phones[i] || '')
    const bv = (b.phones?.[i] || '')
    if (av !== bv) return true
  }
  return false
}

export function getChangedContacts(current: ContactLocation[], initial: ContactLocation[]): ContactLocation[] {
  // Если количество изменилось, все текущие — изменённые
  if (current.length !== initial.length) return current

  const changed: ContactLocation[] = []
  for (let i = 0; i < current.length; i++) {
    const cur = current[i]
    const init = initial[i]
    if (!init || isContactChanged(cur, init)) changed.push(cur)
  }
  return changed
}

export function hasMetaChanged(title: string, initialTitle: string, description: string, initialDescription: string): boolean {
  return title !== initialTitle || description !== initialDescription
}

export function hasContactsChanges(current: ContactLocation[], initial: ContactLocation[]): boolean {
  if (current.length !== initial.length) return true
  const changed = getChangedContacts(current, initial)
  return changed.length > 0
}

export function stripClientIds(contacts: ContactLocation[]): Omit<ContactLocation, 'id'>[] {
  return contacts.map(contact => {
    const rest = { ...contact } as Omit<ContactLocation, 'id'> & Record<string, unknown>
    delete (rest as Record<string, unknown>).id
    return rest as Omit<ContactLocation, 'id'>
  })
}

export function addPhoneAt(contacts: ContactLocation[], index: number): ContactLocation[] {
  const updated = [...contacts]
  updated[index] = { ...updated[index], phones: [...updated[index].phones, ''] }
  return updated
}

export function updatePhoneAt(contacts: ContactLocation[], contactIndex: number, phoneIndex: number, value: string): ContactLocation[] {
  const updated = [...contacts]
  const phones = [...updated[contactIndex].phones]
  phones[phoneIndex] = value
  updated[contactIndex] = { ...updated[contactIndex], phones }
  return updated
}

export function deletePhoneAt(contacts: ContactLocation[], contactIndex: number, phoneIndex: number): ContactLocation[] {
  const updated = [...contacts]
  const phones = updated[contactIndex].phones.filter((_, i) => i !== phoneIndex)
  updated[contactIndex] = { ...updated[contactIndex], phones }
  return updated
}
