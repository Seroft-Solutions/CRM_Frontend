import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // Required for Docker builds - generates standalone output
  output: 'standalone',

  // Experimental features for TailwindCSS v4 compatibility
  experimental: {
    optimizeCss: false, // Disable CSS optimization that might conflict with TailwindCSS v4
  },

  // Webpack configuration for TailwindCSS v4
  webpack: (config, { dev, isServer }) => {
    // Optimize for TailwindCSS v4 builds
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups.styles = {
        name: 'styles',
        test: /\.(css|scss|sass)$/,
        chunks: 'all',
        enforce: true,
      };
    }
    return config;
  },

  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
