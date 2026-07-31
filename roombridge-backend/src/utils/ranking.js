"use strict";

/**
 * RoomBridge Listing Ranking System
 * ──────────────────────────────────
 * Computes a composite 0..1 "rankingScore" for each active listing from
 * several independent, normalized signals:
 *
 *   F  Freshness    – exponential decay from createdAt
 *   P  Popularity   – log-scaled views + saves, normalized per city
 *   T  Trust        – Bayesian-smoothed booking acceptance rate
 *   Q  Quality      – profile completeness checklist
 *   A  Availability – urgency boost for listings available soon
 *   X  Penalty      – deranking from unresolved/resolved reports (listing OR owner)
 *
 * score = 0.20F + 0.25P + 0.30T + 0.15Q + 0.10A − X
 * Featured listings get a capped +15% multiplier AFTER the penalty is
 * applied, so a reported/low-trust listing cannot buy its way to the top.
 *
 * Two entry points:
 *   computeListingScore(listing, cityStats)              – single listing,
 *     runs its own Booking/Report queries. Used by createListing/updateListing
 *     where only 1–4 listings need scoring per request.
 *   combineScore({F,P,T,Q,A,penalty,featured,featuredUntil}) – pure, synchronous.
 *     Used by scripts/recompute-rankings.js, which pre-aggregates trust and
 *     report stats for ALL listings in 2 queries up front (not one query per
 *     listing) and calls this directly per listing in memory.
 */

const Booking = require("../models/Booking.model");
const Report = require("../models/Report.model");

/* ── Tunable constants ─────────────────────────────────────
   Keep these in one place so they can be adjusted without touching
   the scoring logic itself. Revisit GLOBAL_AVG_ACCEPT_RATE periodically
   once real booking data accumulates (recompute from Booking stats). */
const DECAY_LAMBDA = 0.03; // freshness half-life ≈ 23 days
const BAYESIAN_C = 10; // "phantom bookings" prior weight for trust smoothing
const GLOBAL_AVG_ACCEPT_RATE = 0.6; // fallback prior until real data is better

const WEIGHTS = {
  freshness: 0.2,
  popularity: 0.25,
  trust: 0.3,
  quality: 0.15,
  availability: 0.1,
};

const FEATURED_BOOST = 0.15; // capped multiplier for paid/featured listings
const REPORT_PENALTY_PER_REPORT = 0.15;
const REPORT_PENALTY_CAP = 0.8;

/* ── Individual signal calculators ─────────────────────────────────── */

/** Exponential recency decay. Score of 1 = brand new, decays toward 0. */
function freshnessScore(createdAt) {
  const dateVal = createdAt ? new Date(createdAt) : new Date();
  const validDate = isNaN(dateVal.getTime()) ? new Date() : dateVal;
  const ageDays = (Date.now() - validDate.getTime()) / 86_400_000;
  return Math.exp(-DECAY_LAMBDA * Math.max(ageDays, 0));
}

/** Log-scaled views + saves, normalized against the max in the same city
 *  so a small city's listings aren't buried by a big city's raw traffic.
 *  BUG FIX: when a city has zero views/saves everywhere (e.g. brand-new
 *  city with no traffic yet), log1p(0)/log1p(0) was 0/0 = NaN, which then
 *  corrupted rankingScore for every listing in that city. Denominators are
 *  now floored at log1p(1) so the result is always a real number in [0,1]. */
function popularityScore(views, savedCount, cityMaxViews, cityMaxSaves) {
  const viewsDenom = Math.log1p(Math.max(cityMaxViews || 0, 1));
  const savesDenom = Math.log1p(Math.max(cityMaxSaves || 0, 1));
  const v = Math.log1p(Math.max(views || 0, 0)) / viewsDenom;
  const s = Math.log1p(Math.max(savedCount || 0, 0)) / savesDenom;
  return Math.min(0.6 * v + 0.4 * s, 1);
}

/** Bumps listings that are actually rentable soon; tapers over 30 days. */
function availabilityScore(availableFrom) {
  if (!availableFrom) return 1;
  const d = new Date(availableFrom);
  if (isNaN(d.getTime())) return 1;
  const daysUntil = (d.getTime() - Date.now()) / 86_400_000;
  if (daysUntil <= 0) return 1; // available now
  if (daysUntil > 30) return 0.3; // far out, low urgency
  return 1 - daysUntil / 30;
}

/** Profile completeness checklist — encourages owners to fill listings out
 *  properly (photos, description depth, nearby places, amenities, university). */
function qualityScore(listing) {
  let points = 0;
  const checks = 5;

  points += Math.min((listing.photos?.length || 0) / 5, 1);
  const descLen = listing.description?.length || 0;
  points += descLen >= 150 ? 1 : descLen / 150;
  points += (listing.nearbyPlaces?.length || 0) > 0 ? 1 : 0;
  const featureCount = listing.features?.length || 0;
  points += featureCount >= 4 ? 1 : featureCount / 4;
  points += listing.nearbyUniversity ? 1 : 0;

  return points / checks;
}

