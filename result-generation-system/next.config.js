/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cloud.appwrite.io'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cloud.appwrite.io',
      },
    ],
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig;