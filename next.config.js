/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 服务器外部包配置
  serverExternalPackages: ['@prisma/client', 'prisma'],
  
  // 编译优化
  compiler: {
    // 生产环境移除 console 语句
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // 图片优化配置
  images: {
    // 启用图片优化
    formats: ['image/webp', 'image/avif'],
    // 允许的图片域名
    domains: [
      'localhost',
      'example.com',
      'images.unsplash.com',
      'via.placeholder.com'
    ],
    // 预设尺寸
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // 启用压缩
  compress: true,

  // 输出配置
  output: 'standalone',
  
  // 静态优化
  trailingSlash: false,
  
  // 重定向配置
  async redirects() {
    return [
      // 可以添加重定向规则
    ]
  },
  
  // Headers配置，添加缓存控制
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // Webpack 配置优化
  webpack: (config, { dev, isServer }) => {
    // 生产环境优化
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            common: {
              minChunks: 2,
              chunks: 'all',
              name: 'common',
              enforce: true,
            },
          },
        },
      }
    }

    return config
  },

  // 页面扩展名
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
};

export default nextConfig;
