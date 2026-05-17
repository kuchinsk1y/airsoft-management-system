'use server';
import { NEXT_PUBLIC_API_URL } from '@/utils/config';

export async function findTeam(formData: FormData) {
  try {
    const param = formData.get('team')?.toString().toLocaleLowerCase().trim() || '';
    const apiBase = NEXT_PUBLIC_API_URL.replace(/\/$/, '');
    const res = await fetch(`${apiBase}/teams?team=${param}`);
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data?.message || 'Команду не знайдено!');
    }

    return data;
  } catch (err) {
    throw err;
  }
}
