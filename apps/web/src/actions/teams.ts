'use server';

import type { CreateTeamPayload, TeamRole } from '@/interfaces';
import { getAuthToken } from '@/utils/auth';
import { NEXT_PUBLIC_API_URL, STATIC_API_KEY } from '@/utils/config';

function apiUrl(path: string) {
  return `${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}${path}`;
}

export type TeamInvitationStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED';

export type TeamInvitationResponse = {
  id: number;
  teamId: number;
  inviterId: number;
  inviteeId: number;
  status: TeamInvitationStatus;
  createdAt: string;
  respondedAt: string | null;
  expiresAt: string | null;
  team: { id: number; name: string; logoUrl: string | null };
  inviter: { id: number; nickName: string; fullName: string | null };
  invitee: { id: number; nickName: string; fullName: string | null };
};

export type TeamOwnershipTransferStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED';

export type TeamOwnershipTransferRequestResponse = {
  id: number;
  teamId: number;
  currentOwnerId: number;
  newOwnerId: number;
  status: TeamOwnershipTransferStatus;
  createdAt: string;
  respondedAt: string | null;
  expiresAt: string | null;
  team: { id: number; name: string; logoUrl: string | null };
  currentOwner: {
    id: number;
    nickName: string;
    fullName: string | null;
    email?: string;
  };
  newOwner: {
    id: number;
    nickName: string;
    fullName: string | null;
    email?: string;
  };
};

export async function getMyTeams() {
  const token = await getAuthToken();
  if (!token) {
    return [];
  }

  const res = await fetch(apiUrl('/teams?myTeam=true'), {
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
  return Array.isArray(data) ? data : [];
}

export async function getTeamDetails(teamId: number) {
  const token = await getAuthToken();
  if (!token) {
    return null;
  }

  try {
    const res = await fetch(apiUrl(`/teams/${teamId}`), {
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-api-key': STATIC_API_KEY,
      },
    });

    if (!res.ok) {
      return null;
    }

    return res.json();
  } catch (error) {
    return null;
  }
}

export async function getMyTeamRole(teamId: number): Promise<TeamRole> {
  const token = await getAuthToken();
  if (!token) {
    return null;
  }

  const res = await fetch(apiUrl(`/teams/${teamId}/my-role`), {
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
      'x-api-key': STATIC_API_KEY,
    },
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json().catch(() => null);
  const role = data?.role;
  return role === 'owner' ||
    role === 'assistant' ||
    role === 'staff' ||
    role === 'member'
    ? role
    : null;
}

export async function createTeam(payload: CreateTeamPayload) {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Необхідно увійти в систему');
  }

  const res = await fetch(apiUrl('/teams'), {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-api-key': STATIC_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ message: 'Помилка при створенні команди' }));
    throw new Error(err?.message || 'Помилка при створенні команди');
  }

  return res.json();
}

export async function uploadTeamLogo(teamId: number, formData: FormData) {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Необхідно увійти в систему');
  }

  const res = await fetch(apiUrl(`/teams/${teamId}/upload-logo`), {
    method: 'POST',
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
      'x-api-key': STATIC_API_KEY,
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ message: 'Помилка при завантаженні лого' }));
    throw new Error(err?.message || 'Помилка при завантаженні лого');
  }

  return res.json() as Promise<{ url: string }>;
}

export async function updateTeam(
  teamId: number,
  payload: {
    name?: string;
    description?: string;
    assistants?: number[];
    members?: number[];
    staff?: Array<{ userId: number; role: string }>;
  },
) {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Необхідно увійти в систему');
  }

  const res = await fetch(apiUrl(`/teams/${teamId}`), {
    method: 'PATCH',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-api-key': STATIC_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ message: 'Помилка при оновленні команди' }));
    throw new Error(err?.message || 'Помилка при оновленні команди');
  }

  return res.json();
}

export async function getTeamApplications(teamId: number) {
  const token = await getAuthToken();
  if (!token) {
    return [];
  }

  try {
    const res = await fetch(
      apiUrl(`/teams/${teamId}/join-requests?status=PENDING`),
      {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-api-key': STATIC_API_KEY,
        },
      },
    );

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
}

