'use client'

import { MdGroups, MdPeople } from 'react-icons/md'

interface StatCardData {
  icon: React.ElementType
  label: string
  value: string | number
}

interface TeamsStatsProps {
  stats: {
    total: number
    withMembers: number
    totalMembers: number
    averageMembers: string
  }
}

export default function TeamsStats({ stats }: TeamsStatsProps) {
  const cards: StatCardData[] = [
    {
      icon: MdGroups,
      label: 'Всього команд',
      value: stats.total
    },
    {
      icon: MdGroups,
      label: 'З учасниками',
      value: stats.withMembers
    },
    {
      icon: MdPeople,
      label: 'Всього учасників',
      value: stats.totalMembers
    },
    {
      icon: MdPeople,
      label: 'Середня к-ть',
      value: stats.averageMembers
    }
  ]

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <div key={index} className="p-3 sm:p-4 rounded-xl border-2 border-white/10 bg-black/30 min-h-23">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1.5">
              <Icon size={16} />
              <p className="truncate">{card.label}</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-white leading-none">{card.value}</p>
          </div>
        )
      })}
    </div>
  )
}
