import { NEXT_PUBLIC_API_URL } from '@/app/utils/config';
import type { NextConfig } from 'next';

const apiBaseUrl = NEXT_PUBLIC_API_URL.replace(/\/$/, '');

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    qualities: [50, 60, 75, 80],
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
    return [
      {
        source: '/api/:path*',
        destination: `${apiBaseUrl}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${apiBaseUrl}/uploads/:path*`,
      },
      {
        source: '/verify',
        destination: '/api/direct-verify',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,DELETE,PATCH,POST,PUT',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date',
          },
        ],
      },
    ];
  },
};
export default nextConfig;
