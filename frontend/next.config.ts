import type { NextConfig } from "next";

const apiOrigin = process.env.API_PROXY_ORIGIN ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  experimental: {
    agentUpgrade: "security",
  },
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
