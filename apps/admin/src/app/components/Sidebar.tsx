'use client'

import * as eventsApi from '@/actions/events'
import { getCommentsByStatus } from '@/actions/comments'
import { logout } from '@/actions/auth'
import { useApplication } from '@/contexts/ApplicationContext'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  MdArticle,
  MdBusiness,
  MdEvent,
  MdExpandLess,
  MdExpandMore, 
  MdFolder,
  MdGroups,
  MdInventory,
  MdLogout,
  MdPayments,
  MdPerson,
  MdPhotoLibrary,
  MdRateReview,
  MdSearch,
  MdSettings,
  MdShoppingCart,
  MdSpaceDashboard,
} from 'react-icons/md'

const iconMap = {
  dashboard: MdSpaceDashboard,
  person: MdPerson,
  groups: MdGroups,
  event: MdEvent,
  folder: MdFolder,
  payments: MdPayments,
  settings: MdSettings,
  logout: MdLogout,
  seo: MdSearch,
  products: MdInventory,
  orders: MdShoppingCart,
  news: MdArticle,
  business: MdBusiness,
  reviews: MdRateReview,
  gallery: MdPhotoLibrary,
}

interface SidebarProps {
  onNavigate?: () => void
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [pagesOpen, setPagesOpen] = useState(false)
  const { clearApplications, isAdmin } = useApplication()

