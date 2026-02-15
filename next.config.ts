import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'sample-videos.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'my.matterport.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.ufileos.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.youtube.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.pexels.com',
        pathname: '/**',
      },
    ],
    dangerouslyAllowSVG: true,
  },
};

const withNextIntl = createNextIntlPlugin('./src/shared/config/i18n/request.ts');
export default withNextIntl(nextConfig);
