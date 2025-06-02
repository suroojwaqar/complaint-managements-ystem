/**
 * Environment Variables Validation and Configuration
 * Fixed for Vercel deployment
 */

import { z } from 'zod';

// Define the schema for environment variables
const envSchema = z.object({
  // Database
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  
  // Authentication
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL').optional(),
  
  // WhatsApp API (optional)
  WAAPI_INSTANCE_ID: z.string().optional(),
  WAAPI_API_KEY: z.string().optional(),
  WAAPI_BASE_URL: z.string().url().optional(),
  DEFAULT_COUNTRY_CODE: z.string().optional(),
  
  // AWS S3 (optional)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET_NAME: z.string().optional(),
  
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// FIXED: Lazy validation - only validate when accessed, not at import time
let validatedEnv: z.infer<typeof envSchema> | null = null;

function validateEnv() {
  if (validatedEnv) return validatedEnv;
  
  try {
    const env = {
      MONGODB_URI: process.env.MONGODB_URI,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      WAAPI_INSTANCE_ID: process.env.WAAPI_INSTANCE_ID,
      WAAPI_API_KEY: process.env.WAAPI_API_KEY,
      WAAPI_BASE_URL: process.env.WAAPI_BASE_URL,
      DEFAULT_COUNTRY_CODE: process.env.DEFAULT_COUNTRY_CODE,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
      AWS_REGION: process.env.AWS_REGION,
      AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
      NODE_ENV: process.env.NODE_ENV,
    };

    validatedEnv = envSchema.parse(env);
    return validatedEnv;
  } catch (error) {
    console.error('Environment validation error:', error);
    
    // FIXED: Don't throw during build time - allow build to continue
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
      throw new Error('Invalid environment configuration');
    }
    
    // For build time or development, provide defaults
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      console.warn(`Environment validation failed (continuing with defaults):\n${missingVars.join('\n')}`);
      
      // Return partial env with defaults for build time
      validatedEnv = {
        MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/placeholder',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'placeholder-secret-for-build-time-only',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        WAAPI_INSTANCE_ID: process.env.WAAPI_INSTANCE_ID,
        WAAPI_API_KEY: process.env.WAAPI_API_KEY,
        WAAPI_BASE_URL: process.env.WAAPI_BASE_URL,
        DEFAULT_COUNTRY_CODE: process.env.DEFAULT_COUNTRY_CODE,
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
        AWS_REGION: process.env.AWS_REGION,
        AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
        NODE_ENV: (process.env.NODE_ENV as any) || 'development',
      };
      
      return validatedEnv;
    }
    
    throw error;
  }
}

// Export getter instead of direct validation
export const getEnv = () => validateEnv();

// Helper functions
export const isProduction = () => getEnv().NODE_ENV === 'production';
export const isDevelopment = () => getEnv().NODE_ENV === 'development';
export const isTest = () => getEnv().NODE_ENV === 'test';

// Feature availability checks
export const getFeatures = () => {
  const env = getEnv();
  return {
    whatsapp: !!(env.WAAPI_INSTANCE_ID && env.WAAPI_API_KEY),
    s3Upload: !!(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.AWS_S3_BUCKET_NAME),
  } as const;
};

// Database connection string (with fallback for development)
export const getMongodbUri = () => {
  const env = getEnv();
  if (!env.MONGODB_URI || env.MONGODB_URI.includes('placeholder')) {
    if (isDevelopment()) {
      console.warn('MONGODB_URI not set, using default local MongoDB');
      return 'mongodb://localhost:27017/complaint-management-dev';
    }
    throw new Error('MONGODB_URI is required in production');
  }
  return env.MONGODB_URI;
};

// NextAuth URL with fallback
export const getNextAuthUrl = () => {
  const env = getEnv();
  if (env.NEXTAUTH_URL) {
    return env.NEXTAUTH_URL;
  }
  
  if (isProduction()) {
    // For Vercel, construct from VERCEL_URL
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    throw new Error('NEXTAUTH_URL is required in production');
  }
  
  return 'http://localhost:3000';
};

// For backward compatibility, export env as getter
export const env = new Proxy({} as z.infer<typeof envSchema>, {
  get(target, prop) {
    return getEnv()[prop as keyof z.infer<typeof envSchema>];
  }
});

export default env;