require("dotenv").config();
const http = require("http");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const { initSocket } = require("./src/config/socket");

const PORT = process.env.PORT || 5000;

/* ── Uncaught synchronous exceptions ───────────────────── */
process.on("uncaughtException", (err) => {
  console.error(
    `[${new Date().toISOString()}] ❌ UNCAUGHT EXCEPTION:`,
    err.message,
  );
  console.error(err.stack);
  process.exit(1);
});

/* ── Create HTTP server ─────────────────────────────────── */
const httpServer = http.createServer(app);

/* ── Boot sequence ──────────────────────────────────────── */
const startServer = async () => {
  try {
    // 1. Connect to MongoDB FIRST before attaching socket
    await connectDB();

    // 2. Attach Socket.io AFTER DB is confirmed
    initSocket(httpServer);

    // 3. Start listening
    httpServer.listen(PORT, () => {
      console.log(`\n🚀 RoomBridge API`);
      console.log(`   Environment : ${process.env.NODE_ENV || "development"}`);
      console.log(`   Port        : ${PORT}`);
      console.log(
        `   Frontend    : ${process.env.CLIENT_URL || "http://localhost:5173"}`,
      );
      console.log(`   Started at  : ${new Date().toISOString()}\n`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();

/* ── Unhandled promise rejections ───────────────────────── */
process.on("unhandledRejection", (reason) => {
  console.error(
    `[${new Date().toISOString()}] ❌ UNHANDLED REJECTION:`,
    reason,
  );
  // Graceful shutdown
  httpServer.close(() => {
    console.log("Server closed due to unhandled rejection.");
    process.exit(1);
  });
});

/* ── Graceful shutdown on SIGTERM (Docker / Railway / Render) */
process.on("SIGTERM", () => {
  console.log(
    `[${new Date().toISOString()}] SIGTERM received. Shutting down gracefully…`,
  );
  httpServer.close(() => {
    console.log("✅ HTTP server closed.");
    process.exit(0);
  });
});

/* ── Graceful shutdown on SIGINT (Ctrl+C in dev) ────────── */
process.on("SIGINT", () => {
  console.log(
    `\n[${new Date().toISOString()}] SIGINT received. Shutting down…`,
  );
  httpServer.close(() => {
    console.log("✅ HTTP server closed.");
    process.exit(0);
  });
});
