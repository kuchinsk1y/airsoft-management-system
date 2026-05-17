'use client'

import { useEffect, useState } from 'react'
import { useUserStore } from '@/stores/userStore'
import { getUserEventResults } from '@/actions/ratings'
import type { EventResultResponse } from '@/interfaces'
import TargetIcon from '../icons/TargetIcon'

interface MatchData {
  date: string
  field: string
  result: 'Перемога' | 'Поразка' | 'Учасник'
  kd: string
}

const getResultLabel = (
  outcome?: EventResultResponse['outcome'],
): 'Перемога' | 'Поразка' | 'Учасник' => {
  if (outcome === 'WIN') return 'Перемога'
  return 'Учасник'
}

export default function MatchList() {
  const user = useUserStore((state) => state.currentUser)
  const [matches, setMatches] = useState<MatchData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadMatches = async () => {
      if (!user?.id) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const results = await getUserEventResults(user.id)
        
        // Преобразуем результаты в формат матчей
        const matchData: MatchData[] = results
          .filter((r) => r.event && r.status === 'CONFIRMED')
          .map((result: EventResultResponse) => {
            // Используем confirmedAt если есть, иначе createdAt
            const dateToUse = result.confirmedAt 
              ? new Date(result.confirmedAt)
              : new Date(result.createdAt)
            
            const eventDate = dateToUse.toLocaleDateString('uk-UA', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
            
            const field = result.event?.name || 'Невідома подія'
            const resultLabel = getResultLabel(result.outcome)
            const kd = result.kills !== undefined && result.deaths !== undefined
              ? `${result.kills}/${result.deaths}`
              : result.kills !== undefined
              ? `${result.kills}/0`
              : '0/0'

            return {
              date: eventDate,
              field,
              result: resultLabel,
              kd,
              sortDate: dateToUse.getTime(), // Для сортировки
            }
          })
          .sort((a, b) => {
            // Сортируем по дате (новые сначала)
            return (b as any).sortDate - (a as any).sortDate
          })
          .slice(0, 10) // Показываем только последние 10 матчей
          .map(({ sortDate, ...rest }) => rest) // Удаляем sortDate

        setMatches(matchData)
      } catch (error) {
        console.error('Failed to load matches:', error)
        setMatches([])
      } finally {
        setIsLoading(false)
      }
    }

    loadMatches()
  }, [user])

  return (
    <div className=' border-y border-[#FFFFFF] px-3 pb-3 pt-5.5 uppercase min991:border min991:border-[#262626] min991:p-6 min991:mt-5'>

      <div className='flex items-center gap-3 text-lg font-bold'>
        <TargetIcon /> 
        Останні матчі
      </div>

      {isLoading ? (
        <div className='text-center text-gray-400 py-6 text-sm'>Завантаження...</div>
      ) : matches.length === 0 ? (
        <div className='text-center text-gray-400 py-6 text-sm'>Немає матчів</div>
      ) : (
        <div className='flex flex-col gap-2.5 mt-5 min991:gap-5 min991:mt-5'>
          {matches.map((match, index) => (
            <div
              key={index}
              className=' border border-[#262626] py-2.5 px-5 text-left min991:px-6 min991:py-4'
            >
              <div className='flex gap-6 justify-between items-center'>
                <div className='flex gap-3 items-center'>
                  <span className='text-[#808080] text-sm'>{match.date}</span>
                  <span className='font-bold text-sm hidden min991:block'>{match.field}</span>
                </div>

                <div className='flex items-center gap-4'>
                  <span
                    className={`text-center font-semibold text-xs py-1 ${
                      match.result === 'Перемога'
                        ? 'text-[#FFFFFF] bg-orange-500 w-20 '
                        : 'text-[#A6A6A6] border border-[#808080] w-20 '
                    }`}
                  >
                    {match.result}
                  </span>

                  <span className='text-sm text-[#FFFFFF]'>K/D: {match.kd}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
