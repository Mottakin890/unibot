/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Tell Next.js NOT to bundle these native Node.js packages —
  // they must be loaded from node_modules at runtime.
  serverExternalPackages: ['pdf-parse', 'mammoth', 'cheerio'],
}

export default nextConfig
