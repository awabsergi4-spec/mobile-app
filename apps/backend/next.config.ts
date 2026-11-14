import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
