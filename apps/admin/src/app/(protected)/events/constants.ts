export const COMPETITION_TYPES = [
  { value: 'Командне', label: 'Командне' },
  { value: 'Індивідуальне', label: 'Індивідуальне' },
  { value: 'Тренувальне', label: 'Тренувальне' },
] as const

export const INITIAL_EVENT_FORM: Record<string, string | number | boolean | Date> = {
  name: '',
  image: '',
  date: new Date(),
  city: '',
  address: '',
  region: '',
  maxParticipants: 1,
  competitionType: 'Командне',
  price: 0,
  isActive: true,
}
