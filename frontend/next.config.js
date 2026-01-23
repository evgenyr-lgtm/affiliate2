/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Firebase App Hosting automatically handles output mode
  // Don't set 'export' - let Firebase App Hosting use standalone mode
  images: {
    unoptimized: false, // Enable image optimization for App Hosting
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '',
  },
  trailingSlash: true,
}

module.exports = nextConfig
