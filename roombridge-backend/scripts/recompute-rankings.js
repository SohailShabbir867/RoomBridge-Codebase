/**
 * Recompute Listing Ranking Scores
 * ──────────────────────────────────
 * Batch job that recalculates `rankingScore` + `scoreBreakdown` for every
 * active listing, grouped by city so popularity is normalized fairly.
 *
 * Performance note: an earlier version of this script queried Booking and
 * Report per listing inside a loop (2 queries + 1 save() per listing —
 * 3,000+ round trips for 1,000 listings). This version pre-aggregates
 * booking outcomes and report counts for ALL listings in 2 queries total,
 * then writes every listing's new score in a single bulkWrite per city.
 *
 * Run manually:   npm run recompute:rankings
 * Run on schedule: wire this into an Azure WebJob / Timer Trigger, or a
 *                  node-cron job inside server.js, running hourly.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../src/config/db"); // reuses the SRV-DNS fallback other scripts rely on
const Listing = require("../src/models/Listing.model");
const Booking = require("../src/models/Booking.model");
const Report = require("../src/models/Report.model");
const {
  freshnessScore,
  popularityScore,
  availabilityScore,
  qualityScore,
  combineScore,
  bayesianTrust,
  penaltyFromCount,
} = require("../src/utils/ranking");

/** One query for booking accept/reject counts, grouped by listing. */
async function buildTrustMap() {
  const rows = await Booking.aggregate([
    { $match: { status: { $in: ["accepted", "rejected"] } } },
    { $group: { _id: { listing: "$listing", status: "$status" }, count: { $sum: 1 } } },
  ]);

  const byListing = new Map(); // listingId (string) -> { accepted, rejected }
  for (const row of rows) {
    const key = row._id.listing.toString();
    const entry = byListing.get(key) || { accepted: 0, rejected: 0 };
    entry[row._id.status] = row.count;
    byListing.set(key, entry);
  }
  return byListing;
}

/** One query each for reports targeting a listing directly, and reports
 *  targeting the listing's owner directly (fraud/harassment reports don't
 *  always name a specific listing). */
async function buildReportMaps() {
  const [listingRows, ownerRows] = await Promise.all([
    Report.aggregate([
      { $match: { reportedListing: { $ne: null }, status: { $in: ["pending", "reviewed", "resolved"] } } },
      { $group: { _id: "$reportedListing", count: { $sum: 1 } } },
    ]),
    Report.aggregate([
      { $match: { reportedUser: { $ne: null }, status: { $in: ["pending", "reviewed", "resolved"] } } },
      { $group: { _id: "$reportedUser", count: { $sum: 1 } } },
    ]),
  ]);

  const byListing = new Map(listingRows.map((r) => [r._id.toString(), r.count]));
  const byOwner = new Map(ownerRows.map((r) => [r._id.toString(), r.count]));
  return { byListing, byOwner };
}

async function run() {
  const startedAt = Date.now();
  await connectDB();
  console.log("Starting ranking recompute...");

  // ── Pre-aggregate everything that would otherwise be N+1 queries ──
  const [trustMap, { byListing: reportsByListing, byOwner: reportsByOwner }] = await Promise.all([
    buildTrustMap(),
    buildReportMaps(),
  ]);

  const cities = await Listing.distinct("city", { status: "active" });
  let totalScored = 0;

  for (const city of cities) {
    const [stats] = await Listing.aggregate([
      { $match: { city, status: "active" } },
      {
        $group: {
          _id: null,
          maxViews: { $max: "$views" },
          // BUG FIX: $size crashes on a missing/null savedBy field.
          // $ifNull guarantees an array is always passed to $size.
          maxSaves: { $max: { $size: { $ifNull: ["$savedBy", []] } } },
        },
      },
    ]);
    const cityStats = stats || { maxViews: 0, maxSaves: 0 };

    const listings = await Listing.find({ city, status: "active" }).lean();
    const bulkOps = [];

    for (const listing of listings) {
      const key = listing._id.toString();
      const ownerKey = listing.owner?.toString();

      const { accepted = 0, rejected = 0 } = trustMap.get(key) || {};
      const T = bayesianTrust(accepted, rejected);

      const reportCount =
        (reportsByListing.get(key) || 0) + (ownerKey ? reportsByOwner.get(ownerKey) || 0 : 0);
      const penalty = penaltyFromCount(reportCount);

      const F = freshnessScore(listing.createdAt);
      const P = popularityScore(listing.views, listing.savedBy?.length || 0, cityStats.maxViews, cityStats.maxSaves);
      const Q = qualityScore(listing);
      const A = availabilityScore(listing.availableFrom);

      const { rankingScore, scoreBreakdown } = combineScore({
        F, P, T, Q, A, penalty,
        featured: listing.featured,
        featuredUntil: listing.featuredUntil,
      });

      bulkOps.push({
        updateOne: {
          filter: { _id: listing._id },
          update: { $set: { rankingScore, scoreBreakdown, lastScoreComputedAt: new Date() } },
        },
      });
    }

    if (bulkOps.length > 0) {
      await Listing.bulkWrite(bulkOps, { ordered: false });
    }
    totalScored += listings.length;
    console.log(`  ${city}: scored ${listings.length} listings`);
  }

  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`Done. Scored ${totalScored} listings across ${cities.length} cities in ${seconds}s.`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Ranking recompute failed:", err);
  process.exit(1);
});
