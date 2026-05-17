"use client"

import { useState, useRef, useEffect } from 'react'
import Toast, { ToastMessage } from '@/app/components/Toast'
import PageSeoSection from '@/app/components/seo/PageSeoSection'
import RuleSection from './components/RuleSection'
import type { Rule, Section, Subsection, PageSeoData } from '@/types'
import { deepClone } from '@/app/utils/helpers'
import { hasSeoChanges, normalizeSeo } from '@/app/utils/seo'
import { addRuleSection, deleteRuleSection, updateRuleSection, createRule, addRuleSubsection, deleteRuleSubsection, updateRuleSubsection, addPointToSubsection, deletePoint, updatePoint } from '@/app/utils/rules'
import { patchTemplate, updateTemplate } from '@/actions/template'
import styles from './animations.module.css'
import LoadingSpinner from '@/app/components/LoadingSpinner'

interface RulesFormProps {
  initialRules: Rule[]
  initialTitle?: string
  initialDescription?: string
  initialSeo?: PageSeoData
}

export default function RulesForm({ initialRules, initialTitle, initialDescription, initialSeo }: RulesFormProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content')
  const [rules, setRules] = useState<Rule[]>(initialRules)
  const [title, setTitle] = useState<string>(initialTitle ?? '')
  const [description, setDescription] = useState<string>(initialDescription ?? '')
  const [seo, setSeo] = useState<PageSeoData>(normalizeSeo(initialSeo, initialTitle ?? '', initialDescription ?? '', '/rules'))
  const [expandedRules, setExpandedRules] = useState<Set<number>>(new Set())
  const [animatedRules, setAnimatedRules] = useState<Set<number>>(new Set(initialRules.map(r => r.id)))
  const [saving, setSaving] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const initialRef = useRef<Rule[]>(deepClone(initialRules))
  const initialTitleRef = useRef<string>(initialTitle ?? '')
  const initialDescriptionRef = useRef<string>(initialDescription ?? '')
  const initialSeoRef = useRef<PageSeoData>(normalizeSeo(initialSeo, initialTitle ?? '', initialDescription ?? '', '/rules'))

  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, message, type }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  useEffect(() => {
    initialRef.current = deepClone(initialRules)
    setRules(deepClone(initialRules))
    setAnimatedRules(new Set(initialRules.map(r => r.id)))
    initialTitleRef.current = initialTitle ?? ''
    initialDescriptionRef.current = initialDescription ?? ''
    setTitle(initialTitle ?? '')
    setDescription(initialDescription ?? '')
    const normalizedSeo = normalizeSeo(initialSeo, initialTitle ?? '', initialDescription ?? '', '/rules')
    initialSeoRef.current = normalizedSeo
    setSeo(normalizedSeo)
  }, [initialRules, initialTitle, initialDescription, initialSeo])

  const hasChanges = (() => {
    if (rules.length !== initialRef.current.length) return true
    if (title !== initialTitleRef.current) return true
    if (description !== initialDescriptionRef.current) return true
    if (hasSeoChanges(seo, initialSeoRef.current)) return true
    return JSON.stringify(rules) !== JSON.stringify(initialRef.current)
  })()

  const toggleRule = (ruleId: number) => {
    setExpandedRules(prev => {
      const next = new Set(prev)
      if (next.has(ruleId)) next.delete(ruleId)
      else next.add(ruleId)
      return next
    })
  }

  const handleAddNewRule = () => {
    const { nextRules, newRuleId } = createRule(rules)
    setRules(nextRules)
    setExpandedRules(prev => new Set([...prev, newRuleId]))
  }

  const deleteRule = (ruleId: number) => {
    setRules(prev => prev.filter(r => r.id !== ruleId))
    setExpandedRules(prev => {
      const next = new Set(prev)
      next.delete(ruleId)
      return next
    })
  }

  const updateRule = (ruleId: number, field: keyof Rule, value: string | Section[] | Subsection[] | undefined) => setRules(prev => prev.map(r => r.id === ruleId ? { ...r, [field]: value } : r))

  // Section operations
  const addSection = (ruleId: number) => setRules(prev => addRuleSection(prev, ruleId))
  const deleteSection = (ruleId: number, sectionId: number) => setRules(prev => deleteRuleSection(prev, ruleId, sectionId))
  const updateSection = (ruleId: number, sectionId: number, text: string, numberlist?: string[], marklist?: string[] | string) => {
    const updates: { text: string; numberlist?: string[]; marklist?: string[] | string } = { text }
    if (numberlist !== undefined) updates.numberlist = numberlist
    if (marklist !== undefined) updates.marklist = marklist
    setRules(prev => updateRuleSection(prev, ruleId, sectionId, updates))
  }

  // Subsection operations
  const addSubsection = (ruleId: number) => setRules(prev => addRuleSubsection(prev, ruleId))
  const deleteSubsection = (ruleId: number, subsectionId: number) => setRules(prev => deleteRuleSubsection(prev, ruleId, subsectionId))
  const updateSubsection = (ruleId: number, subsectionId: number, subtitle: string) => setRules(prev => updateRuleSubsection(prev, ruleId, subsectionId, { subtitle }))

  // Point operations
  const addPoint = (ruleId: number, subsectionId: number) => setRules(prev => addPointToSubsection(prev, ruleId, subsectionId))
  const deletePointHandler = (ruleId: number, subsectionId: number, pointId: number) => setRules(prev => deletePoint(prev, ruleId, subsectionId, pointId))
  const updatePointHandler = (ruleId: number, subsectionId: number, pointId: number, text?: string, subtitle?: string, numberlist?: string[], marklist?: string[]) => setRules(prev => updatePoint(prev, ruleId, subsectionId, pointId, { text, subtitle, numberlist, marklist }))

  async function handleSave() {
    setSaving(true)

    if (!hasChanges) {
      addToast('Немає змін для збереження.', 'error')
      setSaving(false)
      return
    }

    try {
      const cfg: Record<string, unknown> = {}
      if (title !== initialTitleRef.current) cfg.title = title ?? ''
      if (description !== initialDescriptionRef.current) cfg.description = description ?? ''
      if (hasSeoChanges(seo, initialSeoRef.current)) cfg.seo = seo
      const contentChanged = JSON.stringify(rules) !== JSON.stringify(initialRef.current)
      if (contentChanged) cfg.content = rules

      let result = await patchTemplate('rules', cfg)
      
      if (!result.success && result.error.includes('404')) {
        result = await updateTemplate('rules', {
          title: title ?? '',
          description: description ?? '',
          seo,
          content: rules
        })
      }

      if (result.success) {
        addToast('Зміни успішно збережені!', 'success')
        initialRef.current = deepClone(rules)
        initialTitleRef.current = title ?? ''
        initialDescriptionRef.current = description ?? ''
        initialSeoRef.current = { ...seo }
      } else {
        addToast('Помилка при збереженні: ' + result.error, 'error')
      }
    } catch (e) {
      addToast('Помилка мережі: ' + (e instanceof Error ? e.message : ''), 'error')
    }
    setSaving(false)
  }

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
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-white/5 text-white px-3 py-2 rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none" placeholder="Напр., Правила користування"/>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Опис сторінки</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-white/5 text-white px-3 py-2 rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none" placeholder="Короткий опис сторінки"/>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {rules.map((rule, index) => {
              const shouldAnimate = animatedRules.has(rule.id)
              return (
                <div 
                  key={rule.id} 
                  className={shouldAnimate ? styles.ruleCard : ''}
                  style={shouldAnimate ? { animationDelay: `${index * 50}ms` } : undefined}
                >
                  <RuleSection rule={rule} isExpanded={expandedRules.has(rule.id)}
                    onToggle={() => toggleRule(rule.id)}
                    onDelete={() => deleteRule(rule.id)}
                    onUpdate={(field, value) => updateRule(rule.id, field, value)}
                    onAddSection={() => addSection(rule.id)}
                    onDeleteSection={(sectionId: number) => deleteSection(rule.id, sectionId)}
                    onUpdateSection={(sectionId: number, text: string, numberlist?: string[], marklist?: string[] | string) => 
                      updateSection(rule.id, sectionId, text, numberlist, marklist)
                    }
                    onAddSubsection={() => addSubsection(rule.id)}
                    onDeleteSubsection={(subsectionId: number) => deleteSubsection(rule.id, subsectionId)}
                    onUpdateSubsection={(subsectionId: number, subtitle: string) => updateSubsection(rule.id, subsectionId, subtitle)}
                    onAddPoint={(subsectionId: number) => addPoint(rule.id, subsectionId)}
                    onDeletePoint={(subsectionId: number, pointId: number) => deletePointHandler(rule.id, subsectionId, pointId)}
                    onUpdatePoint={(subsectionId: number, pointId: number, text?: string, subtitle?: string, numberlist?: string[], marklist?: string[]) => 
                      updatePointHandler(rule.id, subsectionId, pointId, text, subtitle, numberlist, marklist)
                    }
                  />
                </div>
              )
            })}
          </div>

          <button type="button" onClick={handleAddNewRule} className="w-full h-12 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/20 text-gray-300 hover:border-(--color-primary) hover:text-(--color-primary) hover:bg-(--color-primary-hover)/5 transition-all">
            <span className="font-medium">Додати новий розділ</span>
          </button>
        </>
      )}

      {activeTab === 'seo' && (
        <PageSeoSection
          seo={seo}
          onChange={setSeo}
          heading="SEO налаштування сторінки правил"
          idPrefix="rules"
          canonicalPlaceholder="/rules"
          ogImagePlaceholder="/uploads/og-rules.jpg"
        />
      )}

      <div className="flex justify-end pt-4">
        <button type="button" onClick={handleSave} disabled={saving || !hasChanges} className="h-10 px-6 flex items-center gap-2 rounded-lg bg-(--color-primary) text-white text-sm font-semibold hover:bg-(--color-primary-hover) transition-colors shadow-lg shadow-[#ea580c]/20 disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? 'Зберігаємо...' : 'Зберегти зміни'}
        </button>
      </div>
      {saving && (
        <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-[1px] rounded-xl">
          <div className="sticky top-0 h-screen flex flex-col items-center justify-center gap-2">
            <LoadingSpinner thickness="normal" />
            <p className="text-sm text-gray-200">Зберігаємо зміни...</p>
          </div>
        </div>
      )}

      <Toast messages={toasts} onRemove={removeToast} />
    </div>
  )
}
