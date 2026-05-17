'use client'

import * as eventsApi from '@/actions/events'
import { useApplication } from '@/contexts/ApplicationContext'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface TabsNavigationProps {
  className?: string
}

export default function TabsNavigation({ className = '' }: TabsNavigationProps) {
  const pathname = usePathname()
  const { isAdmin } = useApplication()

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['events', 'moderation', 'pending-count'],
    queryFn: () => eventsApi.fetchPendingModerationCount(),
    enabled: isAdmin,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  const tabs = [
    { href: '/events', label: 'Страйкбольні ігри', key: 'events' },
    ...(isAdmin ? [{ href: '/events/moderation', label: 'Модерація', key: 'moderation' }] : []),
    { href: '/events/pending-ratings', label: 'Очікують результатів', key: 'pending-ratings' },
    ...(isAdmin ? [{ href: '/events/game-types', label: 'Типи ігор', key: 'game-types' }] : []),
    { href: '/events/archive', label: 'Архів', key: 'archive' },
  ]

  const isActive = (href: string) => {
    if (href === '/events') {
      return pathname === '/events'
    }
    return pathname?.startsWith(href)
  }

  return (
    <div className={`border-b border-white/10 ${className}`}>
      <div className="overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max min-w-full gap-8">
          {tabs.map((tab) => {
            const active = isActive(tab.href)
            return (
              <Link
                key={tab.key}
                href={tab.href}
                className={`pb-3 font-semibold text-sm transition-colors relative inline-flex items-center gap-2 whitespace-nowrap ${
                  active
                    ? 'text-(--color-primary)'
                    : 'text-gray-400 hover:text-gray-300'
                } ${
                  active
                    ? 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-(--color-primary)'
                    : ''
                }`}
              >
                {tab.label}
                {tab.key === 'moderation' && pendingCount > 0 && (
                  <span className={`inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    active
                      ? 'bg-(--color-primary) text-black'
                      : 'bg-orange-500/15 text-orange-300'
                  }`}>
                    {pendingCount}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
