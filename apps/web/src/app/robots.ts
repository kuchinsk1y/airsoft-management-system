import { NEXT_PUBLIC_WEB_URL } from '@/utils/config';
import type { MetadataRoute } from 'next';

const WEB_BASE_URL = NEXT_PUBLIC_WEB_URL.replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/auth',
          '/checkout',
          '/forgot-password',
          '/login',
          '/my-team',
          '/payment',
          '/profile',
          '/register',
          '/reset-password',
          '/go',
          '/teams',
          '/verify',
          '/*utm',
          '/*clid=',
          '/*openstat',
          '/*from',
        ],
      },
    ],
    sitemap: `${WEB_BASE_URL}/sitemap.xml`,
    host: WEB_BASE_URL,
  };
}
