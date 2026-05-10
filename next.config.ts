import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Prevent the client-side router cache from serving stale data for
    // pages that use `export const dynamic = "force-dynamic"`.
    staleTimes: {
      dynamic: 0,
    },
  },
};

export default nextConfig;
