import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../../services/api";
import toast from "react-hot-toast";
import {
  RiArrowLeftLine,
  RiGroupLine,
  RiLoader4Line,
  RiSaveLine,
  RiMapPin2Line,
  RiCheckLine,
  RiHeart3Line,
  RiHome4Line,
  RiArrowRightLine,
} from "react-icons/ri";
import { CITIES } from "../../utils/constants";

document.title = "Roommate Match — RoomBridge";

/* ── Compatibility circle color ────────────────────────────────
  Green  ≥ 70%
  Yellow 40–69%
  Red    < 40%
*/
const getScoreColor = (score) => {
  if (score >= 70)
    return {
      ring: "stroke-success",
      text: "text-success",
      bg: "bg-success/10",
    };
  if (score >= 40)
    return {
      ring: "stroke-warning",
      text: "text-warning",
      bg: "bg-warning/10",
    };
  return { ring: "stroke-error", text: "text-error", bg: "bg-error/10" };
};

/* ── SVG Circular progress ──────────────────────────────────── */
const ScoreCircle = ({ score }) => {
  const { ring, text } = getScoreColor(score);
  const r = 38;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-border"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          className={ring}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - dash}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-lg font-bold leading-none ${text}`}>
          {score}
        </span>
        <span className="text-[10px] text-text-secondary">/ 100</span>
      </div>
    </div>
  );
};

/* ── Preference form fields ──────────────────────────────────── 
   MUST match Preference.model.js enums exactly:
     sleepSchedule: early | late | flexible
     occupation:    student | professional
     gender:        male | female
     genderPreference: any | male | female
     smoker:        boolean
     pets:          boolean
     cleanliness:   1-5 number
*/
const SLEEP_OPTIONS = ["early", "late", "flexible"];
const OCCUPATION_OPTIONS = ["student", "professional"];
const GENDER_OPTIONS = ["male", "female"];
const GENDER_PREF_OPTIONS = ["any", "male", "female"];
const MATCHING_STEPS = [
  "Fill in your lifestyle preferences",
  "Our algorithm finds seekers with similar habits",
  "Compatibility scored 0–100",
  "Green ≥70 · Yellow 40–69 · Red <40",
  "Message matches directly from their profile",
];

const formatLabel = (val) => {
  if (val === true) return "Yes";
  if (val === false) return "No";
  if (typeof val === "number") return `${val}/5`;
  return val
    ? val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "";
};

/* Normalize API shapes so UI state always receives expected types. */
const extractPreference = (payload) => {
  if (!payload) return null;
  if (payload.preference !== undefined) return payload.preference;
  if (payload.data?.preference !== undefined) return payload.data.preference;
  if (payload.data && !Array.isArray(payload.data)) return payload.data;
  return null;
};

const extractMatches = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload.matches)) return payload.matches;
  if (Array.isArray(payload.data?.matches)) return payload.data.matches;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
};

