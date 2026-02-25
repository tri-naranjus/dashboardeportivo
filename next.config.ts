import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // pdf-parse uses Node.js modules, must never be bundled for client
  serverExternalPackages: ['pdf-parse'],

  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent pdf-parse from being bundled client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },

  env: {
    STRAVA_CLIENT_ID: process.env.STRAVA_CLIENT_ID,
    STRAVA_CLIENT_SECRET: process.env.STRAVA_CLIENT_SECRET,
  },
};

export default nextConfig;
