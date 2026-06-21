"use strict";

const zlib = require("zlib");

/**
 * Custom Gzip/Deflate compression middleware using Node.js built-in zlib module.
 * No npm dependencies required.
 *
 * @param {object} opts
 * @param {number} opts.threshold - Minimum response size in bytes to compress (default 1024)
 */
function customCompression({ threshold = 1024 } = {}) {
  return (req, res, next) => {
    const acceptEncoding = req.headers["accept-encoding"] || "";
    
    // Check if client supports compression
    const useGzip = acceptEncoding.includes("gzip");
    const useDeflate = acceptEncoding.includes("deflate");

    if (!useGzip && !useDeflate) {
      return next();
    }

    const originalWrite = res.write;
    const originalEnd = res.end;
    const originalWriteHead = res.writeHead;
    const chunks = [];
    let isFinished = false;

    // Override writeHead to delay header sending until we know the final compressed length
    res.writeHead = function (statusCode, statusMessage, headers) {
      // Normalise arguments
      let actualHeaders = headers;
      if (typeof statusMessage === "object") {
        actualHeaders = statusMessage;
      }
      
      // If headers already sent, do nothing
      if (res.headersSent) return;

      // We'll write headers later in end()
      res.statusCode = statusCode;
      if (actualHeaders) {
        for (const [key, value] of Object.entries(actualHeaders)) {
          res.setHeader(key, value);
        }
      }
    };

    res.write = function (chunk, encoding, callback) {
      if (isFinished) return false;
      if (chunk) {
        if (Buffer.isBuffer(chunk)) {
          chunks.push(chunk);
        } else {
          chunks.push(Buffer.from(chunk, encoding));
        }
      }
      if (typeof callback === "function") callback();
      return true;
    };

    res.end = function (chunk, encoding, callback) {
      if (isFinished) return;
      isFinished = true;

      if (chunk) {
        if (Buffer.isBuffer(chunk)) {
          chunks.push(chunk);
        } else {
          chunks.push(Buffer.from(chunk, encoding));
        }
      }

      const buffer = Buffer.concat(chunks);

      // Bypass compression if payload is smaller than threshold
      if (buffer.length < threshold) {
        res.write = originalWrite;
        res.end = originalEnd;
        res.writeHead = originalWriteHead;
        
        if (!res.headersSent) {
          res.setHeader("Content-Length", buffer.length);
        }
        
        return originalEnd.call(res, buffer, callback);
      }

      // Check Content-Type to avoid compressing binaries like images, zip files, etc.
      const contentType = res.getHeader("content-type") || "";
      const isCompressible = 
        contentType.includes("json") ||
        contentType.includes("text") ||
        contentType.includes("javascript") ||
        contentType.includes("xml") ||
        contentType.includes("html");

      if (!isCompressible && contentType !== "") {
        res.write = originalWrite;
        res.end = originalEnd;
        res.writeHead = originalWriteHead;
        if (!res.headersSent) {
          res.setHeader("Content-Length", buffer.length);
        }
        return originalEnd.call(res, buffer, callback);
      }

      // Perform compression
      const compressMethod = useGzip ? zlib.gzip : zlib.deflate;
      const encodingHeader = useGzip ? "gzip" : "deflate";

      compressMethod(buffer, (err, compressed) => {
        res.write = originalWrite;
        res.end = originalEnd;
        res.writeHead = originalWriteHead;

        if (err) {
          // Fallback to uncompressed on error
          if (!res.headersSent) {
            res.setHeader("Content-Length", buffer.length);
          }
          return originalEnd.call(res, buffer, callback);
        }

        if (!res.headersSent) {
          res.setHeader("Content-Encoding", encodingHeader);
          res.setHeader("Content-Length", compressed.length);
          // Remove any ETag header as the representation has changed
          res.removeHeader("etag");
        }

        originalEnd.call(res, compressed, callback);
      });
    };

    next();
  };
}

module.exports = customCompression;