export async function updateJoinRequestStatus(
  teamId: number,
  joinRequestId: number,
  status: 'APPROVED' | 'REJECTED',
) {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Необхідно увійти в систему');
  }

  try {
    const res = await fetch(
      apiUrl(`/teams/${teamId}/join-requests/${joinRequestId}`),
      {
        method: 'PATCH',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-api-key': STATIC_API_KEY,
        },
        body: JSON.stringify({ status }),
      },
    );

    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ message: 'Помилка при оновленні статусу заявки' }));
      throw new Error(err?.message || 'Помилка при оновленні статусу заявки');
    }

    return res.json();
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error('Помилка при оновленні статусу заявки');
  }
}

export async function leaveTeam(teamId: number) {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Необхідно увійти в систему');
  }

  const res = await fetch(apiUrl(`/teams/${teamId}/leave`), {
    method: 'DELETE',
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
      'x-api-key': STATIC_API_KEY,
    },
  });

  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ message: 'Помилка при виході з команди' }));
    throw new Error(err?.message || 'Помилка при виході з команди');
  }

  return res.json().catch(() => ({}));
}

export async function deleteTeam(teamId: number): Promise<void> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Необхідно увійти в систему');
  }

  const res = await fetch(apiUrl(`/teams/${teamId}`), {
    method: 'DELETE',
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
      'x-api-key': STATIC_API_KEY,
    },
  });

  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ message: 'Помилка при видаленні команди' }));
    throw new Error(err?.message || 'Помилка при видаленні команди');
  }
}

export async function getTeamInvitations(params?: {
  status?: TeamInvitationStatus;
  teamId?: number;
}): Promise<TeamInvitationResponse[]> {
  const token = await getAuthToken();
  if (!token) {
    return [];
  }

  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (typeof params?.teamId === 'number')
    search.set('teamId', String(params.teamId));

  const res = await fetch(apiUrl(`/teams/invitations?${search.toString()}`), {
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
  return Array.isArray(data) ? (data as TeamInvitationResponse[]) : [];
}

export async function getPendingTeamInvitationsCount(): Promise<number> {
  const list = await getTeamInvitations({ status: 'PENDING' });
  return Array.isArray(list) ? list.length : 0;
}

export async function getOwnershipTransferRequests(params?: {
  status?: TeamOwnershipTransferStatus;
}): Promise<TeamOwnershipTransferRequestResponse[]> {
  const token = await getAuthToken();
  if (!token) {
    return [];
  }

  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);

  const res = await fetch(
    apiUrl(`/teams/transfer-ownership/requests?${search.toString()}`),
    {
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-api-key': STATIC_API_KEY,
      },
    },
  );

  if (!res.ok) {
    return [];
  }

  const data = await res.json().catch(() => null);
  return Array.isArray(data)
    ? (data as TeamOwnershipTransferRequestResponse[])
    : [];
}

export async function createTeamInvitation(params: {
  teamId: number;
  inviteeId: number;
  expiresInDays?: number;
}): Promise<TeamInvitationResponse> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Необхідно увійти в систему');
  }

  const res = await fetch(apiUrl(`/teams/${params.teamId}/invitations`), {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-api-key': STATIC_API_KEY,
    },
    body: JSON.stringify({
      inviteeId: params.inviteeId,
      ...(typeof params.expiresInDays === 'number'
        ? { expiresInDays: params.expiresInDays }
        : {}),
    }),
  });

  if (!res.ok) {
    const raw = await res.json().catch(() => ({ message: 'Помилка' }));
    const msg = String(raw?.message || '');
    if (msg.includes('INVITATION_ALREADY_EXISTS')) {
      throw new Error('Запрошення вже відправлено');
    }
    if (msg.includes('USER_ALREADY_TEAM_MEMBER')) {
      throw new Error('Користувач вже є учасником команди');
    }
    if (msg.includes('USER_ALREADY_IN_ANOTHER_TEAM')) {
      throw new Error('Користувач вже в іншій команді');
    }
    if (msg.includes('CANNOT_INVITE_YOURSELF')) {
      throw new Error('Неможливо запросити себе');
    }
    throw new Error(raw?.message || 'Помилка при відправці запрошення');
  }

  return res.json();
}

