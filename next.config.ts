import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  experimental: {
    // Photos des événements : 5 Mo max, plus la marge du formulaire.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
