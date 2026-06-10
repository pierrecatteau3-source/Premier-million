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
    // Pas de cache client sur les routes dynamiques : après une modif (profil,
    // portefeuille…), les autres onglets affichent des données fraîches au lieu
    // d'une version en cache. router.refresh() ne rafraîchit que la route courante,
    // donc le dashboard restait figé après une sauvegarde du profil.
    staleTimes: { dynamic: 0 },
  },
};

export default nextConfig;
