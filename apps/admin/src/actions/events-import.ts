'use server'

import { EventFormData } from '@/app/(protected)/events/types'
import { z } from 'zod'
import { getCities } from './cities'
import { createEvent } from './events'

export interface ImportResult {
  total: number
  success: number
  failed: number
  errors: Array<{ row: number; error: string }>
}

const eventImportSchema = z.object({
  name: z.string().min(1, "Назва обов'язкова"),
  image: z.string().default('default.png'),
  startDate: z.coerce.date().refine(date => !isNaN(date.getTime()), {
    message: 'Невірний формат дати',
  }),
  endDate: z.coerce.date().optional(),
  city: z.string().min(1, "Місто обов'язкове"),
  address: z.string().optional(),
  maxParticipants: z.coerce.number().int().positive().default(20),
  competitionType: z.string().default('Індивідуальне'),
  price: z.coerce.number().nonnegative().default(0),
  isActive: z.boolean().default(true),
})

// Маппинг украинских названий на английские поля
const FIELD_MAPPING: Record<string, string> = {
  'назва': 'name',
  'название': 'name',
  'name': 'name',
  'зображення': 'image',
  'изображение': 'image',
  'image': 'image',
  'картинка': 'image',
  'дата початку': 'startDate',
  'дата начала': 'startDate',
  'startDate': 'startDate',
  'місто': 'city',
  'город': 'city',
  'city': 'city',
  'адреса': 'address',
  'адрес': 'address',
  'address': 'address',
  'місце проведення': 'address',
  'макс учасників': 'maxParticipants',
  'макс участников': 'maxParticipants',
  'maxParticipants': 'maxParticipants',
  'учасники': 'maxParticipants',
  'участники': 'maxParticipants',
  'тип змагання': 'competitionType',
  'тип соревнования': 'competitionType',
  'competitionType': 'competitionType',
  'тип': 'competitionType',
  'ціна': 'price',
  'цена': 'price',
  'price': 'price',
}

/**
 * Импортировать события из CSV
 *
 * CSV формат (укр):
 * Назва,Зображення,Дата початку,Місто,Місце проведення,Макс учасників,Тип змагання,Ціна
 *
 * CSV формат (англ):
 * name,image,startDate,city,address,maxParticipants,competitionType,price
 */
export async function importEventsFromCSV(csvData: string[][], applicationId?: number): Promise<ImportResult> {
  const result: ImportResult = {
    total: csvData.length - 1, // Минус заголовок
    success: 0,
    failed: 0,
    errors: [],
  }

  if (csvData.length < 2) {
    result.errors.push({ row: 0, error: 'CSV файл порожній або містить лише заголовки' })
    return result
  }

  const headers = csvData[0].map(h => h.trim().toLowerCase())
  const columnMap: Record<string, number> = {}

  headers.forEach((header, index) => {
    const englishField = FIELD_MAPPING[header]
    if (englishField) columnMap[englishField] = index
  })

  const requiredFields = ['name', 'startDate', 'city']
  const missingFields = requiredFields.filter(field => columnMap[field] === undefined)

  if (missingFields.length > 0) {
    result.errors.push({
      row: 1,
      error: `Відсутні обов'язкові колонки: ${missingFields.join(', ')}`
    })
    return result
  }

  // Пропускаем заголовок
  const dataRows = csvData.slice(1)

  const allCities = await getCities()

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]
    const rowNumber = i + 2

    try {
      const name = row[columnMap.name]?.trim()
      const image = row[columnMap.image]?.trim()
      const startDate = row[columnMap.startDate]?.trim()
      const city = row[columnMap.city]?.trim()
      const address = row[columnMap.address]?.trim()
      const maxParticipants = row[columnMap.maxParticipants]?.trim()
      const competitionType = row[columnMap.competitionType]?.trim()
      const price = row[columnMap.price]?.trim()

      const validated = eventImportSchema.parse({
        name,
        image,
        startDate,
        city,
        address,
        maxParticipants,
        competitionType,
        price,
      })

      const cityTerm = validated.city.trim().toLowerCase()
      const match = allCities.find(
        (c) =>
          c.name.trim().toLowerCase() === cityTerm ||
          c.slug === validated.city.trim(),
      )
      if (!match?.regionId) {
        throw new Error(
          `Місто "${validated.city}" не знайдено в довіднику — додайте його або вкажіть існуюче місто`,
        )
      }

      const eventData: EventFormData = {
        name: validated.name,
        image: validated.image,
        startDate: validated.startDate,
        gameStartDate: validated.startDate,
        endDate: validated.endDate ?? validated.startDate,
        city: match.slug,
        address: validated.address ?? '',
        regionId: match.regionId,
        maxParticipants: validated.maxParticipants,
        competitionType: validated.competitionType as EventFormData['competitionType'],
        gameTypeId: 1,
        price: validated.price,
        isActive: validated.isActive,
        paymentMethods: ['BANK', 'CASH'],
        sides: [
          {
            name: 'Сторона 1',
            sideCapacity: Math.max(1, Math.ceil(validated.maxParticipants / 2)),
          },
          {
            name: 'Сторона 2',
            sideCapacity: Math.max(1, Math.floor(validated.maxParticipants / 2)),
          },
        ],
      }

      // Добавляем applicationId для админа, если передан
      if (applicationId) {
        (eventData as any).applicationId = applicationId
      }

      await createEvent(eventData)
      result.success++
    } catch (error) {
      result.failed++
      result.errors.push({
        row: rowNumber,
        error: error instanceof Error ? error.message : 'Невідома помилка',
      })
    }
  }

  return result
}
