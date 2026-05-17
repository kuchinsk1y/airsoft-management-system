'use client'

import LoadingSpinner from '@/app/components/LoadingSpinner'
import NotFound from '@/app/not-found'
import { useApplication } from '@/contexts/ApplicationContext'
import TabsNavigation from '../components/TabsNavigation'
import ModerationTab from '../tabs/moderation/ModerationTab'

export default function EventsModerationPage() {
  const { hasResolvedApplications, isAdmin, isLoading } = useApplication()

  if (!hasResolvedApplications && isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size="lg" thickness="thin" />
          <p className="text-sm text-gray-400">Перевірка доступу до модерації...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return <NotFound />
  }

  return (
    <div className="space-y-6">
      <TabsNavigation />
      <ModerationTab />
    </div>
  )
}