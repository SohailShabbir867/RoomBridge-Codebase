/**
 * Seed script — creates the default admin user if not already present.
 * Run:  node seed-admin.js
 */
require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const mongoose = require("mongoose");
const User = require("./src/models/User.model");

const ADMIN = {
  name: "Admin",
  email: "sohailshabbir0347@gmail.com",
  password: "Admin@1234",
  role: "admin",
  city: "Islamabad",
  isVerified: true,
  isActive: true,
};

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
    });
    console.log("✅ Connected to MongoDB");

    const existing = await User.findOne({ email: ADMIN.email });
    if (existing) {
      console.log(
        "⚠️  Admin user already exists:",
        existing.email,
        "(role:",
        existing.role + ")",
      );
      let updated = false;
      if (existing.role !== "admin") {
        existing.role = "admin";
        updated = true;
      }
      if (!existing.isVerified) {
        existing.isVerified = true;
        updated = true;
      }
      if (updated) {
        await existing.save({ validateBeforeSave: false });
        console.log("✅ Updated admin: role=admin, isVerified=true");
      }
    } else {
      await User.create(ADMIN);
      console.log("✅ Admin user created:", ADMIN.email);
    }

    await mongoose.disconnect();
    console.log("✅ Done");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
})();
