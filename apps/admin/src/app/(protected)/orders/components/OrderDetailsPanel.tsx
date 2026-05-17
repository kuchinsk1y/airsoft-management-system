'use client'

import { Order, OrderStatus, getOrderStatusLabel, getPaymentMethodLabel } from '@/types/orders'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { useEffect } from 'react'
import { MdClose, MdDelete, MdEvent, MdKeyboardArrowDown, MdPerson, MdShoppingCart } from 'react-icons/md'

interface OrderDetailsPanelProps {
  order: Order | null
  open: boolean
  isLoading?: boolean
  onClose: () => void
  onDelete: (orderId: number) => void
  onStatusChange: (orderId: number, status: Order['status']) => void
}

const panelTransition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const }

export default function OrderDetailsPanel({
  order,
  open,
  isLoading = false,
  onClose,
  onDelete,
  onStatusChange,
}: OrderDetailsPanelProps) {
  useEffect(() => {
    if (!open) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [open, onClose])

  const getImageSrc = (image: string) => {
    if (!image) return ''
    const raw = image.trim().replace(/\\/g, '/')
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
    return ''
  }

  const getEventRegistrationStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Очікує',
      APPROVED: 'Підтверджено',
      REJECTED: 'Відхилено',
      CANCELLED: 'Скасовано',
    }
    return labels[status] || status
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const customerName = order
    ? order.user.fullName?.trim() || order.user.nickName || order.user.email
    : ''

  return (
    <AnimatePresence>
      {open && order && (
        <motion.div
          className="fixed inset-0 z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={panelTransition}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"
            onClick={onClose}
            aria-label="Закрити панель замовлення"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={panelTransition}
            className="absolute right-0 top-0 h-full w-full sm:max-w-xl border-l border-white/10 bg-[#0f0f10] shadow-2xl shadow-black/60"
          >
            <div className="h-full flex flex-col">
              <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-white/10 bg-black/20">
                <div>
                  <p className="text-xs text-gray-400">Замовлення</p>
                  <h2 className="text-xl font-bold text-white">#{order.id}</h2>
                  <p className="mt-1 text-sm text-gray-300">{formatDate(order.createdAt)}</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Закрити"
                >
                  <MdClose size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-5">
                <section className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MdPerson className="text-(--color-primary)" size={18} />
                    <h3 className="text-sm font-semibold text-white">Клієнт</h3>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <p className="text-gray-200">{customerName}</p>
                    <p className="text-gray-400">{order.user.email || '—'}</p>
                    <p className="text-gray-400">{order.user.phoneNumber || '—'}</p>
                  </div>
                </section>

                {order.products.length > 0 && (
                  <section className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MdShoppingCart className="text-(--color-primary)" size={18} />
                      <h3 className="text-sm font-semibold text-white">Продукти</h3>
                    </div>
                    <div className="space-y-2.5">
                      {order.products.map((item) => {
                        const imageSrc = getImageSrc(item.product.image)
                        return (
                          <div key={item.id} className="flex gap-3 rounded-lg border border-white/10 bg-black/30 p-2.5">
                            {imageSrc ? (
                              <div className="relative w-12 h-12 rounded-md overflow-hidden shrink-0 bg-black/40">
                                <Image src={imageSrc} alt={item.product.name} fill sizes="48px" className="object-cover" />
                              </div>
                            ) : null}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-white truncate">{item.product.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {item.quantity} x {item.price.toFixed(2)} грн
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )}

                {order.events.length > 0 && (
                  <section className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MdEvent className="text-(--color-primary)" size={18} />
                      <h3 className="text-sm font-semibold text-white">Події</h3>
                    </div>
                    <div className="space-y-2.5">
                      {order.events.map((item) => {
                        const imageSrc = getImageSrc(item.event.image)
                        return (
                          <div key={item.id} className="flex gap-3 rounded-lg border border-white/10 bg-black/30 p-2.5">
                            {imageSrc ? (
                              <div className="relative w-12 h-12 rounded-md overflow-hidden shrink-0 bg-black/40">
                                <Image src={imageSrc} alt={item.event.name} fill sizes="48px" className="object-cover" />
                              </div>
                            ) : null}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-white truncate">{item.event.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {new Date(item.event.gameStartDate ?? item.event.startDate).toLocaleDateString('uk-UA')}
                              </p>
                              {item.status ? (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {getEventRegistrationStatusLabel(item.status)}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )}

                <section className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Спосіб оплати</span>
                    <span className="text-white font-semibold">{getPaymentMethodLabel(order.paymentMethod)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-400">Поточний статус</span>
                    <span className="text-white font-semibold">{getOrderStatusLabel(order.status)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                    <span className="text-gray-300">Сума</span>
                    <span className="text-2xl font-bold text-white">{order.total.toFixed(2)} грн</span>
                  </div>
                </section>
              </div>

              <div className="px-5 py-4 border-t border-white/10 bg-black/25 space-y-3">
                <div className="relative">
                  <select
                    value={order.status}
                    onChange={(event) => onStatusChange(order.id, event.target.value as Order['status'])}
                    disabled={isLoading}
                    className="w-full appearance-none pr-9 px-3 py-2 bg-white/5 text-white rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none text-sm disabled:opacity-50"
                    aria-label="Оновити статус замовлення"
                  >
                    <option value={OrderStatus.NEW}>{getOrderStatusLabel(OrderStatus.NEW)}</option>
                    <option value={OrderStatus.PENDING}>{getOrderStatusLabel(OrderStatus.PENDING)}</option>
                    <option value={OrderStatus.PAID}>{getOrderStatusLabel(OrderStatus.PAID)}</option>
                    <option value={OrderStatus.PAYMENT_ON_SITE}>{getOrderStatusLabel(OrderStatus.PAYMENT_ON_SITE)}</option>
                    <option value={OrderStatus.PAYMENT_FAILED}>{getOrderStatusLabel(OrderStatus.PAYMENT_FAILED)}</option>
                    <option value={OrderStatus.CANCELLED}>{getOrderStatusLabel(OrderStatus.CANCELLED)}</option>
                  </select>
                  <MdKeyboardArrowDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" size={20} />
                </div>

                <button
                  type="button"
                  onClick={() => onDelete(order.id)}
                  disabled={isLoading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  <MdDelete size={18} />
                  Видалити замовлення
                </button>
              </div>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
