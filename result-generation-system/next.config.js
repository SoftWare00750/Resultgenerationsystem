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
};

module.exports = nextConfig;
