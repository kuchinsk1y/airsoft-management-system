'use client';

import TitleBlock from '@/components/TitleBlock/TitleBlock';
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { getTemplate } from '@/actions/template';
import {
  RuleItem,
  TemplateData,
  RuleSection,
  RuleSubsection,
  RulePoint,
} from '@/interfaces';
import SeoTextBlock from '@/components/seo/SeoTextBlock';

const RulesPage = () => {
  const [rulesData, setRulesData] = useState<RuleItem[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const sectionRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [openId, setOpenId] = useState<number | null>(null);
  const [title, setTitle] = useState<string>('Правила Страйкболу');
  const [subtitle, setSubtitle] = useState<string>('');
  const [seoText, setSeoText] = useState<string>('');

  useEffect(() => {
    async function loadRules() {
      const result = await getTemplate('rules');

      if (result.success) {
        type RulesTemplateResponse = TemplateData<RuleItem[]> & {
          description?: string;
        };
        const data = result.data as RulesTemplateResponse;
        setRulesData(data?.content || []);
        if (data?.content?.length) setActiveId(data.content[0].id);
        if (data?.title) setTitle(data.title);
        if (data?.description || data?.subtitle) {
          setSubtitle(data?.description || data?.subtitle || '');
        }
        const rawSeo = (result.data as { seo?: { seoText?: string } }).seo;
        if (typeof rawSeo?.seoText === 'string') {
          setSeoText(rawSeo.seoText);
        }
      } else {
        console.error('Error loading rules template:', result.error);
      }
    }

    loadRules();
  }, []);

  useEffect(() => {
    if (!rulesData.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = Number(entry.target.getAttribute('data-id'));
            setActiveId(id);
          }
        });
      },
      {
        root: null,
        rootMargin: '-20% 0px -60% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    Object.values(sectionRefs.current).forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, [rulesData]);

  const toggleSection = (id: number) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div>
      <TitleBlock
        title={title}
        path={[{ label: 'Головна', href: '/' }, { label: 'Правила гри' }]}
        subtitle={subtitle}
      />

      <div className="hidden min991:flex gap-2">
        <aside className="w-1/4 border-r border-gray-300 pr-4 pt-6 pl-16 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <ul className="flex flex-col gap-2 text-lg uppercase font-semibold">
            {rulesData.map((item) => (
              <li key={item.id}>
                <a
                  href={`#section-${item.id}`}
                  className={`block text-left w-full px-2 py-1 border-l-2 transition-colors ${
                    activeId === item.id
                      ? 'border-orange-500 text-orange-500'
                      : 'border-transparent text-white hover:text-white hover:border-white'
                  }`}
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </aside>

        <main className="w-3/4 p-6 space-y-16 uppercase">
          {rulesData.map((item) => (
            <div
              key={item.id}
              id={`section-${item.id}`}
              data-id={item.id}
              ref={(el) => {
                sectionRefs.current[item.id] = el;
              }}
              className="scroll-mt-20"
            >
              <p className="font-semibold text-5xl text-[#FFFFFF] mb-4 py-4 border-y border-gray-300 -ml-8 -mr-6 pl-8">
                {item.title}
              </p>
              {item.sections?.map((sec) => (
                <div key={sec.id} className="mb-7">
                  {sec.text && (
                    <p className="font-light text-xl text-gray-300 leading-loose mb-4">
                      {sec.text}
                    </p>
                  )}

                  {Array.isArray(sec.numberlist) &&
                    sec.numberlist.length > 0 && (
                      <ol className="list-decimal list-inside text-xl text-gray-300 ml-4 space-y-2">
                        {sec.numberlist.map((n: string, i: number) => (
                          <li key={i}>{n}</li>
                        ))}
                      </ol>
                    )}

                  {Array.isArray(sec.marklist) && sec.marklist.length > 0 && (
                    <ul className="list-disc list-inside text-xl text-gray-300 ml-4 space-y-2">
                      {sec.marklist.map((m: string, i: number) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}{' '}
              {item.subsections?.map((sub) => (
                <div key={sub.id} className="mb-6">
                  {sub.subtitle && (
                    <h3 className="text-3xl font-semibold text-[#FFFFFF] mb-2">
                      {sub.subtitle}
                    </h3>
                  )}

                  {sub.points?.map((point) => (
                    <div key={point.id} className="mb-4">
                      {'text' in point && (
                        <p className="text-gray-300 text-xl leading-loose mb-7">
                          {point.text}
                        </p>
                      )}

                      {Array.isArray(point.marklist) &&
                        point.marklist.length > 0 && (
                          <ul className="list-disc list-inside text-xl text-gray-300 ml-4 space-y-2">
                            {point.marklist?.map((m: string, i: number) => (
                              <li key={i}>{m}</li>
                            ))}
                          </ul>
                        )}

                      {'numberlist' in point && (
                        <ol className="list-decimal list-inside text-xl text-gray-300 ml-4 space-y-2">
                          {point.numberlist?.map((n: string, i: number) => (
                            <li key={i}>{n}</li>
                          ))}
                        </ol>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </main>
      </div>

      <div className="block min991:hidden divide-y divide-gray-600">
        {rulesData.map((item) => (
          <ToggleSection
            key={item.id}
            item={item}
            isOpen={openId === item.id}
            toggle={() => toggleSection(item.id)}
          />
        ))}
      </div>
      <SeoTextBlock text={seoText} className="min991:px-20" />
    </div>
  );
};

function ToggleSection({
  item,
  isOpen,
  toggle,
}: {
  item: RuleItem;
  isOpen: boolean;
  toggle: () => void;
}) {
  const [openSubId, setOpenSubId] = useState<number | null>(null);

  const toggleSub = (id: number) => {
    setOpenSubId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="border-b border-gray-700">
      <button
        onClick={toggle}
        className="w-full flex justify-between items-center py-4 px-4 text-left"
      >
        <span
          className={`uppercase font-semibold text-lg transition-colors ${
            isOpen ? 'text-orange-500' : 'text-white'
          }`}
        >
          {item.title}
        </span>
        <ChevronDown
          className={`w-5 h-5 transition-transform ${
            isOpen ? 'rotate-180 text-orange-500' : 'text-white'
          }`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-1250 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {item.sections &&
          item.sections.map((sec: RuleSection) => (
            <div key={sec.id} className="px-4 mb-4">
              {sec.text && (
                <p className="font-light text-sm text-gray-300 leading-relaxed mb-2">
                  {sec.text}
                </p>
              )}

              {Array.isArray(sec.numberlist) && sec.numberlist.length > 0 && (
                <ol className="list-decimal list-inside text-sm text-gray-300 space-y-1">
                  {sec.numberlist.map((n: string, i: number) => (
                    <li key={i}>{n}</li>
                  ))}
                </ol>
              )}

              {Array.isArray(sec.marklist) && sec.marklist.length > 0 && (
                <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                  {sec.marklist.map((m: string, i: number) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}

        {item.subsections &&
          item.subsections.map((sub: RuleSubsection) => (
            <div key={sub.id} className="border-t border-gray-600">
              <button
                onClick={() => toggleSub(sub.id)}
                className="w-full flex justify-between items-center py-3 px-6 text-left"
              >
                <span
                  className={`font-semibold text-base transition-colors ${
                    openSubId === sub.id ? 'text-orange-400' : 'text-white'
                  }`}
                >
                  {sub.subtitle}
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    openSubId === sub.id
                      ? 'rotate-180 text-orange-400'
                      : 'text-white'
                  }`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 px-6 ${
                  openSubId === sub.id
                    ? 'max-h-500 opacity-100'
                    : 'max-h-0 opacity-0'
                }`}
              >
                {sub.points.map((point: RulePoint) => (
                  <div key={point.id} className="mb-3">
                    {'text' in point && (
                      <p className="text-sm text-gray-300 leading-relaxed mb-2">
                        {point.text}
                      </p>
                    )}
                    {Array.isArray(point.marklist) &&
                      point.marklist.length > 0 && (
                        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                          {point.marklist.map((m: string, i: number) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      )}
                    {Array.isArray(point.numberlist) &&
                      point.numberlist.length > 0 && (
                        <ol className="list-decimal list-inside text-sm text-gray-300 space-y-1">
                          {point.numberlist.map((n: string, i: number) => (
                            <li key={i}>{n}</li>
                          ))}
                        </ol>
                      )}
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default RulesPage;
