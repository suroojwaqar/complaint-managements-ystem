import mongoose from 'mongoose';
import { getMongodbUri, isDevelopment } from './env';

// FIXED: Simplified cache interface for Vercel
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// FIXED: Better global cache handling for serverless
declare global {
  var __mongoose: MongooseCache | undefined;
}

let cached = global.__mongoose;

if (!cached) {
  cached = global.__mongoose = { conn: null, promise: null };
}

async function dbConnect(): Promise<typeof mongoose> {
  // If we have a cached connection, return it
  if (cached!.conn) {
    return cached!.conn;
  }

  // If we don't have a cached connection but have a promise, wait for it
  if (!cached!.promise) {
    const MONGODB_URI = getMongodbUri();
    
    // FIXED: Optimized options for Vercel serverless
    const opts = {
      bufferCommands: false,
      // FIXED: Reduced pool size for serverless
      maxPoolSize: isDevelopment() ? 5 : 2,
      // FIXED: Reduced timeouts for faster cold starts
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 15000,
      connectTimeoutMS: 5000,
      // FIXED: Essential for serverless
      maxIdleTimeMS: 10000,
      // Use IPv4 only
      family: 4,
    };

    cached!.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached!.conn = await cached!.promise;
    
    // Only log connection success in development
    if (isDevelopment()) {
      console.log('Connected to MongoDB successfully');
    }
    
    return cached!.conn;
  } catch (e) {
    // FIXED: Clear failed promise to allow retry
    cached!.promise = null;
    
    // Enhanced error logging
    if (isDevelopment()) {
      console.error('MongoDB connection error:', e);
    }
    
    // FIXED: More specific error handling for different scenarios
    if (e instanceof Error) {
      if (e.message.includes('ENOTFOUND') || e.message.includes('getaddrinfo')) {
        throw new Error('Database server not reachable. Check your connection string.');
      }
      if (e.message.includes('authentication')) {
        throw new Error('Database authentication failed. Check your credentials.');
      }
      if (e.message.includes('timeout')) {
        throw new Error('Database connection timeout. The server may be overloaded.');
      }
    }
    
    throw new Error(`Database connection failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
}

// FIXED: Add connection health check for API routes
export async function ensureDbConnection(): Promise<boolean> {
  try {
    const connection = await dbConnect();
    
    // Check if connection is ready
    if (connection.connection.readyState !== 1) {
      console.warn('Database connection not ready, state:', connection.connection.readyState);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// FIXED: Graceful disconnect for development
export async function dbDisconnect(): Promise<void> {
  if (cached?.conn) {
    try {
      await cached.conn.disconnect();
      cached.conn = null;
      cached.promise = null;
      if (isDevelopment()) {
        console.log('Disconnected from MongoDB');
      }
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
    }
  }
}

export default dbConnect;