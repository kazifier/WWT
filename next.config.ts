import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Freebuff's preview proxy serves this dev server from a per-chat hostname,
  // which Next 16 blocks for dev resources (HMR socket, overlay) unless named.
  allowedDevOrigins: ["pv-7cc08aa5f883-7d335929-7a5b-4fec-baf4-f029e2c1e450.style.dev"],
};

export default nextConfig;
