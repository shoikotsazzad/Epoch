import type { NextConfig } from "next";

// Static export: the whole app is client-side audio + canvas, no server needed.
// (Removed the template's cacheComponents/partialPrefetching: they are server
// caching features with no effect on a static export.)
// Optional: BASE_PATH=/repo-name for a GitHub Pages project site.
const basePath = process.env.BASE_PATH || undefined;

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
