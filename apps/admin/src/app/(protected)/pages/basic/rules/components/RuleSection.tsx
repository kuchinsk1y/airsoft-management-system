"use client"

import type { Rule, Section, Subsection } from '@/types'
import { useState } from 'react'

interface RuleSectionProps {
  rule: Rule
  isExpanded: boolean
  onToggle: () => void
  onDelete: () => void
  onUpdate: (field: keyof Rule, value: string | Section[] | Subsection[] | undefined) => void
  onAddSection: () => void
  onDeleteSection: (sectionId: number) => void
  onUpdateSection: (sectionId: number, text: string, numberlist?: string[], marklist?: string[] | string) => void
  onAddSubsection: () => void
  onDeleteSubsection: (subsectionId: number) => void
  onUpdateSubsection: (subsectionId: number, subtitle: string) => void
  onAddPoint: (subsectionId: number) => void
  onDeletePoint: (subsectionId: number, pointId: number) => void
  onUpdatePoint: (subsectionId: number, pointId: number, text?: string, subtitle?: string, numberlist?: string[], marklist?: string[]) => void
}

export default function RuleSection({
  rule,
  isExpanded,
  onToggle,
  onDelete,
  onUpdate,
  onAddSection,
  onDeleteSection,
  onUpdateSection,
  onAddSubsection,
  onDeleteSubsection,
  onUpdateSubsection,
  onAddPoint,
  onDeletePoint,
  onUpdatePoint
}: RuleSectionProps) {
  const [showSections, setShowSections] = useState(true)
  const [showSubsections, setShowSubsections] = useState(true)

  return (
    <div className={`rounded-lg border transition-all ${isExpanded ? 'border-white/10 bg-white/2' : 'border-white/10 bg-white/2 hover:border-white/20'}`}>
      {/* Header / Collapsed View */}
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {isExpanded ? (
            <svg className="shrink-0 w-5 h-5 text-(--color-primary) transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="shrink-0 w-5 h-5 text-(--color-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          
          <div className="min-w-0 flex-1">
            {isExpanded ? (
              <input
                type="text"
                value={rule.title}
                onChange={(e) => onUpdate('title', e.target.value)}
                className="w-full bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent placeholder:text-gray-600"
                placeholder="Назва розділу"
              />
            ) : (
              <div>
                <p className="text-sm font-medium text-white truncate">{rule.title || `Розділ ${rule.id}`}</p>
                <p className="mt-0.5 text-xs text-gray-400">#{rule.id} • Натисніть Редагувати</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggle}
            className="h-8 px-2.5 flex items-center gap-1.5 rounded-md text-xs font-medium transition-colors border border-white/10 text-gray-300 hover:bg-white/5"
            title={isExpanded ? 'Завершити редагування' : 'Редагувати'}
          >
            {isExpanded ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="hidden sm:inline">Завершити</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="hidden sm:inline">Редагувати</span>
              </>
            )}
          </button>
          <button
            onClick={onDelete}
            className="h-8 px-2.5 flex items-center gap-1.5 rounded-md border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/10 transition-colors"
            title="Видалити"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="hidden sm:inline">Видалити</span>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4 border-t border-white/10 p-4">
          {!rule.sections && !rule.subsections && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => onUpdate('sections', [{ id: 1, text: '' }])}
                className="h-9 px-4 text-sm font-medium rounded-lg border border-white/10 text-gray-200 hover:bg-white/5 hover:border-(--color-primary)/30 hover:text-(--color-primary) transition-all"
              >
                + Додати секції
              </button>
              <button
                onClick={() => onUpdate('subsections', [{ id: 1, subtitle: '', points: [{ id: 1, text: '' }] }])}
                className="h-9 px-4 text-sm font-medium rounded-lg border border-white/10 text-gray-200 hover:bg-white/5 hover:border-(--color-primary)/30 hover:text-(--color-primary) transition-all"
              >
                + Додати підрозділи
              </button>
            </div>
          )}

          {/* Секції */}
          {rule.sections && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Секції ({Array.isArray(rule.sections) ? rule.sections.length : 0})</h4>
                <button
                  type="button"
                  onClick={() => setShowSections((v) => !v)}
                  className="p-1 text-gray-400 hover:text-(--color-primary) transition-colors"
                  title={showSections ? 'Згорнути секції' : 'Розгорнути секції'}
                >
                  <svg className={`w-4 h-4 transition-transform ${showSections ? '' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              {showSections && rule.sections.length > 0 && (
                <>
                  {rule.sections.map((section: Section) => (
                    <div key={section.id} className="rounded-lg border border-white/10 bg-black/20 p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="font-mono">#{section.id}</span>
                            {section.numberlist && section.numberlist.length > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-xs">Н: {section.numberlist.length}</span>
                            )}
                          </div>
                          <textarea
                            value={section.text || ''}
                            onChange={(e) => onUpdateSection(section.id, e.target.value, section.numberlist, section.marklist)}
                            className="w-full bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
                            rows={3}
                            placeholder={`Текст секції ${section.id}...`}
                          />
                        </div>
                        <button
                          onClick={() => onDeleteSection(section.id)}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-all shrink-0"
                          title="Видалити"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {section.numberlist && section.numberlist.length > 0 && (
                        <div className="space-y-1 bg-black/40 p-2 rounded">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-400">Нумерований список:</span>
                            <button
                              onClick={() => {
                                const newList = [...(section.numberlist || []), '']
                                onUpdateSection(section.id, section.text || '', newList, section.marklist)
                              }}
                              className="text-xs text-gray-400 hover:text-(--color-primary)"
                              title="Додати пункт"
                            >
                              + пункт
                            </button>
                          </div>
                          {section.numberlist.map((item: string, idx: number) => (
                            <div key={idx} className="flex gap-1 items-center text-xs">
                              <span className="text-gray-500 w-5 shrink-0">{idx + 1}.</span>
                              <input
                                type="text"
                                value={item}
                                onChange={(e) => {
                                  const newList = [...(section.numberlist || [])]
                                  newList[idx] = e.target.value
                                  onUpdateSection(section.id, section.text || '', newList, section.marklist)
                                }}
                                className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-(--color-primary)"
                                placeholder={`${idx + 1}.`}
                              />
                              <button
                                onClick={() => {
                                  const newList = section.numberlist?.filter((_, i) => i !== idx) || []
                                  onUpdateSection(section.id, section.text || '', newList.length > 0 ? newList : undefined, section.marklist)
                                }}
                                className="p-0.5 text-gray-500 hover:text-red-400"
                                title="Видалити пункт"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
              {showSections && (
                <button
                  onClick={onAddSection}
                  className="h-8 px-3 flex items-center gap-2 rounded-lg border border-white/10 text-gray-300 text-xs font-medium hover:bg-white/5 hover:border-(--color-primary)/30 hover:text-(--color-primary) transition-all w-full"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Додати секцію
                </button>
              )}
            </div>
          )}

          {/* Підрозділи */}
          {rule.subsections && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Підрозділи ({Array.isArray(rule.subsections) ? rule.subsections.length : 0})</h4>
                <button
                  type="button"
                  onClick={() => setShowSubsections((v) => !v)}
                  className="p-1 text-gray-400 hover:text-(--color-primary) transition-colors"
                  title={showSubsections ? 'Згорнути підрозділи' : 'Розгорнути підрозділи'}
                >
                  <svg className={`w-4 h-4 transition-transform ${showSubsections ? '' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              {showSubsections && rule.subsections.length > 0 && (
                <>
                  {rule.subsections.map((subsection: Subsection) => (
                    <div key={subsection.id} className="rounded-lg border border-white/10 bg-black/20 p-3 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-2">
                          <div className="text-xs text-gray-400 font-mono">#{subsection.id}</div>
                          <input
                            type="text"
                            value={subsection.subtitle || ''}
                            onChange={(e) => onUpdateSubsection(subsection.id, e.target.value)}
                            className="w-full bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
                            placeholder={`Заголовок підрозділу...`}
                          />
                        </div>
                        <button
                          onClick={() => onDeleteSubsection(subsection.id)}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-all shrink-0"
                          title="Видалити"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Points within Subsection */}
                      {subsection.points && subsection.points.length > 0 && (
                        <div className="space-y-2 bg-black/30 p-2 rounded">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-400">Пункти ({subsection.points.length})</span>
                            <button
                              onClick={() => onAddPoint(subsection.id)}
                              className="text-xs text-gray-400 hover:text-(--color-primary) transition-colors"
                            >
                              + пункт
                            </button>
                          </div>
                          {subsection.points.map((point, idx) => (
                            <div key={point.id} className="space-y-1 bg-black/40 p-2 rounded text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-500">Пункт {idx + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => onDeletePoint(subsection.id, point.id)}
                                  className="p-0.5 text-gray-500 hover:text-red-400"
                                  title="Видалити пункт"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                              <input
                                type="text"
                                value={point.text || ''}
                                onChange={(e) =>
                                  onUpdatePoint(subsection.id, point.id, e.target.value, point.subtitle, point.numberlist, point.marklist)
                                }
                                className="w-full bg-neutral-900/60 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-(--color-primary)"
                                placeholder="Текст пункту..."
                              />
                              {point.marklist && point.marklist.length > 0 && (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Маркерований список:</span>
                                    <button
                                      onClick={() =>
                                        onUpdatePoint(
                                          subsection.id,
                                          point.id,
                                          point.text,
                                          point.subtitle,
                                          point.numberlist,
                                          [...(point.marklist as string[]), '']
                                        )
                                      }
                                      className="text-xs text-gray-500 hover:text-(--color-primary)"
                                      title="Додати елемент"
                                    >
                                      + додати
                                    </button>
                                  </div>
                                  {(point.marklist as string[]).map((item, idx) => (
                                    <div key={idx} className="flex gap-1 items-center">
                                      <span className="text-gray-600 w-4 shrink-0">•</span>
                                      <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => {
                                          const newList = [...(point.marklist as string[])]
                                          newList[idx] = e.target.value
                                          onUpdatePoint(subsection.id, point.id, point.text, point.subtitle, point.numberlist, newList)
                                        }}
                                        className="flex-1 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-(--color-primary)"
                                        placeholder="Елемент..."
                                      />
                                      <button
                                        onClick={() => {
                                          const newList = (point.marklist as string[]).filter((_, i) => i !== idx)
                                          onUpdatePoint(
                                            subsection.id,
                                            point.id,
                                            point.text,
                                            point.subtitle,
                                            point.numberlist,
                                            newList.length > 0 ? newList : undefined
                                          )
                                        }}
                                        className="p-0.5 text-gray-600 hover:text-red-400"
                                        title="Видалити елемент"
                                      >
                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {point.numberlist && point.numberlist.length > 0 && (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Нумерований список:</span>
                                    <button
                                      onClick={() =>
                                        onUpdatePoint(subsection.id, point.id, point.text, point.subtitle, [...point.numberlist!, ''], point.marklist)
                                      }
                                      className="text-xs text-gray-500 hover:text-(--color-primary)"
                                      title="Додати елемент"
                                    >
                                      + додати
                                    </button>
                                  </div>
                                  {point.numberlist.map((item, idx) => (
                                    <div key={idx} className="flex gap-1 items-center">
                                      <span className="text-gray-600 w-4 shrink-0 text-right">{idx + 1}.</span>
                                      <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => {
                                          const newList = [...point.numberlist!]
                                          newList[idx] = e.target.value
                                          onUpdatePoint(subsection.id, point.id, point.text, point.subtitle, newList, point.marklist)
                                        }}
                                        className="flex-1 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-(--color-primary)"
                                        placeholder="Елемент..."
                                      />
                                      <button
                                        onClick={() => {
                                          const newList = point.numberlist!.filter((_, i) => i !== idx)
                                          onUpdatePoint(
                                            subsection.id,
                                            point.id,
                                            point.text,
                                            point.subtitle,
                                            newList.length > 0 ? newList : undefined,
                                            point.marklist
                                          )
                                        }}
                                        className="p-0.5 text-gray-600 hover:text-red-400"
                                        title="Видалити елемент"
                                      >
                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
              {showSubsections && (
                <button
                  onClick={onAddSubsection}
                  className="h-8 px-3 flex items-center gap-2 rounded-lg border border-white/10 text-gray-300 text-xs font-medium hover:bg-white/5 hover:border-(--color-primary)/30 hover:text-(--color-primary) transition-all w-full"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Додати підрозділ
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