  const { data: pendingModerationCount = 0 } = useQuery({
    queryKey: ['events', 'moderation', 'pending-count'],
    queryFn: () => eventsApi.fetchPendingModerationCount(),
    enabled: isAdmin,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  const { data: pendingCommentsCompany = [] } = useQuery({
    queryKey: ['comments', 'PENDING', 'COMPANY'],
    queryFn: () => getCommentsByStatus('PENDING', 'COMPANY'),
    enabled: isAdmin,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
  const { data: pendingCommentsEvent = [] } = useQuery({
    queryKey: ['comments', 'PENDING', 'EVENT'],
    queryFn: () => getCommentsByStatus('PENDING', 'EVENT'),
    enabled: isAdmin,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
  const pendingCommentsCount = pendingCommentsCompany.length + pendingCommentsEvent.length

  const tabs = [
    { href: '/dashboard', label: 'Дашборд', icon: 'dashboard' },
    { href: '/users', label: 'Юзери', icon: 'person' },
    { href: '/teams', label: 'Команди', icon: 'groups' },
    { href: '/events', label: 'Події', icon: 'event' },
    { href: '/products', label: 'Продукти', icon: 'products' },
    { href: '/news', label: 'Новини', icon: 'news' },
    { href: '/workshop-items', label: 'Майстерня', icon: 'business' },
    { href: '/gallery', label: 'Галерея', icon: 'gallery' },
    { href: '/orders', label: 'Замовлення', icon: 'orders' },
    { href: '/finance', label: 'Фінанси', icon: 'payments' },
    { href: '/reviews', label: 'Відгуки', icon: 'reviews' },
    { href: '/seo/editor', label: 'SEO редактор', icon: 'seo' },
  ] as const

  const pagesSubMenu = [
    { href: '/pages/basic', label: 'Основні сторінки' },
    { href: '/pages/info', label: 'Інформаційні сторінки' },
    { href: '/pages/regions-cities', label: 'SEO регіонів і міст' },
    // { href: '/pages/functional', label: 'Функціональні сторінки' },
  ]

  const bottomTabs = [
    // { href: '/settings', label: 'Налаштування', icon: 'settings' },
  ] as const

  const visibleTabs = isAdmin
    ? tabs
    : [
        tabs.find((t) => t.href === '/events')!,
      ]

  const handleLogout = async () => {
    try {
      onNavigate?.()
      clearApplications()
      await logout()
      router.replace('/auth/sign-in')
    } catch (error) {
      console.error('Logout error:', error)
      router.replace('/auth/sign-in')
    }
  }

  const renderTab = (tab: { href: string; label: string; icon: keyof typeof iconMap }) => {
    const isActive = pathname === tab.href
    const Icon = iconMap[tab.icon]
    const showPendingBadge = isAdmin && tab.href === '/events' && pendingModerationCount > 0
    const showReviewsBadge = isAdmin && tab.href === '/reviews' && pendingCommentsCount > 0

    return (
      <Link
        key={tab.href}
        href={tab.href}
        prefetch={false}
        onClick={() => onNavigate?.()}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isActive ? 'bg-orange-100/10 text-(--color-primary)' : 'text-white hover:bg-gray-900/50'}`}
      >
        <Icon className={`text-2xl ${isActive ? 'text-(--color-primary)' : 'text-white'}`} />
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
          <p className={`truncate text-sm font-medium ${isActive ? 'text-(--color-primary)' : 'text-white'}`}>{tab.label}</p>
          {showPendingBadge && (
            <span className={`inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
              isActive
                ? 'bg-(--color-primary) text-black'
                : 'bg-orange-500/15 text-orange-300'
            }`}>
              {pendingModerationCount}
            </span>
          )}
          {showReviewsBadge && (
            <span className={`inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
              isActive
                ? 'bg-(--color-primary) text-black'
                : 'bg-yellow-500/15 text-yellow-300'
            }`}>
              {pendingCommentsCount}
            </span>
          )}
        </div>
      </Link>
    )
  }

  return (
    <aside className="shrink-0 w-64 h-full bg-[#111111] border-r border-gray-800 flex flex-col overflow-hidden">
      <div className="flex flex-col grow min-h-0 p-4">
        <div className="flex items-center gap-3 mb-8 shrink-0">
          <Image
            src="/Strikeshop_Action_logo.png"
            alt="Логотип"
            width={80}
            height={37}
            className="h-auto w-24"
            priority
          />
          <div className="flex flex-col">
            <h1 className="text-white text-base font-medium">Страйкбол</h1>
            <p className="text-gray-400 text-sm">Адмін-панель</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2 flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-0">
          {visibleTabs.map(renderTab)}
          {isAdmin && (
            <div>
              <button
                onClick={() => setPagesOpen(!pagesOpen)}
                className={`flex items-center justify-between w-full gap-3 px-3 py-2 rounded-lg transition-colors ${
                  pagesOpen || pathname.startsWith('/pages')
                    ? 'bg-orange-100/10 text-(--color-primary)'
                    : 'text-white hover:bg-gray-900/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MdFolder className={`text-2xl ${pagesOpen || pathname.startsWith('/pages') ? 'text-(--color-primary)' : 'text-white'}`} />
                  <p className={`text-sm font-medium ${pagesOpen || pathname.startsWith('/pages') ? 'text-(--color-primary)' : 'text-white'}`}>
                    Сторінки
                  </p>
                </div>
                {pagesOpen ? (
                  <MdExpandLess className={pagesOpen || pathname.startsWith('/pages') ? 'text-(--color-primary)' : 'text-white'} />
                ) : (
                  <MdExpandMore className={pagesOpen || pathname.startsWith('/pages') ? 'text-(--color-primary)' : 'text-white'} />
                )}
              </button>

              {pagesOpen && (
                <div className="mt-1 ml-4 pl-4 border-l-2 border-(--color-primary) flex flex-col gap-1">
                  {pagesSubMenu.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={false}
                        onClick={() => onNavigate?.()}
                        className={`block px-3 py-1.5 text-sm rounded-lg ${
                          isActive
                            ? 'bg-orange-100/10 text-(--color-primary) font-medium'
                            : 'text-gray-400 hover:text-white hover:bg-gray-900/30'
                        }`}
                      >
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-800 flex flex-col gap-2 mt-auto shrink-0">
        {isAdmin && bottomTabs.map(renderTab)}

        <button
          className="flex items-center gap-3 px-3 py-2 rounded-lg border border-(--color-primary) bg-orange-100/10 text-(--color-primary) hover:bg-orange-100/20 transition-colors w-full"
          onClick={handleLogout}
        >
          <MdLogout className="text-2xl" />
          <p className="text-sm font-medium">Вихід</p>
        </button>
      </div>
    </aside>
  )
}
