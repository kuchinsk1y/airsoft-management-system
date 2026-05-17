'use client'

import { Team } from '@/actions/teams'
import { MdGroups, MdPeople, MdVisibility } from 'react-icons/md'
import styles from './ListReveal.module.css'

interface TeamsTableProps {
  teams: Team[]
  onViewTeam: (teamId: number) => void
}

export default function TeamsTable({ teams, onViewTeam }: TeamsTableProps) {
  return (
    <div className={`hidden xl:block overflow-x-auto overflow-y-hidden rounded-xl border border-white/10 bg-black/20 ${styles.containerEnter}`}>
      <table className="w-full min-w-215 text-sm text-left">
        <thead className="text-xs uppercase bg-black/30 text-gray-400 border-b-2 border-white/10">
          <tr>
            <th scope="col" className="px-6 py-4">ID</th>
            <th scope="col" className="px-6 py-4">Команда</th>
            <th scope="col" className="px-6 py-4">Учасників</th>
            <th scope="col" className="px-6 py-4">Дата створення</th>
            <th scope="col" className="px-6 py-4 text-right">Дії</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team, index) => {
            const activeMembers = team.members?.filter((m) => m.memberStatus === 'ACTIVE').length || 0
            const totalMembers = team.members?.length || 0

            return (
              <tr
                key={team.id}
                className={`${styles.rowReveal} bg-black/20 border-b border-white/5 hover:bg-white/5 transition-colors`}
                style={{ animationDelay: `${Math.min(index * 28, 280)}ms` }}
              >
                <td className="px-6 py-4 text-gray-400">#{team.id}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {team.logoUrl ? (
                      <img
                        src={team.logoUrl}
                        alt={team.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                        <MdGroups className="text-gray-500" size={24} />
                      </div>
                    )}
                    <div>
                      <p className="text-white font-semibold">{team.name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <MdPeople className="text-gray-400" size={18} />
                    <span className="text-white font-medium">{activeMembers}</span>
                    {totalMembers > activeMembers && (
                      <span className="text-gray-500 text-xs">({totalMembers} всього)</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-400">
                  {new Date(team.createdAt).toLocaleDateString('uk-UA')}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onViewTeam(team.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 min-h-9 bg-(--color-primary) hover:bg-(--color-primary-hover) text-white rounded-lg transition-colors text-sm font-semibold"
                  >
                    <MdVisibility size={18} />
                    <span>Переглянути</span>
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
