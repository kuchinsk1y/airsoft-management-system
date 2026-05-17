import PageCard from '@/app/components/PageCard';
import { getPageCardsBySection } from '../shared/pageRegistry';

const pages = getPageCardsBySection('info');

export default function InfoPagesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-2 tracking-[-0.033em] text-white">
          Інформаційні сторінки
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pages.map((page) => (
          <PageCard
            key={page.id}
            id={page.id}
            title={page.title}
            description={page.description}
            icon={page.icon}
            href={page.href}
            editable={page.editable}
          />
        ))}
      </div>
    </div>
  );
}
