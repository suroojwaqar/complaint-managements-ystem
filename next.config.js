/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production-ready configuration
  poweredByHeader: false,
  compress: true,
  
  // Remove this dangerous setting that ignores TypeScript errors
  // typescript: {
  //   ignoreBuildErrors: true, // REMOVED FOR PRODUCTION
  // },
  
  // Optional: Add performance optimizations
  experimental: {
    optimizeCss: true,
  },
};

module.exports = nextConfig;
