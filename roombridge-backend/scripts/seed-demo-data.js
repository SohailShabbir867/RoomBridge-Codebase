/* eslint-disable no-console */
require("dotenv").config();
const dns = require("dns");
const mongoose = require("mongoose");

const User = require("../src/models/User.model");
const Listing = require("../src/models/Listing.model");
const Preference = require("../src/models/Preference.model");
const Booking = require("../src/models/Booking.model");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Peshawar",
  "Quetta",
  "Faisalabad",
  "Multan",
  "Hyderabad",
  "Sialkot",
  "Gujranwala",
  "Bahawalpur",
  "Sargodha",
  "Abbottabad",
  "Murree",
];

const ROOM_TYPES = ["1_person", "2_person", "3_person", "4_person", "more_than_4_person"];
const GENDER_PREFS = ["any", "male", "female"];
const STATUSES = ["active", "pending", "inactive", "active", "rejected"];

const DEMO_OWNERS = [
  {
    name: "Demo Owner One",
    email: "owner.demo1@roombridge.site",
    password: "Owner@1234",
    role: "owner",
    city: "Islamabad",
    phone: "03001234567",
    isVerified: true,
    isActive: true,
  },
  {
    name: "Demo Owner Two",
    email: "owner.demo2@roombridge.site",
    password: "Owner@1234",
    role: "owner",
    city: "Lahore",
    phone: "03007654321",
    isVerified: true,
    isActive: true,
  },
  {
    name: "Demo Owner Three",
    email: "owner.demo3@roombridge.site",
    password: "Owner@1234",
    role: "owner",
    city: "Karachi",
    phone: "03111234567",
    isVerified: true,
    isActive: true,
  },
];

const DEMO_SEEKERS = [
  {
    name: "Demo Seeker Prime",
    email: "seeker.demo@roombridge.site",
    password: "Seeker@1234",
    role: "seeker",
    city: "Islamabad",
    phone: "03211234567",
    isVerified: true,
    isActive: true,
  },
  {
    name: "Ayesha Demo",
    email: "seeker.demo2@roombridge.site",
    password: "Seeker@1234",
    role: "seeker",
    city: "Lahore",
    phone: "03217654321",
    isVerified: true,
    isActive: true,
  },
  {
    name: "Bilal Demo",
    email: "seeker.demo3@roombridge.site",
    password: "Seeker@1234",
    role: "seeker",
    city: "Karachi",
    phone: "03331234567",
    isVerified: true,
    isActive: true,
  },
  {
    name: "Hina Demo",
    email: "seeker.demo4@roombridge.site",
    password: "Seeker@1234",
    role: "seeker",
    city: "Rawalpindi",
    phone: "03441234567",
    isVerified: true,
    isActive: true,
  },
  {
    name: "Umer Demo",
    email: "seeker.demo5@roombridge.site",
    password: "Seeker@1234",
    role: "seeker",
    city: "Peshawar",
    phone: "03551234567",
    isVerified: true,
    isActive: true,
  },
  {
    name: "Sana Demo",
    email: "seeker.demo6@roombridge.site",
    password: "Seeker@1234",
    role: "seeker",
    city: "Multan",
    phone: "03661234567",
    isVerified: true,
    isActive: true,
  },
];

const buildDescription = (city, roomType, furnished) => {
  const furnishingText = furnished ? "fully furnished" : "semi-furnished";
  return `Demo listing in ${city} with ${roomType} setup, ${furnishingText} condition, secure access, reliable utilities, and nearby transport options. Ideal for students and professionals seeking a practical and affordable shared living experience in ${city}.`;
};

const buildFeatures = (idx) => {
  const presets = [
    ["wifi", "security", "water", "electricity"],
    ["wifi", "ac", "parking", "generator"],
    ["wifi", "kitchen", "laundry", "cctv"],
    ["water", "electricity", "security", "parking"],
  ];
  const selected = presets[idx % presets.length];
  return selected.map((name) => ({ name, available: true }));
};

const buildNearbyPlaces = (city) => [
  { name: `${city} Metro Stop`, distance: "0.7 km", type: "transport" },
  { name: `${city} Main Market`, distance: "1.2 km", type: "market" },
  { name: `${city} Medical Center`, distance: "1.8 km", type: "hospital" },
];

const upsertUser = async (payload) => {
  const existing = await User.findOne({ email: payload.email });
  if (!existing) {
    return User.create(payload);
  }

  existing.name = payload.name;
  existing.role = payload.role;
  existing.city = payload.city;
  existing.phone = payload.phone;
  existing.isVerified = true;
  existing.isActive = true;
  existing.isBanned = false;

  if (payload.password) {
    existing.password = payload.password;
  }

  await existing.save();
  return existing;
};

const upsertListing = async (data) => {
  const existing = await Listing.findOne({
    title: data.title,
    owner: data.owner,
  });
  if (!existing) {
    return Listing.create(data);
  }

  Object.assign(existing, data);
  await existing.save();
  return existing;
};

const upsertPreference = async (userId, data) => {
  await Preference.findOneAndUpdate(
    { user: userId },
    { $set: { user: userId, ...data } },
    { upsert: true, returnDocument: "after", runValidators: true },
  );
};

const upsertBooking = async (payload) => {
  const existing = await Booking.findOne({
    listing: payload.listing,
    seeker: payload.seeker,
    owner: payload.owner,
    message: payload.message,
  });

  if (!existing) {
    await Booking.create(payload);
    return;
  }

  existing.status = payload.status;
  existing.ownerNote = payload.ownerNote;
  existing.moveInDate = payload.moveInDate;
  await existing.save();
};

