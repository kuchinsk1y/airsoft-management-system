'use server';

import {
  CartItem,
  CheckoutResponse,
  Order,
  OrdersFilters,
  OrderStatus,
} from '@/interfaces';
import { getAuthToken } from '@/utils/auth';
import { NEXT_PUBLIC_API_URL, STATIC_API_KEY } from '@/utils/config';

export type CreateOrderResult =
  | { ok: true; data: CheckoutResponse }
  | { ok: false; error: string };

export async function createOrder(
  items: CartItem[],
  paymentMethod: 'BANK' | 'CASH' = 'BANK',
): Promise<CreateOrderResult> {
  const token = await getAuthToken();
  if (!token) {
    return { ok: false, error: 'Потрібна авторизація' };
  }

  const orderProducts = items
    .filter((item) => item.productId !== undefined && item.product !== undefined)
    .map((item) => ({
      productId: item.productId!,
      quantity: item.quantity,
      price: item.price,
    }));

  const orderEvents = items
    .filter(
      (item) =>
        item.eventId !== undefined &&
        item.event !== undefined,
    )
    .map((item) => ({
      eventId: Number(item.eventId),
      eventSideId: item.eventSideId ? Number(item.eventSideId) : null,
      teamId: item.teamId ? Number(item.teamId) : undefined,
      price: Number(item.price),
    }));

  const requestBody: {
    products?: typeof orderProducts;
    events?: typeof orderEvents;
    paymentMethod: 'BANK' | 'CASH';
  } = {
    paymentMethod,
  };
  if (orderProducts.length > 0) {
    requestBody.products = orderProducts;
  }
  if (orderEvents.length > 0) {
    requestBody.events = orderEvents;
  }

  try {
    const response = await fetch(`${NEXT_PUBLIC_API_URL}/payments/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    const body = await response.json().catch(() => ({}));
    const msg = (body && typeof body.message === 'string' ? body.message : null) || 'Не вдалося створити замовлення';

    if (!response.ok) {
      if (msg === 'ALREADY_REGISTERED' || body?.errorCode === 'DUPLICATE_ENTRY') {
        return {
          ok: false,
          error:
            'Ви вже зареєстровані на одну з подій у кошику. Скасуйте попередню реєстрацію або приберіть подію з кошика.',
        };
      }
      if (response.status >= 500) {
        return { ok: false, error: 'Помилка сервера. Спробуйте пізніше або оберіть інший спосіб оплати.' };
      }
      return { ok: false, error: msg };
    }

    return { ok: true, data: body as CheckoutResponse };
  } catch {
    return { ok: false, error: 'Помилка мережі. Спробуйте ще раз.' };
  }
}

export async function getOrders(filters?: OrdersFilters): Promise<Order[]> {
  const token = await getAuthToken();
  if (!token) {
    return [];
  }

  try {
    const url = new URL(`${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/orders`);

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-api-key': STATIC_API_KEY,
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function getOrder(id: number): Promise<Order | null> {
  const token = await getAuthToken();
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(
      `${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/orders/${id}`,
      {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-api-key': STATIC_API_KEY,
        },
      },
    );

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}

export async function updateOrder(
  id: number,
  status: OrderStatus,
): Promise<Order | null> {
  const token = await getAuthToken();
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(
      `${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/orders/${id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-api-key': STATIC_API_KEY,
        },
        body: JSON.stringify({ status }),
      },
    );

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}

export type CancelOrderResult =
  | { ok: true }
  | { ok: false; error: string };

export async function cancelOrder(id: number): Promise<CancelOrderResult> {
  const token = await getAuthToken();
  if (!token) {
    return { ok: false, error: 'Потрібна авторизація' };
  }

  try {
    const response = await fetch(
      `${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/orders/${id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-api-key': STATIC_API_KEY,
        },
        body: JSON.stringify({ status: 'CANCELLED' }),
      },
    );

    const body = await response.json().catch(() => ({}));
    const msg =
      (body && typeof body.message === 'string' ? body.message : null) ||
      'Не вдалося скасувати замовлення';

    if (!response.ok) {
      return { ok: false, error: msg };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: 'Помилка мережі. Спробуйте ще раз.' };
  }
}

export async function deleteOrder(id: number): Promise<boolean> {
  const token = await getAuthToken();
  if (!token) {
    return false;
  }

  try {
    const response = await fetch(
      `${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/orders/${id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-api-key': STATIC_API_KEY,
        },
      },
    );

    return response.ok;
  } catch {
    return false;
  }
}
