import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["172.16.46.64", "172.16.46.64:3000"],
  async redirects() {
    return [
      {
        source: "/",
        destination: "/login",
        permanent: false,
      },
      {
        source: "/dashborad",
        destination: "/dashboard",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/dashborad",
        destination: "/dashboard",
      },
    ];
  },
};

export default nextConfig;