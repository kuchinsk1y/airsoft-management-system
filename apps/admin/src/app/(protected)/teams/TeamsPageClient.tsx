'use client'

import * as teamsApi from '@/actions/teams'
import LoadingSpinner from '@/app/components/LoadingSpinner'
import { useDebounce } from '@/hooks/useDebounce'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { MdGroups } from 'react-icons/md'
import { TeamsStats, TeamsFilters, TeamsTable, TeamsCards, TeamDetailsModal } from './components'

export default function TeamsPageClient() {
  const [teams, setTeams] = useState<teamsApi.Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 400)
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const loadTeams = async () => {
      try {
        setIsLoading(true)
        const filters: teamsApi.TeamsFilters = {}
        if (debouncedSearchQuery) {
          filters.searchQuery = debouncedSearchQuery
        }
        const data = await teamsApi.fetchTeams(filters)
        setTeams(data)
      } catch (err) {
        console.error('Failed to load teams:', err)
        setTeams([])
      } finally {
        setIsLoading(false)
      }
    }

    loadTeams()
  }, [debouncedSearchQuery])

  const stats = useMemo(() => {
    const totalMembers = teams.reduce(
      (sum, team) => sum + (team.members?.filter((m) => m.memberStatus === 'ACTIVE').length || 0),
      0,
    )
    const averageMembers = teams.length > 0 ? String(Math.ceil(totalMembers / teams.length)) : '0'
    
    return {
      total: teams.length,
      withMembers: teams.filter((t) => (t.members?.filter((m) => m.memberStatus === 'ACTIVE').length || 0) > 0).length,
      totalMembers,
      averageMembers,
    }
  }, [teams])

  const handleViewTeam = useCallback((teamId: number) => {
    setSelectedTeamId(teamId)
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedTeamId(null)
  }, [])

  const hasSearch = debouncedSearchQuery.trim().length > 0

  return (
    <div className="min-h-screen space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Команди</h1>
        </div>
        <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-2 rounded-lg border border-white/10 bg-black/30 text-xs sm:text-sm">
          <span className="text-gray-400">Знайдено:</span>
          <span className="text-white font-semibold">{teams.length}</span>
          {hasSearch && <span className="text-gray-500">за запитом</span>}
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <TeamsStats stats={stats} />
        <TeamsFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          resultCount={teams.length}
        />

        {isLoading && teams.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        ) : teams.length === 0 ? (
          <div className="p-8 sm:p-12 rounded-xl border-2 border-white/10 bg-black/30 text-center">
            <MdGroups size={64} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-base sm:text-lg">Команди не знайдено</p>
            <p className="text-gray-500 text-sm mt-2">Спробуйте змінити параметри пошуку</p>
          </div>
        ) : (
          <>
            <TeamsTable teams={teams} onViewTeam={handleViewTeam} />
            <TeamsCards teams={teams} onViewTeam={handleViewTeam} />
          </>
        )}
      </div>

      {selectedTeamId && (
        <TeamDetailsModal
          teamId={selectedTeamId}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}
