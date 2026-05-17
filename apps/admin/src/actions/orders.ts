'use server'

import { getAuthToken } from '@/app/auth/server-utils'
import { NEXT_PUBLIC_API_KEY, NEXT_PUBLIC_API_URL } from '@/app/utils/config'
import type { Order } from '../types/orders'
import { OrderStatus } from '../types/orders'

export type ServiceOrderStatus = 'NEW' | 'PENDING' | 'COMPLETED' | 'REJECTED'

export interface ServiceOrder {
  id: number
  name: string
  phoneNumber: string
  email: string
  message: string
  topic: string
  company?: string
  status: ServiceOrderStatus
  createdAt: Date
  updatedAt: Date
}

const API_URL = NEXT_PUBLIC_API_URL.replace(/\/$/, '')
const API_KEY = NEXT_PUBLIC_API_KEY

if (!API_URL || !API_KEY) {
  throw new Error('Missing required environment variables: NEXT_PUBLIC_API_URL or NEXT_PUBLIC_API_KEY')
}

const toImageUrl = (img: string | undefined): string => {
  if (!img || img.startsWith('http')) return img ?? ''
  return ''
}

const normalizeOrder = (order: any): Order => {
  if (!order) {
    throw new Error('Order data is missing')
  }

  const events = order.events ?? order.eventRegistrations ?? []

  const num = (v: unknown): number =>
    typeof v === 'number' && !Number.isNaN(v) ? v : typeof v === 'string' ? parseFloat(v) || 0 : 0

  return {
    id: typeof order.id === 'number' ? order.id : 0,
    userId: typeof order.userId === 'number' ? order.userId : 0,
    total: num(order.total),
    status: (order.status as OrderStatus) ?? OrderStatus.NEW,
    paymentMethod: order.paymentMethod ?? 'CASH',
    createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
    updatedAt: order.updatedAt ? new Date(order.updatedAt) : new Date(),
    user: order.user && typeof order.user === 'object' ? {
      id: typeof order.user.id === 'number' ? order.user.id : 0,
      email: String(order.user.email ?? ''),
      fullName: order.user.fullName != null ? order.user.fullName : null,
      nickName: String(order.user.nickName ?? 'Невідомий користувач'),
      phoneNumber: order.user.phoneNumber != null ? order.user.phoneNumber : null,
    } : {
      id: 0,
      email: '',
      fullName: null,
      nickName: 'Невідомий користувач',
      phoneNumber: null,
    },
    products: Array.isArray(order.products) ? order.products.map((p: any) => ({
      id: typeof p?.id === 'number' ? p.id : 0,
      productId: typeof p?.productId === 'number' ? p.productId : 0,
      quantity: num(p?.quantity ?? p?.qty),
      price: num(p?.price),
      product: p?.product && typeof p.product === 'object' ? {
        id: typeof p.product.id === 'number' ? p.product.id : 0,
        name: String(p.product.name ?? ''),
        image: toImageUrl(p.product?.image),
        price: num(p.product.price),
      } : { id: 0, name: '', image: '', price: 0 },
    })) : [],
    events: Array.isArray(events) ? events.map((e: any) => ({
      id: typeof e?.id === 'number' ? e.id : 0,
      eventId: typeof e?.eventId === 'number' ? e.eventId : 0,
      status: String(e?.status ?? ''),
      event: e?.event && typeof e.event === 'object' ? {
        id: typeof e.event.id === 'number' ? e.event.id : 0,
        name: String(e.event.name ?? ''),
        image: toImageUrl(e.event?.image),
        price: num(e.event.price),
        startDate: e.event.startDate ? new Date(e.event.startDate) : new Date(),
        gameStartDate: e.event.gameStartDate
          ? new Date(e.event.gameStartDate)
          : e.event.startDate
            ? new Date(e.event.startDate)
            : new Date(),
        application: e.event.application && typeof e.event.application === 'object' ? {
          id: typeof e.event.application.id === 'number' ? e.event.application.id : 0,
          name: String(e.event.application.name ?? ''),
        } : { id: 0, name: '' },
      } : {
        id: 0,
        name: '',
        image: '',
        price: 0,
        startDate: new Date(),
        gameStartDate: new Date(),
        application: { id: 0, name: '' },
      },
    })) : [],
  }
}

const normalizeServiceOrder = (order: any): ServiceOrder => {
  if (!order) {
    throw new Error('Service order data is missing')
  }

  return {
    id: typeof order.id === 'number' ? order.id : 0,
    name: String(order.name ?? ''),
    phoneNumber: String(order.phoneNumber ?? ''),
    email: String(order.email ?? ''),
    message: String(order.message ?? ''),
    topic: String(order.topic ?? ''),
    company: typeof order.company === 'string' ? order.company : undefined,
    status: (order.status as ServiceOrderStatus) ?? 'NEW',
    createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
    updatedAt: order.updatedAt ? new Date(order.updatedAt) : new Date(),
  }
}

