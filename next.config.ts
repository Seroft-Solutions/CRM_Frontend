import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // Required for Docker builds - generates standalone output
  output: 'standalone',

  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
