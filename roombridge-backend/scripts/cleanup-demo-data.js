/* eslint-disable no-console */
require("dotenv").config();
const dns = require("dns");
const mongoose = require("mongoose");

const User = require("../src/models/User.model");
const Listing = require("../src/models/Listing.model");
const Preference = require("../src/models/Preference.model");
const Booking = require("../src/models/Booking.model");
const Message = require("../src/models/Message.model");
const Report = require("../src/models/Report.model");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const DEMO_EMAILS = [
  "owner.demo1@roombridge.site",
  "owner.demo2@roombridge.site",
  "owner.demo3@roombridge.site",
  "seeker.demo@roombridge.site",
  "seeker.demo2@roombridge.site",
  "seeker.demo3@roombridge.site",
  "seeker.demo4@roombridge.site",
  "seeker.demo5@roombridge.site",
  "seeker.demo6@roombridge.site",
];

const cleanup = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error(
      "MONGO_URI is not set. Add it to roombridge-backend/.env first.",
    );
  }

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 30000,
  });

  console.log("Connected to MongoDB.");

  const demoUsers = await User.find({ email: { $in: DEMO_EMAILS } }).select(
    "_id",
  );
  const demoUserIds = demoUsers.map((u) => u._id);

  const demoListings = await Listing.find({
    $or: [{ owner: { $in: demoUserIds } }, { title: { $regex: /^Demo\s/i } }],
  }).select("_id");
  const demoListingIds = demoListings.map((l) => l._id);

  const [preferencesRes, bookingsRes, messagesRes, reportsRes] =
    await Promise.all([
      Preference.deleteMany({ user: { $in: demoUserIds } }),
      Booking.deleteMany({
        $or: [
          { seeker: { $in: demoUserIds } },
          { owner: { $in: demoUserIds } },
          { listing: { $in: demoListingIds } },
        ],
      }),
      Message.deleteMany({
        $or: [
          { sender: { $in: demoUserIds } },
          { receiver: { $in: demoUserIds } },
        ],
      }),
      Report.deleteMany({
        $or: [
          { reporter: { $in: demoUserIds } },
          { reportedUser: { $in: demoUserIds } },
          { reportedListing: { $in: demoListingIds } },
        ],
      }),
    ]);

  await Promise.all([
    User.updateMany(
      { savedListings: { $in: demoListingIds } },
      { $pull: { savedListings: { $in: demoListingIds } } },
    ),
    Listing.updateMany(
      { savedBy: { $in: demoUserIds } },
      { $pull: { savedBy: { $in: demoUserIds } } },
    ),
  ]);

  const listingsRes = await Listing.deleteMany({
    _id: { $in: demoListingIds },
  });
  const usersRes = await User.deleteMany({ _id: { $in: demoUserIds } });

  console.log("Cleanup summary:");
  console.log(`- Demo users removed: ${usersRes.deletedCount}`);
  console.log(`- Demo listings removed: ${listingsRes.deletedCount}`);
  console.log(`- Demo preferences removed: ${preferencesRes.deletedCount}`);
  console.log(`- Demo bookings removed: ${bookingsRes.deletedCount}`);
  console.log(`- Demo messages removed: ${messagesRes.deletedCount}`);
  console.log(`- Demo reports removed: ${reportsRes.deletedCount}`);
};

(async () => {
  try {
    await cleanup();
    await mongoose.disconnect();
    console.log("Demo cleanup complete.");
    process.exit(0);
  } catch (error) {
    console.error("Demo cleanup failed:", error.message);
    try {
      await mongoose.disconnect();
    } catch {
      // Ignore disconnect errors.
    }
    process.exit(1);
  }
})();
