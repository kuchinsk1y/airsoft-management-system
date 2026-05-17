import { NEXT_PUBLIC_API_URL } from '@/utils/config';
import Footer, { type FooterOrgData } from './Footer';

async function fetchOrgData(): Promise<FooterOrgData> {
  try {
    const res = await fetch(
      `${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/organization`,
      { cache: 'no-store' },
    );
    if (!res.ok) return { socialLinks: [] };
    const data = await res.json();
    return {
      phone: typeof data.phone === 'string' ? data.phone.trim() || null : null,
      socialLinks: Array.isArray(data.socialLinks) ? data.socialLinks : [],
    };
  } catch {
    return { socialLinks: [] };
  }
}

export default async function FooterWrapper() {
  const orgData = await fetchOrgData();
  return <Footer orgData={orgData} />;
}
