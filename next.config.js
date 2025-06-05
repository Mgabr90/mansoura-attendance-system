/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  images: {
    domains: ['localhost'],
  },
  env: {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    OFFICE_LATITUDE: process.env.OFFICE_LATITUDE,
    OFFICE_LONGITUDE: process.env.OFFICE_LONGITUDE,
    OFFICE_RADIUS: process.env.OFFICE_RADIUS,
  },
}

module.exports = nextConfig 