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
  // Добавляем настройки для работы с самоподписанными сертификатами
  experimental: {
    serverActions: {
      allowedOrigins: ["*"],
    },
  },
  // Отключаем строгий режим для устранения проблем с fetch
  reactStrictMode: false,
};

export default nextConfig;
