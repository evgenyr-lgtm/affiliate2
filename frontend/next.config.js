const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Firebase App Hosting requires standalone output
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
