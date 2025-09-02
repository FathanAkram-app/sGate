/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@sgate/shared'],
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig