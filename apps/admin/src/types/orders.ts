export enum OrderStatus {
  NEW = 'NEW',
  PENDING = 'PENDING',
  PAID = 'PAID',
  PAYMENT_ON_SITE = 'PAYMENT_ON_SITE',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  CANCELLED = 'CANCELLED',
}

export interface Order {
  id: number
  userId: number
  total: number
  status: OrderStatus
  paymentMethod: 'BANK' | 'CASH'
  createdAt: Date
  updatedAt: Date
  user: {
    id: number
    email: string
    fullName: string | null
    nickName: string
    phoneNumber: string | null
  }
  products: Array<{
    id: number
    productId: number
    quantity: number
    price: number
    product: {
      id: number
      name: string
      image: string
      price: number
    }
  }>
  events: Array<{
    id: number
    eventId: number
    status: string
    event: {
      id: number
      name: string
      image: string
      price: number
      startDate: Date
      gameStartDate: Date
      application: {
        id: number
        name: string
      }
    }
  }>
}

export const getOrderStatusLabel = (status: OrderStatus): string => {
  const labels: Record<OrderStatus, string> = {
    [OrderStatus.NEW]: 'Новий',
    [OrderStatus.PENDING]: 'Очікує',
    [OrderStatus.PAID]: 'Оплачено',
    [OrderStatus.PAYMENT_ON_SITE]: 'Оплата на місці',
    [OrderStatus.PAYMENT_FAILED]: 'Помилка оплати',
    [OrderStatus.CANCELLED]: 'Скасовано',
  }
  return labels[status] || status
}

export const getOrderStatusColor = (status: OrderStatus): string => {
  const colors: Record<OrderStatus, string> = {
    [OrderStatus.NEW]: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    [OrderStatus.PENDING]: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    [OrderStatus.PAID]: 'bg-green-500/20 text-green-400 border-green-500/30',
    [OrderStatus.PAYMENT_ON_SITE]: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    [OrderStatus.PAYMENT_FAILED]: 'bg-red-500/20 text-red-400 border-red-500/30',
    [OrderStatus.CANCELLED]: 'bg-red-500/20 text-red-400 border-red-500/50',
  }
  return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}

export const getPaymentMethodLabel = (method: 'BANK' | 'CASH'): string => {
  return method === 'BANK' ? 'Банк' : 'Готівка'
}
