import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/chat',
        destination: 'http://localhost:5000/api/chat',
      },
      {
        source: '/api/sessions',
        destination: 'http://localhost:5000/api/sessions',
      },
    ];
  },
};

export default nextConfig;
