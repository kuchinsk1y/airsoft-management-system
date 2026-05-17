'use server';

import { UpdateUserData } from '@/components/Profile/schemas/updateUserSchema';
import { requireAuth } from '@/utils/auth';
import { revalidatePath } from 'next/cache';
import { NEXT_PUBLIC_API_URL } from '@/utils/config';

const getDefaultErrorMessage = (status?: number) => {
  if (status === 401 || status === 403) {
    return 'Потрібна авторизація. Увійдіть і спробуйте ще раз.';
  }
  if (typeof status === 'number' && status >= 500) {
    return 'Помилка сервера. Спробуйте ще раз пізніше.';
  }
  return 'Не вдалося зберегти профіль. Перевірте дані та спробуйте ще раз.';
};

export async function updateUserProfile(data: UpdateUserData) {
  try {
    const payload = {
      fullName: `${data.name} ${data.lastName}`,
      dateOfBirth: data.dateOfBirth,
      phoneNumber: data.phoneNumber !== '' ? data.phoneNumber : null,
      country: data.country,
      region: data.region,
      city: data.city,
    };

    const token = await requireAuth();

    const response = await fetch(`${NEXT_PUBLIC_API_URL}/users`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let message = getDefaultErrorMessage(response.status);

      try {
        const contentType = response.headers.get('content-type') ?? '';
        if (contentType.includes('json')) {
          const body = (await response.json()) as any;
          const apiMessage = body?.message;

          const messages = Array.isArray(apiMessage)
            ? apiMessage
            : typeof apiMessage === 'string'
              ? [apiMessage]
              : [];

          const normalized = messages
            .map((m) => String(m))
            .filter(Boolean);

          if (normalized.length > 0) {
            const joined = normalized.join(' ');
            if (joined.toLowerCase().includes('dateofbirth')) {
              message = 'Некоректна дата народження. Оберіть дату в календарі.';
            } else {
              message = joined;
            }
          }
        } else {
          const text = await response.text();
          if (text) message = text;
        }
      } catch {   
      }

      throw new Error(message);
    }
    revalidatePath('/profile');

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(getDefaultErrorMessage());
  }
}
