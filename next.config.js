/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production-ready configuration
  poweredByHeader: false,
  compress: true,
  
  // Remove output standalone for Vercel
  // output: 'standalone', // Remove this line - not needed for Vercel
  
  // FIX: Don't ignore TypeScript errors - fix them instead
  typescript: {
    ignoreBuildErrors: false, // Changed to false - fix your TS errors!
  },
  eslint: {
    ignoreDuringBuilds: true, // Temporarily ignore ESLint errors
  },
  
  // Suppress punycode deprecation warning
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        punycode: false,
      };
    }
    
    // Add proper externals for serverless
    if (isServer) {
      config.externals.push('mongodb', 'mongoose');
    }
    
    return config;
  },
  
  // Optimizations for Vercel
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    serverComponentsExternalPackages: ['mongoose', 'mongodb'],
  },
  
  // Image configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;