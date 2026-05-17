
'use server';

import { getAuthToken } from '@/utils/auth';
import { NEXT_PUBLIC_API_URL, STATIC_API_KEY } from '@/utils/config';

export default async function 
joinToTeam({ id }: { id: number }) {

  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'Необхідно увійти в систему' };
    }

    const apiBase = NEXT_PUBLIC_API_URL.replace(/\/$/, '');
    const response = await fetch(`${apiBase}/teams/${id}/join-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-api-key': STATIC_API_KEY,
      },
    });     
    if (response.ok) {
      return { success: true };
    } else {
      const data = await response
        .json()
        .catch(() => ({ message: response.statusText }));

      const rawMessage = data?.message;
      const code =
        Array.isArray(rawMessage) && rawMessage.length > 0
          ? rawMessage[0]
          : rawMessage;

      const mapped =
        code === 'JOIN_REQUEST_ALREADY_EXISTS'
          ? 'Ви вже подали заявку в цю команду'
          : code === 'ALREADY_TEAM_MEMBER'
            ? 'Ви вже є учасником цієї команди'
            : code === 'TEAM_NOT_FOUND'
              ? 'Команду не знайдено'
              : null;

      return {
        success: false,
        error:
          mapped ||
          (typeof code === 'string' ? code : null) ||
          response.statusText ||
          'Помилка при вступі в команду',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Помилка при вступі в команду',
    };
  }
}