'use server';

import { getAuthToken } from '@/utils/auth';
import { NEXT_PUBLIC_API_URL, STATIC_API_KEY } from '@/utils/config';

export async function uploadAvatar(formData: FormData) {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Unauthorized');
  }

  const res = await fetch(`${NEXT_PUBLIC_API_URL}/users/upload-avatar`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'x-api-key': STATIC_API_KEY,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('❌ Upload failed:', res.status, errorText);
    throw new Error('Upload failed');
  }

  const data = await res.json();
  console.log('✅ Upload success:', data);
  return data;
}
