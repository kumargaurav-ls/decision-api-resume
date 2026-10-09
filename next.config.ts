import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Keep the document parsers (pdf.js inside unpdf, mammoth) out of the server bundle.
  serverExternalPackages: ["unpdf", "mammoth"],
  experimental: {
    // Uploads can be up to 5 MB; leave headroom for multipart overhead.
    serverActions: { bodySizeLimit: "6mb" },
  },
  partialPrefetching: true,
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
