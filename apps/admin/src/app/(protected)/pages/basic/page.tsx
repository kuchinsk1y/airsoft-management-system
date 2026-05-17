import PageCard from '@/app/components/PageCard'
import { getPageCardsBySection } from '../shared/pageRegistry'

const pages = getPageCardsBySection('basic')

export default function BasicPagesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-2 tracking-[-0.033em] text-white">Основні сторінки
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pages.map(p => (
          <PageCard
            key={p.id}
            id={p.id}
            title={p.title}
            description={p.description}
            icon={p.icon}
            href={p.href}
            editable={p.editable}
          />
        ))}
      </div>
    </div>
  )
}
