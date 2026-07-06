/**
 * Seed script — creates the default admin user if not already present.
 * Run:  node seed-admin.js
 */
require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const User = require("../src/models/User.model");

const ADMIN = {
  name: "Admin",
  email: process.env.ADMIN_EMAIL || "contact.roombridge@gmail.com",
  password: process.env.ADMIN_PASSWORD || "Roombridge@123",
  role: "admin",
  city: "Islamabad",
  isVerified: true,
  isActive: true,
};

(async () => {
  try {
    // Call the robust database connector with Google DNS resolution fallback
    await connectDB();
    console.log("✅ Database connection established.");

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
      
      // Update password to match env variable if specified
      existing.password = ADMIN.password;
      updated = true;

      if (updated) {
        await existing.save(); // save() will trigger pre-save hook to hash the new password
        console.log("✅ Updated admin credentials to match environment.");
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