const RoommateMatch = () => {
  const { user } = useSelector((s) => s.auth);
  const [tab, setTab] = useState("preferences");
  const [pref, setPref] = useState(null);
  const [form, setForm] = useState({
    sleepSchedule: "",
    cleanliness: 3,
    occupation: "",
    gender: "",
    genderPreference: "any",
    smoker: false,
    pets: false,
    budget: "",
    preferredCity: user?.city || "",
    bio: "",
  });
  const [prefLoading, setPrefLoading] = useState(true);
  const [prefSaving, setPrefSaving] = useState(false);
  const [matches, setMatches] = useState([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState("");

  /* ── Load existing preferences ───────────────────────────── */
  useEffect(() => {
    api
      .get("/preferences/me")
      .then((res) => {
        const p = extractPreference(res.data);
        setPref(p);
        if (p) {
          setForm({
            sleepSchedule: p.sleepSchedule || "",
            cleanliness: p.cleanliness || 3,
            occupation: p.occupation || "",
            gender: p.gender || "",
            genderPreference: p.genderPreference || "any",
            smoker: p.smoker === true,
            pets: p.pets === true,
            budget: p.budget || "",
            preferredCity: p.preferredCity || user?.city || "",
            bio: p.bio || "",
          });
        }
      })
      .catch(() => {
        /* No preferences yet — form stays blank */
      })
      .finally(() => setPrefLoading(false));
  }, [user]);

  /* ── Save / update preferences ───────────────────────────── */
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.sleepSchedule || !form.occupation || !form.gender) {
      toast.error("Please fill in Sleep Schedule, Occupation, and Gender.");
      return;
    }
    try {
      setPrefSaving(true);
      /*
        Backend route: POST /preferences (upsert with findOneAndUpdate + upsert:true).
        On success returns { success, preference }.
      */
      const res = await api.post("/preferences", form);
      const saved = res.data?.preference || res.data?.data;
      setPref(saved);
      toast.success("Preferences saved! Finding your matches…");
      setTab("matches");
      loadMatches();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save preferences.");
    } finally {
      setPrefSaving(false);
    }
  };

  /* ── Load roommate matches ───────────────────────────────── */
  const loadMatches = useCallback(async () => {
    try {
      setMatchLoading(true);
      setMatchError("");
      /*
        Backend route: GET /preferences/matches
        Returns { success, matches: [{ user, compatibilityScore, breakdown }] }
      */
      const res = await api.get("/preferences/matches");
      setMatches(extractMatches(res.data));
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load matches.";
      setMatchError(msg);
      setMatches([]);
    } finally {
      setMatchLoading(false);
    }
  }, []);

  /* Auto-load matches if preferences exist */
  useEffect(() => {
    if (pref && tab === "matches") loadMatches();
  }, [pref, tab, loadMatches]);

  const handleFieldChange = (name, value) =>
    setForm((f) => ({ ...f, [name]: f[name] === value ? "" : value }));

  /* ── Option selector buttons ─────────────────────────────── */
  const OptionRow = ({ label, name, options }) => (
    <div>
      <p className="label mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => handleFieldChange(name, opt)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all duration-150
                              ${
                                form[name] === opt
                                  ? "bg-primary text-white border-primary shadow-card"
                                  : "bg-white border-border text-text-secondary hover:border-primary hover:text-primary"
                              }`}
          >
            {formatLabel(opt)}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-white border-b border-border px-6 py-4 flex items-center gap-4">
        <Link
          to="/seeker/dashboard"
          className="p-2 rounded-lg hover:bg-background text-text-secondary hover:text-primary transition-colors"
        >
          <RiArrowLeftLine className="text-xl" />
        </Link>
        <div>
          <h1 className="font-bold text-primary">Roommate Match</h1>
          <p className="text-text-secondary text-xs">
            Find compatible roommates based on your lifestyle
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-border">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex">
            {[
              { key: "preferences", label: "My Preferences" },
              {
                key: "matches",
                label: `Matches${matches.length > 0 ? ` (${matches.length})` : ""}`,
              },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-6 py-4 text-sm font-semibold border-b-2 transition-all
                                  ${
                                    tab === key
                                      ? "border-primary text-primary"
                                      : "border-transparent text-text-secondary hover:text-primary"
                                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 bg-primary/5 rounded-card border border-primary/20 p-5">
          <h3 className="font-semibold text-primary mb-2 text-sm">
            How It Works
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-text-secondary">
            {MATCHING_STEPS.map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <RiCheckLine className="text-primary shrink-0 mt-0.5" />
                {step}
              </li>
            ))}
          </ul>
        </div>

        {/* ══════ PREFERENCES TAB ════════════════════════════ */}
        {tab === "preferences" &&
          (prefLoading ? (
            <div className="flex justify-center py-20">
              <RiLoader4Line className="animate-spin text-4xl text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-card border border-border shadow-card p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <RiGroupLine className="text-primary text-xl" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-primary">
                        Lifestyle Preferences
                      </h2>
                      <p className="text-xs text-text-secondary">
                        {pref
                          ? "Update your preferences to refresh matches."
                          : "Complete your profile to find matches."}
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSave} className="space-y-5">
                    <OptionRow
                      label="Sleep Schedule *"
                      name="sleepSchedule"
                      options={SLEEP_OPTIONS}
                    />
                    <OptionRow
                      label="Occupation *"
                      name="occupation"
                      options={OCCUPATION_OPTIONS}
                    />
                    <OptionRow
                      label="Your Gender *"
                      name="gender"
                      options={GENDER_OPTIONS}
                    />
                    <OptionRow
                      label="Roommate Gender"
                      name="genderPreference"
                      options={GENDER_PREF_OPTIONS}
                    />

                    {/* Cleanliness slider */}
                    <div>
                      <p className="label mb-2">
                        Cleanliness Level * ({form.cleanliness}/5)
                      </p>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        step={1}
                        value={form.cleanliness}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            cleanliness: parseInt(e.target.value),
                          }))
                        }
                        className="w-full accent-primary"
                      />
                      <div className="flex justify-between text-xs text-text-secondary mt-1">
                        <span>Relaxed</span>
                        <span>Average</span>
                        <span>Very Clean</span>
                      </div>
                    </div>

                    {/* Smoker / Pets checkboxes */}
                    <label className="flex items-center gap-3 p-3 bg-background rounded-input border border-border cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.smoker}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, smoker: e.target.checked }))
                        }
                        className="accent-primary w-4 h-4"
                      />
                      <span className="text-sm text-primary">
                        I smoke / smoking is OK
                      </span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-background rounded-input border border-border cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.pets}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, pets: e.target.checked }))
                        }
                        className="accent-primary w-4 h-4"
                      />
                      <span className="text-sm text-primary">
                        I have pets / pets are OK
                      </span>
                    </label>

                    {/* Budget */}
                    <div>
                      <label className="label" htmlFor="rm-budget">
                        Monthly Budget (PKR)
                      </label>
                      <input
                        id="rm-budget"
                        type="number"
                        min={1000}
                        placeholder="e.g. 15000"
                        value={form.budget}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, budget: e.target.value }))
                        }
                        className="input"
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label className="label" htmlFor="rm-city">
                        Preferred City
                      </label>
                      <select
                        id="rm-city"
                        value={form.preferredCity}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            preferredCity: e.target.value,
                          }))
                        }
                        className="input"
                      >
                        <option value="">Any city</option>
                        {CITIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="label" htmlFor="rm-bio">
                        About Me
                      </label>
                      <textarea
                        id="rm-bio"
                        value={form.bio}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, bio: e.target.value }))
                        }
                        rows={3}
                        placeholder="Tell potential roommates a bit about yourself…"
                        className="input resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={prefSaving}
                      className="w-full btn-primary justify-center gap-2"
                      aria-busy={prefSaving}
                    >
                      {prefSaving ? (
                        <>
                          <RiLoader4Line className="animate-spin" /> Saving…
                        </>
                      ) : (
                        <>
                          <RiSaveLine />{" "}
                          {pref
                            ? "Update Preferences & Refresh Matches"
                            : "Save & Find Matches"}
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Side info */}
              <div className="space-y-4">
                {pref && (
                  <div className="bg-white rounded-card border border-border shadow-card p-5">
                    <h3 className="font-semibold text-primary mb-3 text-sm">
                      Your Current Profile
                    </h3>
                    <div className="space-y-2">
                      {[
                        { label: "Sleep", val: pref.sleepSchedule },
                        { label: "Clean", val: pref.cleanliness },
                        { label: "Occupation", val: pref.occupation },
                        { label: "Gender", val: pref.gender },
                        { label: "Smoker", val: pref.smoker },
                        { label: "City", val: pref.preferredCity },
                      ]
                        .filter(
                          (x) =>
                            x.val !== undefined &&
                            x.val !== null &&
                            x.val !== "",
                        )
                        .map(({ label, val }) => (
                          <div
                            key={label}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-text-secondary">{label}</span>
                            <span className="text-primary font-medium capitalize">
                              {formatLabel(val)}
                            </span>
                          </div>
                        ))}
                    </div>
                    <button
                      onClick={() => {
                        setTab("matches");
                        loadMatches();
                      }}
                      className="w-full mt-4 btn-secondary text-sm justify-center gap-2"
                    >
                      <RiGroupLine /> View Matches
                    </button>
                  </div>
                )}
                <div className="bg-primary/5 rounded-card border border-primary/20 p-5">
                  <h3 className="font-semibold text-primary mb-2 text-sm">
                    How Matching Works
                  </h3>
                  <ul className="space-y-1.5 text-xs text-text-secondary">
                    {MATCHING_STEPS.map((t, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <RiCheckLine className="text-primary shrink-0 mt-0.5" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}

        {/* ══════ MATCHES TAB ════════════════════════════════ */}
        {tab === "matches" &&
          (!pref ? (
            <div className="text-center py-20 bg-white rounded-card border border-border shadow-card">
              <RiGroupLine className="text-5xl text-border mx-auto mb-4" />
              <h3 className="text-xl font-bold text-primary mb-2">
                Set Up Your Preferences First
              </h3>
              <p className="text-text-secondary text-sm mb-5">
                Fill in your lifestyle preferences to see compatible roommate
                matches.
              </p>
              <button
                onClick={() => setTab("preferences")}
                className="btn-primary"
              >
                Set Preferences
              </button>
            </div>
          ) : matchLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <RiLoader4Line className="animate-spin text-4xl text-primary mx-auto mb-3" />
                <p className="text-text-secondary text-sm">
                  Finding your best matches…
                </p>
              </div>
            </div>
          ) : matchError ? (
            <div className="text-center py-20 bg-white rounded-card border border-border shadow-card">
              <p className="text-error text-sm mb-4">{matchError}</p>
              <button onClick={loadMatches} className="btn-secondary">
                Try Again
              </button>
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-card border border-border shadow-card">
              <RiGroupLine className="text-5xl text-border mx-auto mb-4" />
              <h3 className="text-xl font-bold text-primary mb-2">
                No Matches Yet
              </h3>
              <p className="text-text-secondary text-sm mb-5">
                No other seekers have set up preferences yet. Check back soon,
                or update yours.
              </p>
              <button
                onClick={() => setTab("preferences")}
                className="btn-secondary"
              >
                Update Preferences
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-primary">
                    {matches.length} Potential Match
                    {matches.length !== 1 ? "es" : ""}
                  </h2>
                  <p className="text-text-secondary text-sm">
                    Sorted by compatibility score
                  </p>
                </div>
                <button
                  onClick={loadMatches}
                  className="btn-secondary text-sm flex items-center gap-2"
                >
                  <RiGroupLine /> Refresh
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {matches.map((match, idx) => {
                  const seeker = match.user || match.seeker;
                  const score = Math.round(
                    match.compatibility?.score ||
                      match.compatibilityScore ||
                      match.score ||
                      0,
                  );
                  const { bg } = getScoreColor(score);

                  return (
                    <div
                      key={seeker?._id || idx}
                      className="bg-white rounded-card border border-border shadow-card
                                    hover:shadow-hover transition-all duration-300 p-5"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        {/* Avatar */}
                        <div className="shrink-0">
                          {seeker?.profilePhoto?.url ? (
                            <img
                              src={seeker.profilePhoto.url}
                              alt={seeker.name}
                              className="w-14 h-14 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
                              <span className="text-xl font-bold text-white">
                                {(seeker?.name || "?")[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Name + city */}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-primary text-base">
                            {seeker?.name || "Seeker"}
                          </p>
                          {seeker?.city && (
                            <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                              <RiMapPin2Line className="text-accent" />{" "}
                              {seeker.city}
                            </p>
                          )}
                          {/* Badge for score */}
                          <div
                            className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5
                                          rounded-full text-xs font-semibold ${bg} ${getScoreColor(score).text}`}
                          >
                            <RiHeart3Line className="text-xs" />
                            {score >= 70
                              ? "Excellent Match"
                              : score >= 40
                                ? "Good Match"
                                : "Low Match"}
                          </div>
                        </div>

                        {/* Score circle */}
                        <ScoreCircle score={score} />
                      </div>

                      {/* Breakdown */}
                      {(match.compatibility?.breakdown || match.breakdown) &&
                        Object.keys(
                          match.compatibility?.breakdown ||
                            match.breakdown ||
                            {},
                        ).length > 0 && (
                          <div className="border-t border-border pt-4 mb-4">
                            <p className="text-xs font-semibold text-text-secondary mb-2">
                              Score Breakdown
                            </p>
                            <div className="space-y-1.5">
                              {Object.entries(
                                match.compatibility?.breakdown ||
                                  match.breakdown ||
                                  {},
                              )
                                .slice(0, 4)
                                .map(([key, val]) => (
                                  <div
                                    key={key}
                                    className="flex items-center gap-2"
                                  >
                                    <span className="text-xs text-text-secondary w-28 shrink-0 capitalize">
                                      {key.replace(/([A-Z])/g, " $1").trim()}
                                    </span>
                                    <div className="flex-1 h-1.5 bg-border rounded-full">
                                      <div
                                        className={`h-1.5 rounded-full transition-all duration-500 ${getScoreColor(val).ring.replace("stroke-", "bg-")}`}
                                        style={{
                                          width: `${Math.min(100, val)}%`,
                                        }}
                                      />
                                    </div>
                                    <span
                                      className={`text-xs font-medium w-8 text-right ${getScoreColor(val).text}`}
                                    >
                                      {Math.round(val)}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                      {/* Interest tags from preference */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {[
                          match.preference?.sleepSchedule,
                          match.preference?.occupation,
                          match.preference?.gender,
                        ]
                          .filter(Boolean)
                          .map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-0.5 bg-background border border-border
                                                        rounded-full text-text-secondary capitalize"
                            >
                              {formatLabel(tag)}
                            </span>
                          ))}
                      </div>

                      {/* Message button */}
                      <Link
                        to={`/seeker/messages?user=${seeker?._id || ""}&name=${encodeURIComponent(seeker?.name || "Matched Seeker")}&city=${encodeURIComponent(seeker?.city || "")}`}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-btn
                                   bg-primary/5 border border-primary/20 text-primary text-sm font-medium
                                   hover:bg-primary hover:text-white transition-all duration-200"
                      >
                        <RiArrowRightLine /> Say Hello
                      </Link>
                    </div>
                  );
                })}
              </div>
            </>
          ))}
      </div>
    </div>
  );
};

export default RoommateMatch;
