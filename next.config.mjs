/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['192.168.0.247'],
  // Tell Next.js NOT to bundle these native Node.js packages —
  // they must be loaded from node_modules at runtime.
  serverExternalPackages: ['pdf-parse', 'mammoth', 'cheerio'],
}

export default nextConfig
