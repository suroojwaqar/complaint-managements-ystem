/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production-ready configuration
  poweredByHeader: false,
  compress: true,
  
  // Fix for dynamic route issues during build
  output: 'standalone',
  
  // Better error reporting during build
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Disable experimental CSS optimization that's causing critters error
  experimental: {
    // optimizeCss: true, // DISABLED - causing missing critters module error
    optimizePackageImports: ['lucide-react'],
  },
};

// Add webpack configuration for better debugging
if (process.env.NODE_ENV === 'development') {
  nextConfig.webpack = (config, { dev, isServer }) => {
    if (dev) {
      config.devtool = 'eval-source-map';
    }
    return config;
  };
}

module.exports = nextConfig;
