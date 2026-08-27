import type { NextConfig } from "next";

// FORZAR REBUILD - cambiar este número fuerza a Vercel a recompilar
const FORCE_REBUILD = "v2-" + Date.now();

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  env: {
    FORCE_REBUILD: FORCE_REBUILD,
  },
};

export default nextConfig;
