declare global {
  namespace NodeJS {
    interface ProcessEnv {
      MONGODB_URI: string;
      NEXTAUTH_SECRET: string;
      NEXTAUTH_URL?: string;
      WAAPI_INSTANCE_ID?: string;
      WAAPI_API_KEY?: string;
      WAAPI_BASE_URL?: string;
      DEFAULT_COUNTRY_CODE?: string;
      AWS_ACCESS_KEY_ID?: string;
      AWS_SECRET_ACCESS_KEY?: string;
      AWS_REGION?: string;
      AWS_S3_BUCKET_NAME?: string;
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }

  var __mongoose: {
    conn: typeof import('mongoose') | null;
    promise: Promise<typeof import('mongoose')> | null;
  } | undefined;
}

export {};
