import type { NextConfig } from "next";

// Static export: the whole app is client-side audio + canvas, no server needed.
// (Removed the template's cacheComponents/partialPrefetching: they are server
// caching features with no effect on a static export.)
const nextConfig: NextConfig = {
  output: "export",
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
