'use client'

import { Order, OrderStatus, getOrderStatusLabel, getOrderStatusColor, getPaymentMethodLabel } from '@/types/orders'
import Image from 'next/image'
import Link from 'next/link'
import { MdDelete, MdEmail, MdEvent, MdKeyboardArrowDown, MdPerson, MdPhone, MdShoppingCart } from 'react-icons/md'

interface OrderCardProps {
  order: Order
  onStatusChange: (orderId: number, status: Order['status']) => void
  onDelete: (orderId: number) => void
  isLoading?: boolean
}

export default function OrderCard({ order, onStatusChange, onDelete, isLoading = false }: OrderCardProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const hasProducts = order.products && order.products.length > 0
  const hasEvents = order.events && order.events.length > 0

  const getEventRegistrationStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Очікує',
      APPROVED: 'Підтверджено',
      REJECTED: 'Відхилено',
      CANCELLED: 'Скасовано',
    }
    return labels[status] || status
  }

  const getImageSrc = (image: string) => {
    if (!image) return ''
    const raw = image.trim().replace(/\\/g, '/')
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
    return ''
  }

  const isOrderCancelled = order.status === OrderStatus.CANCELLED

  return (
    <div className={`rounded-xl overflow-hidden shadow-lg shadow-black/20 hover:shadow-black/30 transition-all duration-200 group border-2 ${
      isOrderCancelled ? 'bg-red-950/30 border-red-500/50' : 'bg-black/30 border-white/10'
    }`}>
      <div className="p-4 border-b border-white/10 bg-black/20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h3 className="text-lg font-bold text-white">
                Замовлення №{order.id}
              </h3>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getOrderStatusColor(order.status)}`}>
                {getOrderStatusLabel(order.status)}
              </span>
            </div>
            <p className="text-sm text-gray-400">
              {formatDate(order.createdAt)}
            </p>
          </div>
          <button
            onClick={() => order.id > 0 && onDelete(order.id)}
            disabled={isLoading || order.id <= 0}
            className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors disabled:opacity-50"
            aria-label="Видалити"
          >
            <MdDelete size={20} />
          </button>
        </div>
      </div>

      {order.user && (
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <MdPerson className="text-(--color-primary)" size={20} />
            <h4 className="text-sm font-semibold text-white">Користувач</h4>
          </div>
          <div className="grid grid-cols-[7rem_1fr] gap-x-4 gap-y-2 text-sm items-baseline">
            <span className="text-gray-500">Ім'я:</span>
            <span className="text-gray-300">{order.user.fullName || order.user.nickName || 'Не вказано'}</span>

            <span className="text-gray-500">Нікнейм:</span>
            <span className="text-gray-300">{order.user.nickName || '—'}</span>

            <span className="text-gray-500 flex items-center gap-1.5">
              <MdEmail className="text-gray-500 shrink-0" size={16} />
              Email:
            </span>
            <span className="text-gray-300">{order.user.email || '—'}</span>

            <span className="text-gray-500 flex items-center gap-1.5">
              <MdPhone className="text-gray-500 shrink-0" size={16} />
              Телефон:
            </span>
            <span className="text-gray-300">{order.user.phoneNumber || '—'}</span>
          </div>
        </div>
      )}

      {order.products.length > 0 && (
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <MdShoppingCart className="text-(--color-primary)" size={20} />
            <h4 className="text-sm font-semibold text-white">Продукти</h4>
          </div>
          <div className="space-y-3">
            {order.products.map((item) => {
              const imageSrc = getImageSrc(item.product.image)
              return (
                <div key={item.id} className="flex gap-3 bg-black/20 rounded-lg p-3 border border-white/10">
                  {imageSrc && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-black/30">
                      <Image
                        src={imageSrc}
                        alt={item.product.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products?edit=${item.product.id}`}
                      className="text-sm font-semibold text-white block hover:text-(--color-primary) hover:underline truncate"
                    >
                      {item.product.name}
                    </Link>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                      <span>Кількість: {item.quantity}</span>
                      <span>Ціна: {item.price} грн</span>
                      <span className="text-gray-300 font-medium">
                        Разом: {item.price * item.quantity} грн
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {order.events.length > 0 && (
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <MdEvent className="text-(--color-primary)" size={20} />
            <h4 className="text-sm font-semibold text-white">Реєстрація на події</h4>
          </div>
          <div className="space-y-3">
            {order.events.map((item) => {
              const imageSrc = getImageSrc(item.event.image)
              const appName = item.event?.application?.name
              const isRegistrationCancelled = item.status === 'CANCELLED'
              return (
                <div
                  key={item.id}
                  className={`flex gap-3 rounded-lg p-3 border ${
                    isRegistrationCancelled
                      ? 'bg-red-950/30 border-red-500/40'
                      : 'bg-black/20 border-white/10'
                  }`}
                >
                  {imageSrc && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-black/30">
                      <Image
                        src={imageSrc}
                        alt={item.event.name}
                        fill
                        sizes="64px"
                        className={`object-cover ${isRegistrationCancelled ? 'opacity-60' : ''}`}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/events?edit=${item.event.id}`}
                        className={`text-sm font-semibold block hover:text-(--color-primary) hover:underline ${
                          isRegistrationCancelled ? 'text-red-300/90 line-through' : 'text-white'
                        }`}
                      >
                        {item.event.name}
                      </Link>
                      {isRegistrationCancelled && (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-500/30 text-red-300 border border-red-500/50">
                          Учасник скасував реєстрацію
                        </span>
                      )}
                    </div>
                    {appName ? (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Заявка: {appName}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
                      <span>Ціна: {item.event.price} грн</span>
                      <span>
                        Дата події: {new Date(item.event.gameStartDate ?? item.event.startDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      {item.status ? (
                        <span className={isRegistrationCancelled ? 'text-red-400 font-medium' : 'text-gray-300'}>
                          Статус реєстрації: {getEventRegistrationStatusLabel(item.status)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!hasProducts && !hasEvents && (
        <div className="p-4 border-b border-white/10">
          <p className="text-sm text-gray-500">Склад замовлення: немає даних</p>
        </div>
      )}

      <div className="p-4 bg-black/20">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-400">Спосіб оплати:</span>
          <span className="text-sm font-semibold text-white">{getPaymentMethodLabel(order.paymentMethod)}</span>
        </div>
        <div className="flex items-center justify-between mb-3 pt-2 border-t border-white/10">
          <span className="text-lg font-bold text-white">Загальна сума:</span>
          <span className="text-xl font-black text-white">{order.total.toFixed(2)} грн</span>
        </div>
        <div className="pt-3 border-t border-white/10">
          <label className="block text-sm font-semibold text-white mb-2">Змінити статус:</label>
          <div className="relative">
            <select
              value={order.status}
              onChange={(e) => order.id > 0 && onStatusChange(order.id, e.target.value as Order['status'])}
              disabled={isLoading || order.id <= 0}
              aria-label="Змінити статус замовлення"
              className="w-full appearance-none pr-9 px-3 py-2 bg-white/5 text-white rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none text-sm disabled:opacity-50 hover:bg-white/10 transition-colors"
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
        </div>
      </div>
    </div>
  )
}
