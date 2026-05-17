import type { Rule, Section, Subsection, Point } from '@/types'

export function createSection(): Section {
  return { id: 1, text: '' }
}

export function createSubsection(): Subsection {
  return { id: 1, subtitle: '', points: [createPoint()] }
}

export function createPoint(): Point {
  return { id: 1, text: '' }
}

export function createRule(rules: Rule[]): { nextRules: Rule[]; newRuleId: number } {
  const newRuleId = Math.max(0, ...rules.map(r => r.id)) + 1
  const nextRules: Rule[] = [
    ...rules,
    { id: newRuleId, title: 'Новий розділ', sections: [createSection()] },
  ]
  return { nextRules, newRuleId }
}

// Section operations
export function addRuleSection(rules: Rule[], ruleId: number): Rule[] {
  return rules.map(r => {
    if (r.id !== ruleId) return r
    const sections = r.sections || []
    const newId = sections.length > 0 ? Math.max(...sections.map(s => s.id)) + 1 : 1
    return { ...r, sections: [...sections, { ...createSection(), id: newId }] }
  })
}

export function deleteRuleSection(rules: Rule[], ruleId: number, sectionId: number): Rule[] {
  return rules.map(r => {
    if (r.id !== ruleId) return r
    return { ...r, sections: (r.sections || []).filter(s => s.id !== sectionId) }
  })
}

export function updateRuleSection(
  rules: Rule[],
  ruleId: number,
  sectionId: number,
  updates: { text?: string; numberlist?: string[]; marklist?: string[] | string }
): Rule[] {
  return rules.map(r => {
    if (r.id !== ruleId) return r
    return {
      ...r,
      sections: (r.sections || []).map(s => (s.id === sectionId ? { ...s, ...updates } : s)),
    }
  })
}

// Subsection operations
export function addRuleSubsection(rules: Rule[], ruleId: number): Rule[] {
  return rules.map(r => {
    if (r.id !== ruleId) return r
    const subsections = r.subsections || []
    const newId = subsections.length > 0 ? Math.max(...subsections.map(ss => ss.id)) + 1 : 1
    return { ...r, subsections: [...subsections, { ...createSubsection(), id: newId }] }
  })
}

export function deleteRuleSubsection(rules: Rule[], ruleId: number, subsectionId: number): Rule[] {
  return rules.map(r => {
    if (r.id !== ruleId) return r
    return { ...r, subsections: (r.subsections || []).filter(ss => ss.id !== subsectionId) }
  })
}

export function updateRuleSubsection(
  rules: Rule[],
  ruleId: number,
  subsectionId: number,
  updates: { subtitle?: string }
): Rule[] {
  return rules.map(r => {
    if (r.id !== ruleId) return r
    return {
      ...r,
      subsections: (r.subsections || []).map(ss =>
        ss.id === subsectionId ? { ...ss, ...updates } : ss
      ),
    }
  })
}

// Point operations
export function addPointToSubsection(
  rules: Rule[],
  ruleId: number,
  subsectionId: number
): Rule[] {
  return rules.map(r => {
    if (r.id !== ruleId) return r
    return {
      ...r,
      subsections: (r.subsections || []).map(ss => {
        if (ss.id !== subsectionId) return ss
        const points = ss.points || []
        const newId = points.length > 0 ? Math.max(...points.map(p => p.id)) + 1 : 1
        return { ...ss, points: [...points, { ...createPoint(), id: newId }] }
      }),
    }
  })
}

export function deletePoint(
  rules: Rule[],
  ruleId: number,
  subsectionId: number,
  pointId: number
): Rule[] {
  return rules.map(r => {
    if (r.id !== ruleId) return r
    return {
      ...r,
      subsections: (r.subsections || []).map(ss => {
        if (ss.id !== subsectionId) return ss
        return { ...ss, points: (ss.points || []).filter(p => p.id !== pointId) }
      }),
    }
  })
}

export function updatePoint(
  rules: Rule[],
  ruleId: number,
  subsectionId: number,
  pointId: number,
  updates: { text?: string; subtitle?: string; numberlist?: string[]; marklist?: string[] }
): Rule[] {
  return rules.map(r => {
    if (r.id !== ruleId) return r
    return {
      ...r,
      subsections: (r.subsections || []).map(ss => {
        if (ss.id !== subsectionId) return ss
        return {
          ...ss,
          points: (ss.points || []).map(p => (p.id === pointId ? { ...p, ...updates } : p)),
        }
      }),
    }
  })
}

// Switch between modes
export function switchRuleToSections(rules: Rule[], ruleId: number): Rule[] {
  return rules.map(r => {
    if (r.id !== ruleId) return r
    return { ...r, sections: r.sections || [createSection()], subsections: undefined }
  })
}

export function switchRuleToSubsections(rules: Rule[], ruleId: number): Rule[] {
  return rules.map(r => {
    if (r.id !== ruleId) return r
    return { ...r, subsections: r.subsections || [createSubsection()], sections: undefined }
  })
}
