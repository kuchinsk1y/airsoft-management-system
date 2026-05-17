'use client'

import { Team } from '@/actions/teams'
import { MdGroups, MdPeople, MdVisibility } from 'react-icons/md'
import styles from './ListReveal.module.css'

interface TeamsCardsProps {
  teams: Team[]
  onViewTeam: (teamId: number) => void
}

export default function TeamsCards({ teams, onViewTeam }: TeamsCardsProps) {
  return (
    <div className={`xl:hidden grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 ${styles.containerEnter}`}>
      {teams.map((team, index) => {
        const activeMembers = team.members?.filter((m) => m.memberStatus === 'ACTIVE').length || 0
        const totalMembers = team.members?.length || 0

        return (
          <div
            key={team.id}
            className={`${styles.cardReveal} h-full bg-black/20 border border-white/10 rounded-xl p-4 sm:p-5 space-y-3 sm:space-y-4`}
            style={{ animationDelay: `${Math.min(index * 32, 320)}ms` }}
          >
            <div className="flex items-start gap-3">
              {team.logoUrl ? (
                <img
                  src={team.logoUrl}
                  alt={team.name}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <MdGroups className="text-gray-500" size={28} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-white font-semibold text-base sm:text-lg leading-tight line-clamp-2">{team.name}</h3>
                  <span className="text-gray-500 text-xs whitespace-nowrap">#{team.id}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 text-sm">
              <div className="bg-white/5 rounded-lg p-2.5 sm:p-3">
                <p className="text-gray-500 text-xs mb-1">Учасників</p>
                <div className="flex items-center gap-1">
                  <MdPeople className="text-gray-400" size={16} />
                  <span className="text-white font-medium">{activeMembers}</span>
                  {totalMembers > activeMembers && (
                    <span className="text-gray-500 text-xs">/ {totalMembers}</span>
                  )}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-2.5 sm:p-3">
                <p className="text-gray-500 text-xs mb-1">Створено</p>
                <p className="text-white font-medium">
                  {new Date(team.createdAt).toLocaleDateString('uk-UA', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit'
                  })}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => onViewTeam(team.id)}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 min-h-10 bg-(--color-primary) hover:bg-(--color-primary-hover) text-white rounded-lg transition-colors text-sm font-semibold"
              >
                <MdVisibility size={18} />
                <span>Переглянути</span>
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
