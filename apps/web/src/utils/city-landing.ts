import type { City } from '@/interfaces';

const CYRILLIC_TO_LATIN_MAP: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'h',
  ґ: 'g',
  д: 'd',
  е: 'e',
  є: 'ye',
  ж: 'zh',
  з: 'z',
  и: 'y',
  і: 'i',
  ї: 'yi',
  й: 'i',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ь: '',
  ю: 'yu',
  я: 'ya',
  ы: 'y',
  э: 'e',
  ё: 'yo',
  ъ: '',
};

const DEFAULT_CITY_SLUG = 'kyiv';

function transliterateChar(char: string): string {
  const lowerChar = char.toLowerCase();
  return CYRILLIC_TO_LATIN_MAP[lowerChar] ?? lowerChar;
}

export function normalizeCityLookupKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[ʼ'`’]/g, '')
    .replace(/\s+/g, ' ');
}

export function generateFallbackCitySlug(name: string): string {
  const transliterated = Array.from(name.trim())
    .map(transliterateChar)
    .join('');

  let slug = transliterated
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  slug = slug.replace(/yi/g, 'i').replace(/ye/g, 'e');

  if (slug === 'kiiv' || slug === 'kiyiv' || slug === 'kiev') {
    return DEFAULT_CITY_SLUG;
  }

  return slug;
}

export function resolveCitySlug(
  cityName: string,
  knownCities: Pick<City, 'name' | 'slug'>[],
): string {
  const lookupKey = normalizeCityLookupKey(cityName);
  const matchedCity = knownCities.find(
    city => normalizeCityLookupKey(city.name) === lookupKey,
  );

  return matchedCity?.slug || generateFallbackCitySlug(cityName);
}

export function isDefaultCitySlug(slug: string): boolean {
  return slug.trim().toLowerCase() === DEFAULT_CITY_SLUG;
}

export function getCityHref(
  cityName: string,
  knownCities: Pick<City, 'name' | 'slug'>[],
): string {
  const slug = resolveCitySlug(cityName, knownCities);
  return isDefaultCitySlug(slug) ? '/' : `/${slug}`;
}

export function getCityPageTitle(cityName: string): string {
  return `Страйкбол ${cityName.trim()}`;
}