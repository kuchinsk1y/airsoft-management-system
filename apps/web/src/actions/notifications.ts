'use server';

import { getAuthToken } from '@/utils/auth';
import { NEXT_PUBLIC_API_URL, STATIC_API_KEY } from '@/utils/config';
import type { NotificationItem } from '@/interfaces';
import type {
  TeamInvitationResponse,
  TeamOwnershipTransferRequestResponse,
} from '@/actions/teams';

function apiUrl(path: string) {
  return `${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}${path}`;
}

export async function getNotifications(): Promise<NotificationItem[]> {
  const token = await getAuthToken();
  if (!token) {
    return [];
  }

  try {
    const res = await fetch(apiUrl('/notifications'), {
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-api-key': STATIC_API_KEY,
      },
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json().catch(() => null);
    return Array.isArray(data) ? (data as NotificationItem[]) : [];
  } catch {
    return [];
  }
}

export async function getUnreadNotificationsCount(): Promise<number> {
  const list = await getNotifications();
  if (!Array.isArray(list) || list.length === 0) return 0;
  return list.reduce((acc, n) => acc + (n?.isRead ? 0 : 1), 0);
}

export interface NotificationsBadgeData {
  pendingInvitesCount: number;
  unreadNotificationsCount: number;
}

export interface ProfileNotificationsBootstrapData {
  invitations: TeamInvitationResponse[];
  transferRequests: TeamOwnershipTransferRequestResponse[];
  notifications: NotificationItem[];
}

export async function getNotificationsBadgeData(): Promise<NotificationsBadgeData> {
  const token = await getAuthToken();
  if (!token) {
    return {
      pendingInvitesCount: 0,
      unreadNotificationsCount: 0,
    };
  }

  try {
    const badgeRes = await fetch(apiUrl('/notifications/badge'), {
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-api-key': STATIC_API_KEY,
      },
    });

    const badgeRaw = badgeRes.ok
      ? await badgeRes
          .json()
          .catch(() => ({ pendingInvitesCount: 0, unreadNotificationsCount: 0 }))
      : { pendingInvitesCount: 0, unreadNotificationsCount: 0 };

    const pendingInvitesCount =
      typeof badgeRaw?.pendingInvitesCount === 'number'
        ? badgeRaw.pendingInvitesCount
        : 0;
    const unreadNotificationsCount =
      typeof badgeRaw?.unreadNotificationsCount === 'number'
        ? badgeRaw.unreadNotificationsCount
        : 0;

    return {
      pendingInvitesCount,
      unreadNotificationsCount,
    };
  } catch {
    return {
      pendingInvitesCount: 0,
      unreadNotificationsCount: 0,
    };
  }
}

export async function getProfileNotificationsBootstrapData(): Promise<ProfileNotificationsBootstrapData> {
  const token = await getAuthToken();
  if (!token) {
    return {
      invitations: [],
      transferRequests: [],
      notifications: [],
    };
  }

  try {
    const [invitationsRes, transferRequestsRes, notificationsRes] = await Promise.all([
      fetch(apiUrl('/teams/invitations?status=PENDING'), {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-api-key': STATIC_API_KEY,
        },
      }),
      fetch(apiUrl('/teams/transfer-ownership/requests?status=PENDING'), {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-api-key': STATIC_API_KEY,
        },
      }),
      fetch(apiUrl('/notifications'), {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-api-key': STATIC_API_KEY,
        },
      }),
    ]);

    const invitationsRaw = invitationsRes.ok
      ? await invitationsRes.json().catch(() => [])
      : [];
    const transferRequestsRaw = transferRequestsRes.ok
      ? await transferRequestsRes.json().catch(() => [])
      : [];
    const notificationsRaw = notificationsRes.ok
      ? await notificationsRes.json().catch(() => [])
      : [];

    return {
      invitations: Array.isArray(invitationsRaw)
        ? (invitationsRaw as TeamInvitationResponse[])
        : [],
      transferRequests: Array.isArray(transferRequestsRaw)
        ? (transferRequestsRaw as TeamOwnershipTransferRequestResponse[])
        : [],
      notifications: Array.isArray(notificationsRaw)
        ? (notificationsRaw as NotificationItem[])
        : [],
    };
  } catch {
    return {
      invitations: [],
      transferRequests: [],
      notifications: [],
    };
  }
}

export async function markNotificationRead(id: number): Promise<boolean> {
  const token = await getAuthToken();
  if (!token) {
    return false;
  }

  const res = await fetch(apiUrl(`/notifications/${id}/read`), {
    method: 'PATCH',
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
      'x-api-key': STATIC_API_KEY,
    },
  });

  return res.ok;
}

export async function markAllNotificationsRead(): Promise<boolean> {
  const token = await getAuthToken();
  if (!token) {
    return false;
  }

  const res = await fetch(apiUrl('/notifications/read-all'), {
    method: 'PATCH',
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
      'x-api-key': STATIC_API_KEY,
    },
  });

  return res.ok;
}

export async function markNotificationsByTypeRead(
  type: string,
): Promise<boolean> {
  const token = await getAuthToken();
  if (!token) {
    return false;
  }

  const res = await fetch(apiUrl(`/notifications/read-by-type/${type}`), {
    method: 'PATCH',
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
      'x-api-key': STATIC_API_KEY,
    },
  });

  return res.ok;
}

