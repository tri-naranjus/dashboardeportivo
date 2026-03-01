/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Linting runs in CI; don't block the production build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
