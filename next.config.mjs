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

  // Allow external websites (e.g. WordPress) to load the widget script
  // and embed the chatbot iframe without CORS / X-Frame-Options blocking.
  async headers() {
    return [
      {
        // The widget-loader.js script served from /public
        source: '/widget-loader.js',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
        ],
      },
      {
        // The chatbot iframe page
        source: '/widget/:chatbotId*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          // Modern replacement for X-Frame-Options — allows any site to embed
          { key: 'Content-Security-Policy', value: "frame-ancestors *" },
        ],
      },
    ]
  },
}

export default nextConfig
