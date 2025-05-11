/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Обновлено для Next.js 15: serverExternalPackages вместо experimental.serverComponentsExternalPackages
  serverExternalPackages: ['sharp'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
