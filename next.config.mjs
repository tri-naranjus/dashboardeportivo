/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Linting runs in CI; don't block the production build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type checks run in CI; don't block the production build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
