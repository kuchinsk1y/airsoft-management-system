import type { ContactLocation } from '@/types'

interface ContactViewProps {
  contact: ContactLocation
}

export default function ContactView({ contact }: ContactViewProps) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex gap-2">
        <span className="text-gray-400 min-w-20">Адреса:</span>
        <span className="text-white">{contact.address}</span>
      </div>
      <div className="flex gap-2">
        <span className="text-gray-400 min-w-20">Телефони:</span>
        <div className="flex flex-col gap-1">
          {contact.phones.map((phone, i) => (
            <span key={i} className="text-white">{phone}</span>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <span className="text-gray-400 min-w-20">Карта:</span>
        {contact.mapUrl ? (
          <a href={contact.mapUrl} target="_blank" rel="noopener noreferrer" className="text-(--color-primary) hover:text-(--color-primary) underline">Відкрити на картах</a>
        ) : (
          <span className="text-gray-500 italic">Не вказано</span>
        )}
      </div>
    </div>
  )
}
