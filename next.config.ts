import type { NextConfig } from "next";

/**
 * Two deployments come out of this one config:
 *
 *  - Freebuff Sites (production): the default server build, packaged for Workers.
 *  - GitHub Pages: `GITHUB_PAGES=1 npm run build:pages` switches on the static
 *    export. GitHub project sites live under https://<user>.github.io/WWT/, so
 *    assets need the /WWT prefix (basePath) and every route must be exported as
 *    a directory with index.html (trailingSlash) — Pages does not resolve
 *    /model to model.html.
 */
const isGithubPages = process.env.GITHUB_PAGES === "1";
const basePath = "/WWT";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Freebuff's preview proxy serves this dev server from a per-chat hostname,
  // which Next 16 blocks for dev resources (HMR socket, overlay) unless named.
  allowedDevOrigins: ["pv-7cc08aa5f883-7d335929-7a5b-4fec-baf4-f029e2c1e450.style.dev"],
  ...(isGithubPages
    ? {
        output: "export" as const,
        basePath,
        assetPrefix: `${basePath}/`,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
