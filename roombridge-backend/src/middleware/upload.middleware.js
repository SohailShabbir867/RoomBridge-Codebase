const multer = require("multer");

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const MAX_FILE_SIZE_MB = 5;

/* ── Memory storage (buffer → Cloudinary stream) ─────── */
const storage = multer.memoryStorage();

/* ── File type filter ────────────────────────────────── */
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error(
      "Unsupported file type. Only JPEG, PNG, and WebP images are allowed.",
    );
    err.code = "INVALID_FILE_TYPE";
    cb(err, false);
  }
};

/* ── Base multer instance ────────────────────────────── */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024, // 5 MB in bytes
  },
});

/* ── Centralised Multer error handler ────────────────── */
// was missing `req` as first parameter — Express error handlers receive
// (err, req, res, next). The old version had (err, res, next) which is wrong;
// `res` was actually `req`, causing res.status() to fail silently.
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        return res.status(400).json({
          success: false,
          message: `File too large. Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`,
        });
      case "LIMIT_FILE_COUNT":
        return res.status(400).json({
          success: false,
          message: "Too many files uploaded.",
        });
      case "LIMIT_UNEXPECTED_FILE":
        return res.status(400).json({
          success: false,
          message: `Unexpected field name. Use the correct field name for upload.`,
        });
      default:
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
    }
  }

  // Custom file-type error
  if (err.code === "INVALID_FILE_TYPE") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Unknown error — pass to global error handler
  next(err);
};

/* ── Pre-built middleware exports ────────────────────── */

/**
 * Upload a single image file.
 * @param {string} fieldName - Form field name (default: 'image')
 */
const uploadSingle =
  (fieldName = "image") =>
  (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) return handleMulterError(err, req, res, next);
      next();
    });
  };

/**
 * Upload multiple image files (up to maxCount).
 * @param {string} fieldName - Form field name (default: 'photos')
 * @param {number} maxCount  - Maximum files allowed (default: 6)
 */
const uploadMultiple =
  (fieldName = "photos", maxCount = 6) =>
  (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) => {
      if (err) return handleMulterError(err, req, res, next);
      next();
    });
  };

module.exports = { uploadSingle, uploadMultiple };
