'use client'

import { fetchNewOrdersBadgeCount, fetchOrders, fetchServiceOrders } from '@/actions/orders'
import type { ServiceOrder } from '@/actions/orders'
import { useApplication } from '@/contexts/ApplicationContext'
import { type Order, OrderStatus } from '@/types/orders'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { MdMenu, MdClose, MdNotifications, MdAccountCircle } from 'react-icons/md'
import { NEXT_PUBLIC_WEB_URL } from '@/app/utils/config'

const ORDERS_POLL_INTERVAL_MS = 3 * 60 * 1000
const ORDERS_REFRESH_COOLDOWN_MS = 30 * 1000
const ORDERS_DETAILS_REFRESH_COOLDOWN_MS = 30 * 1000

interface HeaderProps {
  onMenuClick: () => void
  sidebarOpen: boolean
}

export default function Header({ onMenuClick, sidebarOpen }: HeaderProps) {
  const { isAdmin } = useApplication()
  const [allNewOrders, setAllNewOrders] = useState<Array<{ type: 'order'; data: Order } | { type: 'service'; data: ServiceOrder }>>([])
  const [allNewOrdersCount, setAllNewOrdersCount] = useState(0)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(true)
  const notificationsRef = useRef<HTMLDivElement | null>(null)
  const ordersRefreshInFlightRef = useRef(false)
  const ordersLastRefreshAtRef = useRef(0)
  const orderDetailsRefreshInFlightRef = useRef(false)
  const orderDetailsLastRefreshAtRef = useRef(0)

  const getCustomerName = (order: Order) =>
    order.user.fullName?.trim() || order.user.nickName || order.user.email

  const getOrderSummary = (order: Order) => {
    const productItems = order.products
      .map((item) => {
        const name = item.product?.name?.trim()
        if (!name) return ''
        return item.quantity > 1 ? `${name} x${item.quantity}` : name
      })
      .filter(Boolean)

    const eventItems = order.events
      .map((item) => item.event?.name?.trim() || '')
      .filter(Boolean)

    const items = [...productItems, ...eventItems]

    if (items.length === 0) {
      return 'Склад замовлення не вказано'
    }

    if (items.length <= 2) {
      return items.join(', ')
    }

    return `${items[0]}, ${items[1]} +${items.length - 2}`
  }

  const getServiceOrderSummary = (order: ServiceOrder) => {
    const topic = order.topic?.trim()
    if (topic) return topic

    const message = order.message?.trim()
    if (message) return message

    return 'Сервісний запит без опису'
  }

  useEffect(() => {
    if (!isAdmin) {
      setAllNewOrders([])
      setAllNewOrdersCount(0)
      setIsNotificationsOpen(false)
      setIsNotificationsLoading(false)
      return
    }

    let isCancelled = false

    const loadNewOrdersCount = async (force = false) => {
      const now = Date.now()
      if (!force && now - ordersLastRefreshAtRef.current < ORDERS_REFRESH_COOLDOWN_MS) {
        return
      }
      if (ordersRefreshInFlightRef.current) {
        return
      }

      ordersRefreshInFlightRef.current = true
      ordersLastRefreshAtRef.current = now
      try {
        const totalCount = await fetchNewOrdersBadgeCount()
        if (!isCancelled) {
          setAllNewOrdersCount(totalCount)
        }
      } catch {
        if (!isCancelled) {
          setAllNewOrdersCount(0)
        }
      } finally {
        ordersRefreshInFlightRef.current = false
      }
    }

    void loadNewOrdersCount(true)

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadNewOrdersCount()
      }
    }, ORDERS_POLL_INTERVAL_MS)

    const onFocus = () => {
      void loadNewOrdersCount()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void loadNewOrdersCount()
      }
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      isCancelled = true
      window.clearInterval(intervalId)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin || !isNotificationsOpen) {
      return
    }

    let cancelled = false

    const loadNewOrdersDetails = async (force = false) => {
      const now = Date.now()
      if (
        !force &&
        now - orderDetailsLastRefreshAtRef.current < ORDERS_DETAILS_REFRESH_COOLDOWN_MS
      ) {
        return
      }
      if (orderDetailsRefreshInFlightRef.current) {
        return
      }

      orderDetailsRefreshInFlightRef.current = true
      orderDetailsLastRefreshAtRef.current = now
      setIsNotificationsLoading(true)

      try {
        const [orders, serviceOrders] = await Promise.all([
          fetchOrders({ status: OrderStatus.NEW }),
          fetchServiceOrders({ status: 'NEW' }),
        ])

        if (cancelled) {
          return
        }

        const all = [
          ...orders.map((o) => ({ type: 'order' as const, data: o })),
          ...serviceOrders.map((s) => ({ type: 'service' as const, data: s })),
        ].sort((a, b) => {
          const dateA = a.type === 'order' ? a.data.createdAt : a.data.createdAt
          const dateB = b.type === 'order' ? b.data.createdAt : b.data.createdAt
          return dateB.getTime() - dateA.getTime()
        })

        setAllNewOrders(all.slice(0, 3))
      } catch {
        if (!cancelled) {
          setAllNewOrders([])
        }
      } finally {
        if (!cancelled) {
          setIsNotificationsLoading(false)
        }
        orderDetailsRefreshInFlightRef.current = false
      }
    }

    void loadNewOrdersDetails(true)

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible' && isNotificationsOpen) {
        void loadNewOrdersDetails()
      }
    }, ORDERS_POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [isAdmin, isNotificationsOpen])

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (!isNotificationsOpen) return
      const target = event.target as Node
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setIsNotificationsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotificationsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isNotificationsOpen])

  const badgeText = allNewOrdersCount > 99 ? '99+' : String(allNewOrdersCount)

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 p-3 sm:p-4 border-b border-gray-800 bg-[#111111]/80 backdrop-blur-sm">
      <div className="flex items-center gap-2 lg:hidden">
        <Image
          src="/Strikeshop_Action_logo.png"
          alt="Логотип"
          width={80}
          height={37}
          className="h-auto w-24 object-contain"
        />
      </div>

      <button
        className="p-2 text-white rounded-md lg:hidden hover:bg-gray-900/50 transition-colors"
        onClick={onMenuClick}
        aria-label={sidebarOpen ? 'Закрыть меню' : 'Открыть меню'}
        title={sidebarOpen ? 'Закрыть меню' : 'Открыть меню'}
      >
        {sidebarOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
      </button>

      <div className="flex items-center gap-2 ml-auto">
        <a
          href={NEXT_PUBLIC_WEB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-3 py-2 rounded-lg border border-white/10 text-sm font-medium text-white hover:bg-gray-900/50 transition-colors"
          aria-label="Відкрити сайт"
          title="Відкрити сайт"
        >
          Сайт
        </a>
        {isAdmin && (
          <div className="relative" ref={notificationsRef}>
            <button
              className="relative p-2 text-white rounded-full hover:bg-gray-900/50 transition-colors"
              aria-label="Оповещения"
              title="Оповещения"
              onClick={() => setIsNotificationsOpen((prev) => !prev)}
            >
              <MdNotifications size={22} />
              {allNewOrdersCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-(--color-primary) text-white text-[11px] leading-5 font-semibold text-center"
                  aria-label={`Нових замовлень: ${allNewOrdersCount}`}
                >
                  {badgeText}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-88 max-w-[calc(100vw-2rem)] rounded-xl border border-white/10 bg-[#111111] shadow-2xl shadow-black/60 overflow-hidden z-30">
                <div className="px-4 py-3 border-b border-white/10 bg-black/20">
                  <p className="text-sm font-semibold text-white">Нові замовлення</p>
                  <p className="text-xs text-gray-400">
                    {allNewOrdersCount} замовлень в статусі «Новий»
                  </p>
                </div>

                <div className="max-h-72 overflow-y-auto custom-scrollbar p-2">
                  {isNotificationsLoading ? (
                    <p className="px-3 py-4 text-sm text-gray-400">Завантаження...</p>
                  ) : allNewOrders.length === 0 ? (
                    <p className="px-3 py-4 text-sm text-gray-400">Нових замовлень поки немає</p>
                  ) : (
                    allNewOrders.map((item) =>
                      item.type === 'order' ? (
                        <div key={`order-${item.data.id}`} className="rounded-lg border border-white/5 bg-white/2 px-3 py-2.5 mb-2 last:mb-0">
                          <p className="text-sm font-medium text-white truncate">{getCustomerName(item.data)}</p>
                          <p className="mt-1 text-xs text-gray-300 line-clamp-2">{getOrderSummary(item.data)}</p>
                          <p className="mt-1 text-[11px] text-gray-500">Замовлення #{item.data.id}</p>
                        </div>
                      ) : (
                        <div key={`service-${item.data.id}`} className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2.5 mb-2 last:mb-0">
                          <p className="text-sm font-medium text-white truncate">{item.data.name || item.data.email || item.data.phoneNumber}</p>
                          <p className="mt-1 text-xs text-gray-300 line-clamp-2">{getServiceOrderSummary(item.data)}</p>
                          <p className="mt-1 text-[11px] text-cyan-300">Сервісне замовлення #{item.data.id}</p>
                        </div>
                      )
                    )
                  )}
                </div>

                <div className="p-2 border-t border-white/10 bg-black/20">
                  <Link
                    href="/orders"
                    prefetch={false}
                    onClick={() => setIsNotificationsOpen(false)}
                    className="w-full inline-flex items-center justify-center rounded-lg bg-(--color-primary) hover:bg-(--color-primary-hover) text-white text-sm font-semibold px-3 py-2 transition-colors"
                  >
                    Переглянути всі
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
        <Link href="/profile" prefetch={false} className="p-2 text-white rounded-full hover:bg-gray-900/50 transition-colors" aria-label="Профиль" title="Профиль">
          <MdAccountCircle size={22} />
        </Link>
      </div>
    </header>
  )
}
