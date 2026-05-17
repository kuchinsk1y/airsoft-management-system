export type Locale = 'uk'
const STORAGE_KEY = 'locale'
const COMPETITION_TYPES = ['TEAM', 'INDIVIDUAL', 'TRAINING'] as const

const translations = {
  uk: {
    competitionType: {
      TEAM: 'Командне',
      INDIVIDUAL: 'Індивідуальне',
      TRAINING: 'Тренувальне',
    },
  },
} satisfies Record<Locale, Record<string, Record<string, string>>>

export function getCurrentLocale(): Locale {
  if (typeof window === 'undefined') return 'uk'

  const saved = localStorage.getItem(STORAGE_KEY)
  return saved === 'uk' ? 'uk' : 'uk'
}

export function setLocale(locale: Locale): void {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, locale)
}

export function translate(
  namespace: string,
  key: string,
  locale?: Locale,
): string {
  const currentLocale = locale || getCurrentLocale()
  const localeTranslations = translations[currentLocale]
  if (!localeTranslations) return key

  const namespaceTranslations = localeTranslations[namespace as keyof typeof localeTranslations]
  if (!namespaceTranslations || typeof namespaceTranslations !== 'object') return key

  return (namespaceTranslations as Record<string, string>)[key] ?? key
}

export function translateCompetitionType(
  type: string,
  locale?: Locale,
): string {
  return translate('competitionType', type, locale)
}

export function getCompetitionTypeOptions(locale?: Locale) {
  const currentLocale = locale || getCurrentLocale()

  return COMPETITION_TYPES.map((type) => ({
    value: type,
    label: translateCompetitionType(type, currentLocale),
  }))
}

/**
 * Отримати англійський competitionType з українського
 * "Командне" → TEAM
 */
export function getEnglishCompetitionType(ukrType: string): string {
  const competitionTypeMap: Record<string, string> = {
    'Командне': 'TEAM',
    'Індивідуальне': 'INDIVIDUAL',
    'Тренувальне': 'TRAINING',
  }
  return competitionTypeMap[ukrType] || ukrType
}

/**
 * Отримати slug для міста
 * "Київ" → "kyiv"
 */
export function getCitySlug(cityName: string): string {
  return cityName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-а-яіїєґ]/g, '')
}
