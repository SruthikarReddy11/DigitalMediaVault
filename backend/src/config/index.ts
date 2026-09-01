import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT || '5000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres@127.0.0.1:5433/personal_library?schema=public',
  session: {
    secret: process.env.SESSION_SECRET || 'dev-secret-replace-in-production-min32chars',
    cookieName: process.env.SESSION_COOKIE_NAME || 'pdl_session',
    maxAgeDays: parseInt(process.env.SESSION_MAX_AGE_DAYS || '7', 10),
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
  storage: {
    type: (process.env.STORAGE_TYPE || 'postgres') as 'postgres' | 'local' | 's3',
    localRoot: path.resolve(__dirname, process.env.STORAGE_LOCAL_ROOT || '../../../storage/uploads'),
    maxFileSizeBytes: parseInt(process.env.MAX_FILE_SIZE_MB || '500', 10) * 1024 * 1024,
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10),
  },
};