/** Bayesian smoothing formula, exposed standalone so both the single-listing
 *  path and the batch path (which pre-aggregates raw counts) share the exact
 *  same math instead of two copies drifting apart. */
function bayesianTrust(accepted, rejected) {
  const total = accepted + rejected;
  return (accepted + BAYESIAN_C * GLOBAL_AVG_ACCEPT_RATE) / (total + BAYESIAN_C);
}

/** Bayesian-smoothed booking acceptance rate for ONE listing (single-item path).
 *  A listing with 1/1 accepted should NOT outrank one with 45/50 accepted —
 *  smoothing fixes that by assuming every listing starts with BAYESIAN_C
 *  "phantom" average-outcome bookings until it proves otherwise with real data. */
async function trustScore(listingId) {
  const stats = await Booking.aggregate([
    { $match: { listing: listingId, status: { $in: ["accepted", "rejected"] } } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const accepted = stats.find((s) => s._id === "accepted")?.count || 0;
  const rejected = stats.find((s) => s._id === "rejected")?.count || 0;
  return bayesianTrust(accepted, rejected);
}

/** Penalty math shared by both paths — heavier the more reports accumulated,
 *  capped so it can never push a score below zero on its own. */
function penaltyFromCount(count) {
  if (count <= 0) return 0;
  return Math.min(REPORT_PENALTY_PER_REPORT * count, REPORT_PENALTY_CAP);
}

/** Report penalty for ONE listing (single-item path).
 *  BUG FIX: previously only counted reports targeting the listing itself.
 *  A user who reports the *owner* directly (fraud, harassment, scam) gave
 *  zero penalty, letting a reported owner's hostels stay at the top. Now
 *  counts both reportedListing AND reportedUser (the owner). */
async function reportPenalty(listingId, ownerId) {
  const [listingReports, ownerReports] = await Promise.all([
    Report.countDocuments({
      reportedListing: listingId,
      status: { $in: ["pending", "reviewed", "resolved"] },
    }),
    ownerId
      ? Report.countDocuments({
          reportedUser: ownerId,
          status: { $in: ["pending", "reviewed", "resolved"] },
        })
      : Promise.resolve(0),
  ]);
  return penaltyFromCount(listingReports + ownerReports);
}

/**
 * Pure, synchronous score combiner — no DB access. Given already-computed
 * signals, returns the same {rankingScore, scoreBreakdown} shape as
 * computeListingScore. Used by the batch recompute script, which
 * pre-aggregates T and penalty for every listing up front instead of
 * querying per listing (see scripts/recompute-rankings.js).
 */
function combineScore({ F, P, T, Q, A, penalty, featured, featuredUntil }) {
  const raw =
    WEIGHTS.freshness * F +
    WEIGHTS.popularity * P +
    WEIGHTS.trust * T +
    WEIGHTS.quality * Q +
    WEIGHTS.availability * A;

  let score = Math.max(raw - penalty, 0);

  const isFeaturedNow =
    Boolean(featured) &&
    (!featuredUntil || new Date(featuredUntil) > new Date());
  if (isFeaturedNow) {
    score *= 1 + FEATURED_BOOST;
  }

  return {
    rankingScore: Math.round(score * 1000) / 1000,
    scoreBreakdown: {
      relevance: 0, // filled in at query time for search-mode blending, not stored here
      freshness: Math.round(F * 1000) / 1000,
      popularity: Math.round(P * 1000) / 1000,
      trust: Math.round(T * 1000) / 1000,
      quality: Math.round(Q * 1000) / 1000,
      availability: Math.round(A * 1000) / 1000,
    },
  };
}

/**
 * Compute the composite ranking score for ONE listing document.
 * Convenience wrapper for single-listing contexts (create/update controllers)
 * where running 2 small queries is fine — NOT for batch jobs over the whole
 * collection (use combineScore + pre-aggregated stats there instead).
 * @param {object} listing   - Mongoose Listing document or plain object with the needed fields.
 * @param {object} cityStats - { maxViews, maxSaves } precomputed once per city.
 * @returns {Promise<{rankingScore: number, scoreBreakdown: object}>}
 */
async function computeListingScore(listing, cityStats) {
  const F = freshnessScore(listing.createdAt);
  const P = popularityScore(
    listing.views,
    listing.savedBy?.length || 0,
    cityStats.maxViews,
    cityStats.maxSaves,
  );
  const [T, penalty] = await Promise.all([
    trustScore(listing._id),
    reportPenalty(listing._id, listing.owner),
  ]);
  const Q = qualityScore(listing);
  const A = availabilityScore(listing.availableFrom);

  return combineScore({
    F, P, T, Q, A, penalty,
    featured: listing.featured,
    featuredUntil: listing.featuredUntil,
  });
}

module.exports = {
  computeListingScore,
  combineScore,
  bayesianTrust,
  penaltyFromCount,
  freshnessScore,
  popularityScore,
  availabilityScore,
  qualityScore,
  trustScore,
  reportPenalty,
  WEIGHTS,
  FEATURED_BOOST,
};
