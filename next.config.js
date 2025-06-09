/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'images.unsplash.com',
      'picsum.photos',
      'placeholder.com',
      'via.placeholder.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  serverExternalPackages: ['@prisma/client'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 配置外部依赖
      config.externals = config.externals || []
      if (process.env.VERCEL === '1') {
        config.externals.push('@prisma/client')
      }
    }
    return config
  },
  env: {
    DISABLE_DATABASE: process.env.VERCEL === '1' ? 'true' : 'false',
  },
};

export default nextConfig;
