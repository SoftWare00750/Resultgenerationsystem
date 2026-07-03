/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cloud.appwrite.io',
      },
    ],
  },
  turbopack: {},
  reactStrictMode: true,

  // If NEXT_PUBLIC_API_URL is not set, src/lib/api.ts falls back to calling
  // `${window.location.origin}/api/...`. This rewrite makes that fallback
  // actually work for local development by forwarding those same-origin
  // requests to the plain-HTTP backend (see backend/src/server.js, which
  // always listens over HTTP — never a self-signed HTTPS cert).
  //
  // Set BACKEND_URL in .env.local to override (e.g. for a non-default port).
  // In production, prefer setting NEXT_PUBLIC_API_URL directly to the
  // deployed backend's HTTPS URL instead of relying on this rewrite.
  async rewrites() {
    const backendUrl = (process.env.BACKEND_URL || 'http://localhost:4000').replace(/\/$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;