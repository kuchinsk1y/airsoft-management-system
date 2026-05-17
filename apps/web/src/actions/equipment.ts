'use server';

import {
  defaultEquipmentItems,
  EQUIPMENT_SLOT_KEYS,
  type EquipmentSlotKey,
  type UserEquipmentItem,
} from '@/constants/equipment';
import { getAuthToken } from '@/utils/auth';
import { NEXT_PUBLIC_API_URL } from '@/utils/config';
import { revalidatePath } from 'next/cache';

const API_BASE = NEXT_PUBLIC_API_URL.replace(/\/$/, '');

export type { UserEquipmentItem } from '@/constants/equipment';

function isEquipmentItem(x: unknown): x is UserEquipmentItem {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  const slotKey = o.slotKey;
  if (
    typeof slotKey !== 'string' ||
    !(EQUIPMENT_SLOT_KEYS as readonly string[]).includes(slotKey)
  ) {
    return false;
  }
  return (
    typeof o.label === 'string' &&
    typeof o.value === 'string'
  );
}

export async function fetchMyEquipment(): Promise<UserEquipmentItem[]> {
  const token = await getAuthToken();
  if (!token) {
    return defaultEquipmentItems();
  }

  try {
    const response = await fetch(`${API_BASE}/users/me/equipment`, {
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return defaultEquipmentItems();
    }

    const data: unknown = await response.json();
    if (!Array.isArray(data)) {
      return defaultEquipmentItems();
    }

    const items = data.filter(isEquipmentItem);
    if (items.length === 0) {
      return defaultEquipmentItems();
    }
    return items;
  } catch {
    return defaultEquipmentItems();
  }
}

export async function updateMyEquipmentAction(
  payload: Record<EquipmentSlotKey, string>,
): Promise<{ success: boolean; message?: string }> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, message: 'Потрібна авторизація' };
    }

    const response = await fetch(`${API_BASE}/users/me/equipment`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const msg =
        typeof body?.message === 'string'
          ? body.message
          : 'Помилка при оновленні екіпіровки';
      return { success: false, message: msg };
    }

    revalidatePath('/profile');
    return { success: true };
  } catch {
    return {
      success: false,
      message: 'Помилка при оновленні екіпіровки',
    };
  }
}
