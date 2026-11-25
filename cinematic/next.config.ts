import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Lets the dev server be driven from 127.0.0.1 (automated tests) as well as localhost.
  allowedDevOrigins: ['127.0.0.1'],
  // Three/R3F ship ESM; keep them in the client bundle only.
  transpilePackages: ['three'],
  async headers() {
    return [
      {
        // The GLB never changes between deploys unless the file name does -> cache hard.
        source: '/models/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default nextConfig;
