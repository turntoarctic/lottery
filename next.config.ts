import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ==================== 性能优化 ====================

  // 压缩优化
  compress: true,

  // 图片优化配置
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // ==================== 构建优化 ====================

  // 生产源映射 (调试用，生产环境可关闭)
  productionBrowserSourceMaps: false,

  // React 优化
  reactStrictMode: true,

  // Turbopack 配置 (Next.js 16+)
  turbopack: {
    // Turbopack 特定配置可以在这里添加
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // ==================== 缓存优化 ====================

  // 静态资源缓存
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|webp|avif|ico)',
        locale: false,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
