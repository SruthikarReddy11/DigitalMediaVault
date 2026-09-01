import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { authenticateToken } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { globalRateLimiter } from './middleware/rateLimiter';
import apiRoutes from './routes';

export const app = express();

// Disable X-Powered-By header to prevent fingerprinting
app.disable('x-powered-by');

// Defense-in-depth HTTP Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'http:', 'https:'],
        mediaSrc: ["'self'", 'data:', 'blob:', 'http:', 'https:'],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
        upgradeInsecureRequests: config.isProduction ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Required for media range streaming
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'sameorigin' },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
  })
);

// Additional security headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
  );
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  next();
});

// Strict CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, same-origin, curl)
      if (!origin) return callback(null, true);
      const allowedOrigins = Array.isArray(config.cors.origin)
        ? config.cors.origin
        : [config.cors.origin, 'http://localhost:5173', 'http://127.0.0.1:5173'];

      if (allowedOrigins.includes(origin) || !config.isProduction) {
        return callback(null, true);
      }
      return callback(new Error('Cross-Origin Request Blocked by CORS policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'Content-Disposition'],
    maxAge: 86400, // Cache preflight for 24 hours
  })
);

// CSRF Defense: Verify Origin header on state-changing requests
app.use((req: Request, res: Response, next: NextFunction) => {
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (mutatingMethods.includes(req.method)) {
    const origin = req.headers.origin;
    if (origin && config.isProduction) {
      const allowedOrigins = Array.isArray(config.cors.origin)
        ? config.cors.origin
        : [config.cors.origin];

      if (!allowedOrigins.includes(origin)) {
        res.status(403).json({
          success: false,
          error: {
            code: 'CSRF_BLOCKED',
            message: 'Cross-site request forgery protection blocked this request.',
          },
        });
        return;
      }
    }
  }
  next();
});

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global rate limiter against DoS / brute-force flooding
app.use(globalRateLimiter);

// Populate req.user from session token cookie or bearer token
app.use(authenticateToken);

// Mount REST API
app.use('/api', apiRoutes);

// Centralized error handler
app.use(errorHandler);
