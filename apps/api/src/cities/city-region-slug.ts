export function regionSlugForCityName(cityName: string): string | null {
  const key = cityName.trim().toLowerCase();
  const map: Record<string, string> = {
    київ: 'kyiv-city',
    kyiv: 'kyiv-city',
    kiev: 'kyiv-city',
    львів: 'lvivska-oblast',
    lviv: 'lvivska-oblast',
    одеса: 'odeska-oblast',
    odesa: 'odeska-oblast',
    odessa: 'odeska-oblast',
    'івано-франківськ': 'ivano-frankivska-oblast',
    'ivano-frankivsk': 'ivano-frankivska-oblast',
    вінниця: 'vinnicka-oblast',
    vinnytsia: 'vinnicka-oblast',
    харків: 'harkivska-oblast',
    kharkiv: 'harkivska-oblast',
    дніпро: 'dnipropetrovska-oblast',
    dnipro: 'dnipropetrovska-oblast',
    дніпропетровськ: 'dnipropetrovska-oblast',
    запоріжжя: 'zaporizka-oblast',
    zaporizhzhia: 'zaporizka-oblast',
    полтава: 'poltavska-oblast',
    poltava: 'poltavska-oblast',
    тернопіль: 'ternopilska-oblast',
    ternopil: 'ternopilska-oblast',
    буча: 'kiivska-oblast',
    ірпінь: 'kiivska-oblast',
    бориспіль: 'kiivska-oblast',
    бровари: 'kiivska-oblast',
  };
  return map[key] ?? null;
}
