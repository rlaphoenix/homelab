/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/cartridge/:id', destination: '/' },
      { source: '/search', destination: '/' },
    ]
  },
}

export default nextConfig
