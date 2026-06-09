/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // Active instrumentation.ts (forçage IPv4 au boot — cf. ce fichier)
    instrumentationHook: true,
  },
};

export default nextConfig;
