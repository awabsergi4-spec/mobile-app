import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep `next build` within small hosting instances (Render free = 512 MB):
  // lint runs separately (`npm run lint`, CI), and webpack trades a little
  // build time for lower peak memory. Type-checking still runs during build.
  eslint: { ignoreDuringBuilds: true },
  // Category images are uploaded through a server action (up to 5 MB).
  experimental: { webpackMemoryOptimizations: true, serverActions: { bodySizeLimit: "6mb" } },
  // This deployment is the Admin Platform: send the bare site and /admin to
  // the dashboard (the protected layout redirects to /admin/login if signed out).
  async redirects() {
    return [
      { source: "/", destination: "/admin/dashboard", permanent: false },
      { source: "/admin", destination: "/admin/dashboard", permanent: false },
    ];
  },
};

export default nextConfig;