export async function fetchOrders(filters?: {
  userId?: number
  applicationId?: number
  eventId?: number
  status?: OrderStatus
  searchQuery?: string
  orderType?: 'products' | 'events' | 'all'
}): Promise<Order[]> {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Не авторизовані')

    const params = new URLSearchParams()
    if (filters?.userId) params.append('userId', String(filters.userId))
    if (filters?.applicationId) params.append('applicationId', String(filters.applicationId))
    if (filters?.eventId) params.append('eventId', String(filters.eventId))
    if (filters?.status) params.append('status', filters.status)
    if (filters?.searchQuery) params.append('searchQuery', filters.searchQuery)
    if (filters?.orderType) params.append('orderType', filters.orderType)

    const url = `${API_URL}/orders${params.toString() ? `?${params.toString()}` : ''}`

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API error:', response.status, errorText)
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    const list = Array.isArray(data) ? data : [data]
    return list.map(normalizeOrder)
  } catch (error) {
    console.error('Error fetching orders:', error)
    throw error
  }
}

export async function fetchServiceOrders(filters?: {
  status?: ServiceOrderStatus
  searchQuery?: string
}): Promise<ServiceOrder[]> {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Не авторизовані')

    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.searchQuery) params.append('searchQuery', filters.searchQuery)

    const url = `${API_URL}/services${params.toString() ? `?${params.toString()}` : ''}`

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Service API error:', response.status, errorText)
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    const list = Array.isArray(data) ? data : [data]
    return list.map(normalizeServiceOrder)
  } catch (error) {
    console.error('Error fetching service orders:', error)
    throw error
  }
}

export async function fetchNewOrdersBadgeCount(): Promise<number> {
  try {
    const token = await getAuthToken()
    if (!token) return 0

    const [ordersRes, servicesRes] = await Promise.all([
      fetch(`${API_URL}/orders/count?status=NEW`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }),
      fetch(`${API_URL}/services/count?status=NEW`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }),
    ])

    if (!ordersRes.ok || !servicesRes.ok) {
      throw new Error('API error while loading counters')
    }

    const [ordersData, servicesData] = await Promise.all([
      ordersRes.json().catch(() => ({ count: 0 })),
      servicesRes.json().catch(() => ({ count: 0 })),
    ])

    const ordersCount =
      typeof ordersData?.count === 'number' ? ordersData.count : 0
    const servicesCount =
      typeof servicesData?.count === 'number' ? servicesData.count : 0

    return ordersCount + servicesCount
  } catch (error) {
    console.error('Error fetching new orders badge count:', error)
    return 0
  }
}

export async function updateServiceOrderStatus(
  id: number,
  status: ServiceOrderStatus,
): Promise<ServiceOrder> {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Не авторизовані')

    const response = await fetch(`${API_URL}/services/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData?.message || `API error: ${response.status}`)
    }

    const data = await response.json()
    return normalizeServiceOrder(data)
  } catch (error) {
    console.error('Error updating service order:', error)
    throw error
  }
}

export async function deleteServiceOrder(id: number): Promise<void> {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Не авторизовані')

    const response = await fetch(`${API_URL}/services/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) throw new Error(`API error: ${response.status}`)
  } catch (error) {
    console.error('Error deleting service order:', error)
    throw error
  }
}

export async function fetchOrder(id: number): Promise<Order> {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Не авторизовані')

    const response = await fetch(`${API_URL}/orders/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) throw new Error(`API error: ${response.status}`)

    const data = await response.json()
    return normalizeOrder(data)
  } catch (error) {
    console.error('Error fetching order:', error)
    throw error
  }
}

export async function updateOrderStatus(
  id: number,
  status: OrderStatus
): Promise<Order> {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Не авторизовані')

    const response = await fetch(`${API_URL}/orders/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData?.message || `API error: ${response.status}`)
    }

    const data = await response.json()
    return normalizeOrder(data)
  } catch (error) {
    console.error('Error updating order:', error)
    throw error
  }
}

export async function deleteOrder(id: number): Promise<void> {
  try {
    const token = await getAuthToken()
    if (!token) throw new Error('Не авторизовані')

    const response = await fetch(`${API_URL}/orders/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) throw new Error(`API error: ${response.status}`)
  } catch (error) {
    console.error('Error deleting order:', error)
    throw error
  }
}
