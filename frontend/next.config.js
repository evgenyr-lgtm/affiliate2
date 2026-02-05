const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Firebase App Hosting automatically handles output mode
  // Don't set 'export' - let Firebase App Hosting use standalone mode
  images: {
    unoptimized: false, // Enable image optimization for App Hosting
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'accessfinancial.com',
        pathname: '/wp-content/uploads/**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  },
  trailingSlash: true,
  experimental: {
    // Ensure standalone tracing includes hoisted deps in monorepo
    outputFileTracingRoot: path.join(__dirname, '..'),
  },
}

module.exports = nextConfig
