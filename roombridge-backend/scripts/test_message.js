require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const mongoose = require("mongoose");
const Community = require("../src/models/Community.model");
const CommunityMessage = require("../src/models/CommunityMessage.model");
const User = require("../src/models/User.model");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
    });
    console.log("✅ Connected to MongoDB");

    // Get the first admin user
    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
      console.log("❌ No admin user found!");
      process.exit(1);
    }
    console.log(`👤 Found admin: ${admin.name} (${admin.email})`);

    // Get the first community
    const community = await Community.findOne({});
    if (!community) {
      console.log("❌ No community found!");
      process.exit(1);
    }
    console.log(`🏢 Found community: ${community.name} (${community.visibility})`);

    // Verify membership
    console.log(`Is member? ${community.isMember(admin._id)}`);
    console.log(`Can send? ${community.canSend(admin._id, admin.role)}`);

    // Attempt to create a community message
    console.log("⏳ Attempting to create community message...");
    const msg = await CommunityMessage.create({
      community: community._id,
      sender: admin._id,
      message: "Test message from diagnostic script",
      messageType: "text"
    });

    console.log("✅ Created message successfully:", msg);

    // Clean up test message
    await CommunityMessage.deleteOne({ _id: msg._id });
    console.log("✅ Test message cleaned up.");

    await mongoose.disconnect();
    console.log("✅ Done");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during test:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
