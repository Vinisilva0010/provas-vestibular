import path from "node:path";
import type { NextConfig } from "next";

const projectRoot = path.join(__dirname);

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  outputFileTracingRoot: projectRoot,
  // Files read with fs at runtime when the cached dataset is refreshed.
  outputFileTracingIncludes: {
    "/**": ["./config/data-public-key.txt", "./test-vectors/dataset.json"],
  },
  turbopack: {
    root: projectRoot,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
