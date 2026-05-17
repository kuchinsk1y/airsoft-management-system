'use client'

import { useApplication } from '@/contexts/ApplicationContext'
import { motion, useReducedMotion, Variants } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as commentsApi from '@/actions/comments'
import * as eventsApi from '@/actions/events'
import * as ordersApi from '@/actions/orders'
import * as teamsApi from '@/actions/teams'
import * as usersApi from '@/actions/users'
import { MdEvent, MdForum, MdGroups, MdPeople, MdShoppingCart } from 'react-icons/md'
import { DashboardHeader, StatsCards, ChartsSection, EventsSection, StatCardData, EventData } from './components'
import type { Event } from '../events/types'

const getEventGameStartDate = (event: { gameStartDate?: string | Date; startDate: string | Date }): Date =>
  new Date(event.gameStartDate ?? event.startDate)

export default function DashboardPageClient({
  initialEvents = [],
  initialTeamsCount = 0,
  initialUsersCount = 0,
  initialNewOrdersCount = 0,
  initialPendingModerationCount = 0,
  initialPendingCommentsCount = 0,
  serverFetchedAt = 0,
}: {
  initialEvents?: Event[]
  initialTeamsCount?: number
  initialUsersCount?: number
  initialNewOrdersCount?: number
  initialPendingModerationCount?: number
  initialPendingCommentsCount?: number
  serverFetchedAt?: number
}) {
  const router = useRouter()
  const { applications, hasResolvedApplications } = useApplication()
  const shouldReduceMotion = useReducedMotion()
  const [isCompactViewport, setIsCompactViewport] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1024px)')
    const apply = () => setIsCompactViewport(media.matches)
    apply()

    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [])

  const container = useMemo<Variants>(() => {
    if (shouldReduceMotion) {
      return {
        hidden: { opacity: 1 },
        visible: { opacity: 1 },
      }
    }

    return {
      hidden: { opacity: 0, filter: 'blur(6px)' },
      visible: {
        opacity: 1,
        filter: 'blur(0px)',
        transition: {
          duration: 0.34,
          ease: [0.22, 1, 0.36, 1],
          staggerChildren: isCompactViewport ? 0.04 : 0.055,
          delayChildren: isCompactViewport ? 0.02 : 0.04,
        },
      },
    }
  }, [isCompactViewport, shouldReduceMotion])

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsApi.fetchEvents(),
    initialData: initialEvents.length > 0 ? initialEvents : undefined,
    initialDataUpdatedAt: serverFetchedAt,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  const { data: teamsCount = 0 } = useQuery({
    queryKey: ['teamsCount'],
    queryFn: () => teamsApi.getTeamsCount(),
    initialData: serverFetchedAt > 0 ? initialTeamsCount : undefined,
    initialDataUpdatedAt: serverFetchedAt,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  const { data: usersCount = 0 } = useQuery({
    queryKey: ['usersCount'],
    queryFn: () => usersApi.getUsersCount(),
    initialData: serverFetchedAt > 0 ? initialUsersCount : undefined,
    initialDataUpdatedAt: serverFetchedAt,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  const { data: newOrdersCount = 0 } = useQuery({
    queryKey: ['dashboardNewOrdersCount'],
    queryFn: () => ordersApi.fetchNewOrdersBadgeCount(),
    initialData: serverFetchedAt > 0 ? initialNewOrdersCount : undefined,
    initialDataUpdatedAt: serverFetchedAt,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  const { data: pendingModerationCount = 0 } = useQuery({
    queryKey: ['dashboardPendingModerationCount'],
    queryFn: () => eventsApi.fetchPendingModerationCount(),
    initialData: serverFetchedAt > 0 ? initialPendingModerationCount : undefined,
    initialDataUpdatedAt: serverFetchedAt,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  const { data: pendingCommentsCount = 0 } = useQuery({
    queryKey: ['dashboardPendingCommentsCount'],
    queryFn: () => commentsApi.getCommentsByStatus('PENDING').then((items) => items.length),
    initialData: serverFetchedAt > 0 ? initialPendingCommentsCount : undefined,
    initialDataUpdatedAt: serverFetchedAt,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  const { dailyLabels, dailyData } = useMemo(() => {
    const days = 30
    const now = new Date()
    const labels: string[] = []
    const data = Array.from({ length: days }, () => 0)

    for (let i = days - 1; i >= 0; i -= 1) {
      const date = new Date(now)
      date.setDate(now.getDate() - i)
      labels.push(date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' }))
    }

    events.forEach((event) => {
      const eventDate = getEventGameStartDate(event)
      const diffDays = Math.floor((now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays >= 0 && diffDays < days) {
        const index = days - diffDays - 1
        data[index] += 1
      }
    })

    return { dailyLabels: labels, dailyData: data }
  }, [events])

  const { eventTypeLabels, eventTypeData } = useMemo(() => {
    const counts = new Map<string, number>()
    events.forEach((event) => {
      const type = event.competitionType || 'Інше'
      counts.set(type, (counts.get(type) || 0) + 1)
    })

    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
    const top = sorted.slice(0, 4)
    const rest = sorted.slice(4)
    const restTotal = rest.reduce((sum, [, value]) => sum + value, 0)

    const labels = top.map(([label]) => label)
    const data = top.map(([, value]) => value)

    if (restTotal > 0) {
      labels.push('Інше')
      data.push(restTotal)
    }

    return { eventTypeLabels: labels, eventTypeData: data }
  }, [events])

  const upcomingEvents: EventData[] = useMemo(() => {
    const now = new Date()
    return events
      .filter((event) => !event.isCompleted && getEventGameStartDate(event) >= now)
      .sort((a, b) => getEventGameStartDate(a).getTime() - getEventGameStartDate(b).getTime())
      .slice(0, 4)
  }, [events])

  const stats: StatCardData[] = useMemo(() => {
    const activeEvents = events.filter((event) => event.isActive).length
    return [
      {
        title: 'Активні події',
        value: String(activeEvents),
        delta: '',
        icon: MdEvent,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        href: '/events',
      },
      {
        title: 'Користувачі',
        value: String(usersCount),
        delta: '',
        icon: MdPeople,
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        href: '/users',
      },
      {
        title: 'Команди',
        value: String(teamsCount),
        delta: '',
        icon: MdGroups,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        href: '/teams',
      },
      {
        title: 'Нові замовлення',
        value: String(newOrdersCount),
        delta: '',
        icon: MdShoppingCart,
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        href: '/orders',
      },
      {
        title: 'Події на модерації',
        value: String(pendingModerationCount),
        delta: '',
        icon: MdEvent,
        color: 'text-rose-400',
        bgColor: 'bg-rose-500/10',
        href: '/events/moderation',
      },
      {
        title: 'Коментарі на модерації',
        value: String(pendingCommentsCount),
        delta: '',
        icon: MdForum,
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
        href: '/reviews',
      },
    ]
  }, [events, usersCount, teamsCount, newOrdersCount, pendingModerationCount, pendingCommentsCount])

  const handleQuickAction = (action: string) => {
    router.push(action)
  }

  return (
    <motion.div
      className="text-white space-y-[clamp(1.25rem,2.6vw,2rem)] transition-[gap] duration-300 ease-out"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      <DashboardHeader
        hasApplications={applications.length > 0}
        showCreateApplicationAction={hasResolvedApplications && applications.length === 0}
        onQuickAction={handleQuickAction}
      />
      <StatsCards stats={stats} onCardClick={handleQuickAction} />
      <ChartsSection
        dailyLabels={dailyLabels}
        dailyData={dailyData}
        eventTypeLabels={eventTypeLabels}
        eventTypeData={eventTypeData}
      />
      <EventsSection events={upcomingEvents} />
    </motion.div>
  )
}
