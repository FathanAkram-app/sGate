/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@sgate/shared'],
  images: {
    domains: ['localhost'],
  },
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: '../',
  },
}

module.exports = nextConfig