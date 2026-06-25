/** @type {import('next').NextConfig} */
const nextConfig = {
  // ─── API Proxy ──────────────────────────────────────────────────────────────
  // In development (and when NEXT_PUBLIC_API_URL is NOT set), the frontend
  // calls /api/* on itself (e.g. http://localhost:3000/api/auth/login).
  // Next.js transparently forwards those requests to the Express backend so:
  //   • No self-signed TLS certificate issues (Node-to-Node plain HTTP)
  //   • No CORS preflight errors (same-origin from the browser's perspective)
  //
  // In production set BACKEND_URL to your hosted backend, e.g.:
  //   BACKEND_URL=https://your-app.onrender.com
  // The browser still talks to the Next.js origin; Next.js proxies to the backend.
  async rewrites() {
    const backendUrl = (process.env.BACKEND_URL || "http://localhost:4000").replace(/\/$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },

  // ─── Images ─────────────────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cloud.appwrite.io" },
    ],
  },

  reactStrictMode: true,
  turbopack: {},
};

module.exports = nextConfig;
