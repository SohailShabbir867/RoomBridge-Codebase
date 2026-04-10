/**
 * Roommate Compatibility Engine
 *
 * Scoring weights (total = 100 points):
 *   sleepSchedule    25 pts — most impactful daily habit
 *   smoker           20 pts — deal-breaker for many
 *   pets             15 pts — allergy / preference
 *   cleanliness      20 pts — within 1 level = full score
 *   occupation       10 pts — student/professional alignment
 *   gender           10 pts — preference compatibility
 *
 * BUG FIX: The original used 'genderPreference' as the key on Preference documents
 * but the Preference model defines the field as 'gender' (not 'genderPreference').
 * Using the wrong field name results in the gender check always taking the
 * "field not present → 0.5 * weight" fallback path, silently under-scoring.
 *
 * Also fixed: Input validation — calling with null/undefined prefs1 or prefs2
 * would throw a TypeError. Added a null guard at the top.
 */

const WEIGHTS = {
  sleepSchedule: 25,
  smoker:        20,
  pets:          15,
  cleanliness:   20,
  occupation:    10,
  gender:        10,   // BUG FIX: model field is 'gender', not 'genderPreference'
};

/**
 * Calculate compatibility score (0–100) between two Preference documents.
 *
 * @param {object} prefs1 - Preference of user A (Mongoose doc or plain object)
 * @param {object} prefs2 - Preference of user B
 * @returns {{ score: number, breakdown: object, label: string }}
 */
const calculateCompatibility = (prefs1, prefs2) => {
  // BUG FIX: Null guard — throw clearly instead of cryptic TypeError
  if (!prefs1 || !prefs2) {
    throw new Error('calculateCompatibility requires two non-null preference objects.');
  }

  let score = 0;
  const breakdown = {};

  /* sleepSchedule — exact match only */
  if (!prefs1.sleepSchedule || !prefs2.sleepSchedule) {
    breakdown.sleepSchedule = WEIGHTS.sleepSchedule * 0.5; // neutral fallback
  } else {
    breakdown.sleepSchedule =
      prefs1.sleepSchedule === prefs2.sleepSchedule ? WEIGHTS.sleepSchedule : 0;
  }
  score += breakdown.sleepSchedule;

  /* smoker — exact match only */
  if (prefs1.smoker === undefined || prefs1.smoker === null ||
      prefs2.smoker === undefined || prefs2.smoker === null) {
    breakdown.smoker = WEIGHTS.smoker * 0.5;
  } else {
    breakdown.smoker = prefs1.smoker === prefs2.smoker ? WEIGHTS.smoker : 0;
  }
  score += breakdown.smoker;

  /* pets — exact match only */
  if (prefs1.pets === undefined || prefs1.pets === null ||
      prefs2.pets === undefined || prefs2.pets === null) {
    breakdown.pets = WEIGHTS.pets * 0.5;
  } else {
    breakdown.pets = prefs1.pets === prefs2.pets ? WEIGHTS.pets : 0;
  }
  score += breakdown.pets;

  /* cleanliness — numeric 1-5, full score within 1 level */
  if (!prefs1.cleanliness || !prefs2.cleanliness) {
    breakdown.cleanliness = WEIGHTS.cleanliness * 0.5;
  } else {
    const diff = Math.abs(Number(prefs1.cleanliness) - Number(prefs2.cleanliness));
    if (diff <= 1)      breakdown.cleanliness = WEIGHTS.cleanliness;
    else if (diff === 2) breakdown.cleanliness = WEIGHTS.cleanliness * 0.5;
    else                breakdown.cleanliness = 0;
  }
  score += breakdown.cleanliness;

  /* occupation — exact match */
  if (!prefs1.occupation || !prefs2.occupation) {
    breakdown.occupation = WEIGHTS.occupation * 0.5;
  } else {
    breakdown.occupation =
      prefs1.occupation === prefs2.occupation ? WEIGHTS.occupation : 0;
  }
  score += breakdown.occupation;

  /* gender — BUG FIX: use 'gender' (model field name), not 'genderPreference'
   * Compatible if either user has no preference or both preferences match.
   * Note: Preference.gender is the seeker's own gender ('male'/'female'),
   * not their roommate preference. For roommate gender preference, use
   * Listing.genderPreference. Here we match same-gender seekers together. */
  const g1 = prefs1.gender;
  const g2 = prefs2.gender;
  if (!g1 || !g2) {
    breakdown.gender = WEIGHTS.gender * 0.5;
  } else {
    breakdown.gender = (g1 === g2) ? WEIGHTS.gender : 0;
  }
  score += breakdown.gender;

  const finalScore = Math.round(Math.min(100, Math.max(0, score)));

  return {
    score:     finalScore,
    breakdown,
    label:     getCompatibilityLabel(finalScore),
  };
};

/**
 * Return a human-readable label for a compatibility score.
 * @param {number} score - 0 to 100
 * @returns {string}
 */
const getCompatibilityLabel = (score) => {
  if (score >= 80) return 'Excellent Match';
  if (score >= 60) return 'Good Match';
  if (score >= 40) return 'Fair Match';
  return 'Poor Match';
};

/**
 * Sort an array of { user, prefs, score } objects by score descending.
 * Utility for the roommate-match controller.
 *
 * @param {Array} matches - Array of objects with a `score` property
 * @returns {Array} sorted descending by score
 */
const sortByScore = (matches) =>
  [...matches].sort((a, b) => b.score - a.score);

module.exports = { calculateCompatibility, getCompatibilityLabel, sortByScore };
