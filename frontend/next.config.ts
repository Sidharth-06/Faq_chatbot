import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/chat',
        destination: `${BACKEND_URL}/api/chat`,
      },
      {
        source: '/api/sessions',
        destination: `${BACKEND_URL}/api/sessions`,
      },
    ];
  },
};

export default nextConfig;

