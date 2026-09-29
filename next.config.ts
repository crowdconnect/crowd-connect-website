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
    return {
      beforeFiles: [{ source: "/", destination: "/index.html" }],
      afterFiles: [
        { source: "/impressum", destination: "/legal/impressum.html" },
        { source: "/datenschutz", destination: "/legal/datenschutz.html" },
      ],
    };
  },
  async redirects() {
    return [
      {
        source: "/wedding-connect",
        destination: "https://wedding-connect.de",
        permanent: true,
      },
      {
        source: "/classic.html",
        destination: "/legacy/classic.html",
        permanent: true,
      },
      {
        source: "/classic.css",
        destination: "/legacy/classic.css",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
