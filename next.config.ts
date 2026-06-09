import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async rewrites() {
    return [
      { source: "/impressum", destination: "/impressum.html" },
      { source: "/datenschutz", destination: "/datenschutz.html" },
      {
        source: "/wedding-connect",
        destination: "/wedding-connect/index.html",
      },
    ];
  },
};

export default nextConfig;
