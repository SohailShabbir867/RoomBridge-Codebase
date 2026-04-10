const crypto       = require('crypto');
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit    = require('express-rate-limit');


/* ── Route imports ──────────────────────────────────────── */
const authRoutes       = require('./routes/auth.routes');
const userRoutes       = require('./routes/user.routes');
const listingRoutes    = require('./routes/listing.routes');
const bookingRoutes    = require('./routes/booking.routes');
const messageRoutes    = require('./routes/message.routes');
const preferenceRoutes = require('./routes/preference.routes');
const adminRoutes      = require('./routes/admin.routes');
const reportRoutes     = require('./routes/report.routes');

/* ── Middleware imports ─────────────────────────────────── */
const { errorHandler, notFound } = require('./middleware/error.middleware');

const app = express();

/* ═══════════════════════════════════════════════════════════
   SECURITY HEADERS  (no body parsing needed — apply first)
════════════════════════════════════════════════════════════ */

// Disable x-powered-by header (don't advertise Express)
app.disable('x-powered-by');

// Security HTTP headers
app.use(helmet({
  // Allow images from external sources (Cloudinary, Unsplash) in CSP
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      imgSrc:      ["'self'", 'data:', 'https://res.cloudinary.com', 'https://images.unsplash.com'],
      scriptSrc:   ["'self'"],
      styleSrc:    ["'self'", 'https:'],
      connectSrc:  ["'self'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS — allow frontend origins with credentials
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      process.env.CLIENT_URL,
    ].filter(Boolean),
    credentials:    true,
    methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Response-Time'],
  })
);


/* ═══════════════════════════════════════════════════════════
   BODY PARSERS & COOKIES
   CRITICAL: Must come BEFORE mongoSanitize/xss/hpp.
   Sanitization middleware can only clean what has been parsed.
════════════════════════════════════════════════════════════ */
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

/* ═══════════════════════════════════════════════════════════
   SANITIZATION  (AFTER body parsing)
   NOTE: express-mongo-sanitize, xss-clean, and hpp are NOT
   compatible with Express 5 (req.query is a read-only getter).
   We sanitize req.body manually here instead.
════════════════════════════════════════════════════════════ */
app.use((req, _res, next) => {
  // Strip MongoDB operators ($, .) from req.body to prevent NoSQL injection
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
    return obj;
  };
  if (req.body) sanitize(req.body);
  next();
});


/* ═══════════════════════════════════════════════════════════
   CUSTOM MIDDLEWARE
════════════════════════════════════════════════════════════ */

// Attach a unique request ID for tracing / debugging
app.use((req, _res, next) => {
  req.requestId = crypto.randomUUID();
  next();
});

// Response time header
// BUG FIX: Original set the header inside 'finish' event, but res.setHeader() after
// the response has been sent throws a "Cannot set headers after they are sent" error.
// Fix: use res.on('finish') only for LOGGING, not for setting headers.
// The header must be set BEFORE res.end() — use a middleware that wraps res.json/send.
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  // Override res.json to inject the header before the actual send
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    const ns = Number(process.hrtime.bigint() - start);
    res.setHeader('X-Response-Time', `${(ns / 1e6).toFixed(2)}ms`);
    return originalJson(body);
  };
  next();
});

/* ═══════════════════════════════════════════════════════════
   LOGGING (development only)
════════════════════════════════════════════════════════════ */
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

/* ═══════════════════════════════════════════════════════════
   HEALTH CHECK  (no prefix — always available)
════════════════════════════════════════════════════════════ */
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success:     true,
    status:      'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp:   new Date().toISOString(),
    uptime:      `${Math.floor(process.uptime())}s`,
  });
});

/* ═══════════════════════════════════════════════════════════
   RATE LIMITER  (global — applied to all /api routes)
   BUG FIX: rateLimit must be placed AFTER body parsers but BEFORE routes.
   Placing it before bodyParser means it runs on every request including
   preflight OPTIONS, causing spurious 429 errors.
════════════════════════════════════════════════════════════ */
const globalLimiter = rateLimit({
  windowMs:        15 * 60 * 1000, // 15 minutes
  max:             200,             // 200 requests per window per IP
  standardHeaders: 'draft-7',       // Use RateLimit-* headers (draft-7 standard)
  legacyHeaders:   false,           // Disable X-RateLimit-* legacy headers
  skip: (req) => req.method === 'OPTIONS', // Skip preflight
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

app.use('/api', globalLimiter);

/* ═══════════════════════════════════════════════════════════
   API ROUTES — all under /api/v1
════════════════════════════════════════════════════════════ */
app.use('/api/v1/auth',        authRoutes);
app.use('/api/v1/users',       userRoutes);
app.use('/api/v1/listings',    listingRoutes);
app.use('/api/v1/bookings',    bookingRoutes);
app.use('/api/v1/messages',    messageRoutes);
app.use('/api/v1/preferences', preferenceRoutes);
app.use('/api/v1/admin',       adminRoutes);
app.use('/api/v1/reports',     reportRoutes);

/* ═══════════════════════════════════════════════════════════
   ERROR HANDLING (must be last)
════════════════════════════════════════════════════════════ */
app.use(notFound);
app.use(errorHandler);

module.exports = app;
