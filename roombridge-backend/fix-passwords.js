require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/User.model");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
    });
    console.log("Connected to DB");

    // List ALL users
    const users = await User.find({}).select("+password");
    console.log("Total users:", users.length);
    for (const u of users) {
      console.log(
        `  - ${u.email} | role: ${u.role} | verified: ${u.isVerified} | name: ${u.name}`,
      );
    }

    // Find admin by role instead
    let admin = await User.findOne({ role: "admin" }).select("+password");
    if (!admin) {
      // Try by email with different casing
      admin = await User.findOne({ email: /sohailshabbir0347/i }).select(
        "+password",
      );
    }

    if (!admin) {
      console.log("\nNo admin found. Creating admin...");
      admin = await User.create({
        name: "Sohail Shabbir",
        email: "sohailshabbir0347@gmail.com",
        password: "Sohail123#",
        role: "admin",
        phone: "+923473825598",
        city: "Bahawalpur",
        isVerified: true,
      });
      console.log("Admin created!");
    } else {
      console.log("\nUpdating admin:", admin.email);
      admin.name = "Sohail Shabbir";
      admin.password = "Sohail123#";
      admin.phone = "+923473825598";
      admin.city = "Bahawalpur";
      admin.isVerified = true;
      admin.role = "admin";
      await admin.save();
      console.log("Admin updated!");
    }

    // Verify password
    const updated = await User.findOne({ email: admin.email }).select(
      "+password",
    );
    const match = await bcrypt.compare("Sohail123#", updated.password);
    console.log("\nPassword verified:", match);
    console.log("Login with:");
    console.log("  Email:    " + updated.email);
    console.log("  Password: Sohail123#");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
})();