const seed = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error(
      "MONGO_URI is not set. Add it to roombridge-backend/.env first.",
    );
  }

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 30000,
  });

  console.log("Connected to MongoDB.");

  const owners = [];
  for (const owner of DEMO_OWNERS) {
    owners.push(await upsertUser(owner));
  }

  const seekers = [];
  for (const seeker of DEMO_SEEKERS) {
    seekers.push(await upsertUser(seeker));
  }

  console.log(
    `Users ready: ${owners.length} owners, ${seekers.length} seekers.`,
  );

  const listings = [];

  for (let i = 0; i < CITIES.length; i += 1) {
    const city = CITIES[i];
    const owner = owners[i % owners.length];

    for (let j = 0; j < 2; j += 1) {
      const idx = i * 2 + j;
      const rtVal = ROOM_TYPES[idx % ROOM_TYPES.length];
      const roomType = [rtVal]; // Array — matches new [String] schema
      const status = STATUSES[idx % STATUSES.length];
      const furnished = idx % 2 === 0;
      const rent = 12000 + idx * 1500;
      const rentByType = { [rtVal]: rent };
      const availableFrom = new Date(Date.now() + (idx % 10) * 86400000);

      const listingPayload = {
        title: `Demo ${city} ${rtVal.replace("_", " ")} Listing ${j + 1}`,
        description: buildDescription(city, rtVal, furnished),
        rent,
        rentByType,
        city,
        address: `House ${20 + idx}, Block ${String.fromCharCode(65 + (idx % 5))}, ${city}`,
        area: `Sector ${String.fromCharCode(65 + (idx % 6))}`,
        photos: [
          {
            url: `https://picsum.photos/seed/roombridge-${city.toLowerCase()}-${j + 1}/900/600`,
            public_id: `demo/${city.toLowerCase()}/${j + 1}`,
          },
        ],
        furnished,
        roomType,
        genderPreference: GENDER_PREFS[idx % GENDER_PREFS.length],
        availableFrom,
        owner: owner._id,
        status,
        rejectionReason:
          status === "rejected"
            ? "Demo quality check: incomplete details."
            : undefined,
        features: buildFeatures(idx),
        nearbyPlaces: buildNearbyPlaces(city),
        roommatePreferences: {
          sleepSchedule: ["early", "late", "flexible", "any"][idx % 4],
          smoker: idx % 3 === 0,
          pets: idx % 4 === 0,
          occupation: ["student", "professional", "any"][idx % 3],
          gender: ["male", "female", "any"][idx % 3],
        },
        views: 10 + idx,
      };

      const listing = await upsertListing(listingPayload);
      listings.push(listing);
    }
  }

  console.log(
    `Listings ready: ${listings.length} across ${CITIES.length} cities.`,
  );

  for (let i = 0; i < seekers.length; i += 1) {
    const s = seekers[i];
    await upsertPreference(s._id, {
      sleepSchedule: ["early", "late", "flexible"][i % 3],
      smoker: i % 3 === 0,
      pets: i % 2 === 0,
      cleanliness: 3 + (i % 3),
      occupation: i % 2 === 0 ? "student" : "professional",
      gender: i % 2 === 0 ? "male" : "female",
      genderPreference: i % 3 === 0 ? "any" : i % 2 === 0 ? "female" : "male",
      ageRange: { min: 20 + i, max: 29 + i },
      bio: `Demo seeker profile ${i + 1} for roommate matching.`,
      budget: 15000 + i * 3000,
      preferredCity: CITIES[i % CITIES.length],
    });
  }

  console.log("Preferences ready for roommate matching.");

  const demoSeeker = seekers[0];
  const demoOwner = owners[0];
  const demoOwnerListings = listings.filter(
    (l) => l.owner.toString() === demoOwner._id.toString(),
  );
  const targetListings = demoOwnerListings.slice(0, 4);

  for (let i = 0; i < targetListings.length; i += 1) {
    const listing = targetListings[i];
    const seeker = seekers[i % seekers.length];
    await upsertBooking({
      listing: listing._id,
      seeker: seeker._id,
      owner: demoOwner._id,
      status: ["pending", "accepted", "rejected", "cancelled"][i % 4],
      message: `Demo booking request ${i + 1}: I am interested in this room and want to schedule a visit soon.`,
      ownerNote: [
        "Please share your CNIC copy before visit.",
        "Approved for next week move-in.",
        "Rejected due to date conflict.",
        "Cancelled by seeker for personal reason.",
      ][i % 4],
      moveInDate: new Date(Date.now() + (7 + i) * 86400000),
    });
  }

  const freshDemoSeeker = await User.findById(demoSeeker._id);
  freshDemoSeeker.savedListings = listings
    .filter((l) => l.status === "active")
    .slice(0, 6)
    .map((l) => l._id);
  await freshDemoSeeker.save({ validateBeforeSave: false });

  console.log("Bookings and saved listings ready for dashboard views.");

  console.log("\nDemo login credentials:");
  console.log("Owner:  owner.demo1@roombridge.site / Owner@1234");
  console.log("Seeker: seeker.demo@roombridge.site / Seeker@1234");
};

(async () => {
  try {
    await seed();
    await mongoose.disconnect();
    console.log("Demo data seeding complete.");
    process.exit(0);
  } catch (error) {
    console.error("Demo seed failed:", error.message);
    try {
      await mongoose.disconnect();
    } catch {
      // Ignore disconnect errors.
    }
    process.exit(1);
  }
})();