export async function acceptTeamInvitation(
  invitationId: number,
): Promise<TeamInvitationResponse> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Необхідно увійти в систему');
  }

  const res = await fetch(apiUrl(`/teams/invitations/${invitationId}/accept`), {
    method: 'PATCH',
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
      'x-api-key': STATIC_API_KEY,
    },
  });

  if (!res.ok) {
    const raw = await res.json().catch(() => ({ message: 'Помилка' }));
    const msg = String(raw?.message || '');
    if (msg.includes('INVITATION_EXPIRED')) {
      throw new Error('Запрошення прострочено');
    }
    if (msg.includes('USER_ALREADY_IN_ANOTHER_TEAM')) {
      throw new Error('Ви вже в іншій команді');
    }
    throw new Error(raw?.message || 'Помилка при прийнятті запрошення');
  }

  return res.json();
}

export async function rejectTeamInvitation(
  invitationId: number,
): Promise<TeamInvitationResponse> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Необхідно увійти в систему');
  }

  const res = await fetch(apiUrl(`/teams/invitations/${invitationId}/reject`), {
    method: 'PATCH',
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
      'x-api-key': STATIC_API_KEY,
    },
  });

  if (!res.ok) {
    const raw = await res.json().catch(() => ({ message: 'Помилка' }));
    throw new Error(raw?.message || 'Помилка при відхиленні запрошення');
  }

  return res.json();
}

export async function createOwnershipTransferRequest(
  teamId: number,
  newOwnerId: number,
): Promise<TeamOwnershipTransferRequestResponse> {
  const expiresInMinutes = 10; // default expiration time for ownership transfer requests

  const token = await getAuthToken();
  if (!token) {
    throw new Error('Необхідно увійти в систему');
  }

  const res = await fetch(apiUrl(`/teams/transfer-ownership/${teamId}`), {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-api-key': STATIC_API_KEY,
    },
    body: JSON.stringify({
      newOwnerId,
      ...(typeof expiresInMinutes === 'number' ? { expiresInMinutes } : {}),
    }),
  });

  if (!res.ok) {
    const raw = await res.json().catch(() => ({ message: 'Помилка' }));
    const msg = String(raw?.message || '');
    if (
      msg.includes('TRANSFER_REQUEST_ALREADY_EXISTS') ||
      msg.includes('TRANSFER_REQUEST_ALREADY_EXISTS_FOR_TEAM')
    ) {
      throw new Error(`Запит на передачу прав вже існує. По закінченню ${expiresInMinutes} хвилин від попереднього запиту ви зможете створити новий.`);
    }
    if (msg.includes('USER_NOT_TEAM_MEMBER')) {
      throw new Error('Користувач не є активним учасником команди');
    }
    if (msg.includes('CANNOT_TRANSFER_TO_YOURSELF')) {
      throw new Error('Неможливо передати права самому собі');
    }
    throw new Error(raw?.message || 'Помилка при створенні запиту');
  }

  return res.json();
}

export async function acceptOwnershipTransferRequest(params: {
  teamId: number;
}): Promise<TeamOwnershipTransferRequestResponse> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Необхідно увійти в систему');
  }

  const res = await fetch(
    apiUrl(`/teams/transfer-ownership/${params.teamId}/accept`),
    {
      method: 'PATCH',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-api-key': STATIC_API_KEY,
      },
    },
  );

  if (!res.ok) {
    const raw = await res.json().catch(() => ({ message: 'Помилка' }));
    const msg = String(raw?.message || '');
    if (msg.includes('TRANSFER_REQUEST_EXPIRED')) {
      throw new Error('Запит на передачу прав прострочено');
    }
    if (msg.includes('TRANSFER_REQUEST_NOT_FOUND')) {
      throw new Error('Запит на передачу прав не знайдено');
    }
    throw new Error(raw?.message || 'Помилка при прийнятті передачі прав');
  }

  return res.json();
}

export async function rejectOwnershipTransferRequest(params: {
  teamId: number;
}): Promise<TeamOwnershipTransferRequestResponse> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Необхідно увійти в систему');
  }

  const res = await fetch(
    apiUrl(`/teams/transfer-ownership/${params.teamId}/reject`),
    {
      method: 'PATCH',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-api-key': STATIC_API_KEY,
      },
    },
  );

  if (!res.ok) {
    const raw = await res.json().catch(() => ({ message: 'Помилка' }));
    const msg = String(raw?.message || '');
    if (msg.includes('TRANSFER_REQUEST_NOT_FOUND')) {
      throw new Error('Запит на передачу прав не знайдено');
    }
    throw new Error(raw?.message || 'Помилка при відхиленні передачі прав');
  }

  return res.json();
}
