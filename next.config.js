/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
    optimizePackageImports: ['@headlessui/react', 'lucide-react', 'recharts'],
  },
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error'],
    } : false,
  },
  // Enable source maps in production for better debugging
  productionBrowserSourceMaps: true,
  
  // Security headers
  poweredByHeader: false,
  
  // React strict mode for better development experience
  reactStrictMode: true,
  
  // SWC minification is enabled by default in Next.js 13+
  
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // Environment variables exposed to the browser
  env: {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    OFFICE_LATITUDE: process.env.OFFICE_LATITUDE,
    OFFICE_LONGITUDE: process.env.OFFICE_LONGITUDE,
    OFFICE_RADIUS: process.env.OFFICE_RADIUS,
  },
  
  // Custom webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    // Add bundle analyzer in analyze mode
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: isServer
            ? '../analyze/server.html'
            : './analyze/client.html',
          defaultSizes: 'parsed',
          generateStatsFile: true,
          statsFilename: isServer
            ? '../analyze/server.json'
            : './analyze/client.json',
        })
      )
    }
    
    // Optimize bundle
    if (!dev) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Remove unused lodash modules
        'lodash': 'lodash-es',
      }
    }
    
    return config
  },
  
  // Headers for security and performance
  async headers() {
    return [
      {
        // Apply security headers to all routes
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
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        // Cache static assets
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig 