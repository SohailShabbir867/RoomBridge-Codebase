const crypto = require("crypto");
const compression = require("./utils/compression");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

/* ── Route imports ─────────────────────────────────────── */
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const listingRoutes = require("./routes/listing.routes");
const bookingRoutes = require("./routes/booking.routes");
const messageRoutes = require("./routes/message.routes");
const preferenceRoutes = require("./routes/preference.routes");
const adminRoutes = require("./routes/admin.routes");
const reportRoutes = require("./routes/report.routes");
const communityRoutes = require("./routes/community.routes");

/* ── Middleware imports ────────────────────────────────── */
const { errorHandler, notFound } = require("./middleware/error.middleware");

const app = express();

/* Trust first reverse proxy (Nginx) so req.ip and rate limiting work correctly */
app.set("trust proxy", 1);

/* ── Security headers ──────────────────────────────────── */
app.disable("x-powered-by");

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: [
          "'self'",
          "data:",
          "https://res.cloudinary.com",
          "https://images.unsplash.com",
        ],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "https:"],
        connectSrc: ["'self'"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

/* ── Gzip compression ──────────────────────────────────────
   Compresses all JSON/text responses before sending them to
   the client. Reduces payload size ~70% for API responses.
   Threshold: only compress responses > 1kb (no-op for tiny errors). */
app.use(compression({ threshold: 1024 }));

/* ── Cache-Control for public read-only endpoints ──────────
   Tells browsers and CDNs to cache responses for 60 seconds.
   Applied only to safe GET/HEAD methods — never to mutations. */
app.use((req, res, next) => {
  if (
    (req.method === "GET" || req.method === "HEAD") &&
    req.path.startsWith("/api/v1/listings") &&
    !req.path.includes("/owner/") &&
    !req.path.includes("/seeker/")
  ) {
    // public listing endpoints: short public cache + stale-while-revalidate
    res.setHeader(
      "Cache-Control",
      "public, max-age=60, stale-while-revalidate=30",
    );
  } else if (req.method === "GET" || req.method === "HEAD") {
    // all other GETs: private (authenticated), no CDN caching
    res.setHeader("Cache-Control", "private, no-cache");
  }
  next();
});

/* ── CORS ──────────────────────────────────────────────── */
/* Supports multiple allowed origins via ALLOWED_ORIGINS env var (comma-separated).
   Falls back to CLIENT_URL for single-origin setups and localhost for local dev. */
const buildAllowedOrigins = () => {
  const base = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
  ];
  if (process.env.ALLOWED_ORIGINS) {
    const extra = process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean);
    return [...base, ...extra];
  }
  if (process.env.CLIENT_URL) {
    return [...base, process.env.CLIENT_URL];
  }
  return base;
};

app.use(
  cors({
    origin: buildAllowedOrigins(),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["X-Response-Time"],
  }),
);

/* ── Body parsers & cookies ────────────────────────────── */
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

/* ── NoSQL injection sanitizer ─────────────────────────── */
app.use((req, _res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== "object") return obj;
    for (const key of Object.keys(obj)) {
      if (key.startsWith("$") || key.includes(".")) delete obj[key];
      else if (typeof obj[key] === "object") sanitize(obj[key]);
    }
    return obj;
  };
  if (req.body) sanitize(req.body);
  next();
});

/* ── Request ID for tracing ────────────────────────────── */
app.use((req, _res, next) => {
  req.requestId = crypto.randomUUID();
  next();
});

/* ── Response time header ──────────────────────────────── */
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    const ns = Number(process.hrtime.bigint() - start);
    res.setHeader("X-Response-Time", `${(ns / 1e6).toFixed(2)}ms`);
    return originalJson(body);
  };
  next();
});

/* ── Logging (dev only) ────────────────────────────────── */
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

/* ── Health check ──────────────────────────────────────── */
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
  });
});

/* ── Global rate limiter ───────────────────────────────── */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});
app.use("/api", globalLimiter);

/* ── API routes ────────────────────────────────────────── */
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/listings", listingRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/preferences", preferenceRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/communities", communityRoutes);

/* ── Error handling (must be last) ─────────────────────── */
app.use(notFound);
app.use(errorHandler);

module.exports = app;
