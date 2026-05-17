import { NEXT_PUBLIC_API_URL } from '@/utils/config';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 95],
    remotePatterns: [
      ...(NEXT_PUBLIC_API_URL
        ? [
            (() => {
              const apiUrl = new URL(NEXT_PUBLIC_API_URL);
              return {
                protocol: apiUrl.protocol.replace(':', '') as 'http' | 'https',
                hostname: apiUrl.hostname,
                ...(apiUrl.port ? { port: apiUrl.port } : {}),
                pathname: '/**',
              };
            })(),
          ]
        : []),
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'public.blob.vercel-storage.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'blob.vercel-storage.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.blob.vercel-storage.com',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    if (!NEXT_PUBLIC_API_URL) {
      return [];
    }
    const apiBase = NEXT_PUBLIC_API_URL.replace(/\/$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${apiBase}/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${apiBase}/uploads/:path*`,
      },
    ];
  },
};
export default nextConfig;
