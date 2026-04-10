const cloudinary  = require('cloudinary').v2;
const streamifier = require('streamifier');

/* ── Configure from env ──────────────────────────────────── */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file buffer to Cloudinary using streamifier.
 *
 * BUG FIX (original): Used `readable.push(buffer); readable.push(null)` BEFORE
 * `readable.pipe(stream)`. Because Node streams are synchronous when pushing data
 * to a Readable, the 'end' event fires before the pipe is established — resulting
 * in Cloudinary receiving an empty or incomplete stream.
 *
 * FIX: Use `streamifier.createReadStream(buffer)` which correctly pipes the buffer
 * as a proper readable stream. streamifier is already in package.json.
 *
 * @param {Buffer} buffer  - File buffer from multer memoryStorage
 * @param {string} folder  - Cloudinary folder (e.g. 'roombridge/listings')
 * @returns {Promise<{ url: string, public_id: string }>}
 */
const uploadToCloudinary = (buffer, folder = 'roombridge') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { quality: 'auto', fetch_format: 'auto' },
          { width: 1200, crop: 'limit' },        // cap width, preserve aspect ratio
        ],
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error.message);
          return reject(new Error(`Image upload failed: ${error.message}`));
        }
        resolve({ url: result.secure_url, public_id: result.public_id });
      }
    );

    // streamifier correctly handles buffer → readable stream
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Delete an image from Cloudinary by public_id.
 * Silently ignores errors (missing image is not a fatal server error).
 *
 * @param {string} publicId - Cloudinary public_id
 */
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result !== 'ok' && result.result !== 'not found') {
      console.warn(`Cloudinary delete returned unexpected result for ${publicId}:`, result.result);
    }
  } catch (err) {
    // Non-fatal: log but don't crash the request
    console.error(`Cloudinary delete failed for ${publicId}:`, err.message);
  }
};

module.exports = { cloudinary, uploadToCloudinary, deleteFromCloudinary };
