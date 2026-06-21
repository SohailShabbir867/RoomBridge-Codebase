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
  RiArrowRightLine,
  RiUserLine,
  RiRefreshLine,
  RiSparklingLine,
} from "react-icons/ri";
import { CITIES } from "../../utils/constants";

document.title = "Roommate Match — RoomBridge";

/* ─── Design tokens (matches website) ─────────────────────── */
const C = {
  darkGreen: "#012D1D",
  btnPrimary: "#8E4E14",
  btnDark: "#783D01",
  promise: "#F0EDE9",
  white: "#FFFFFF",
};

/* ── Compatibility score colour ──────────────────────────────
   Green  ≥ 70%
   Yellow 40–69%
   Red    < 40%
*/
const getScoreColor = (score) => {
  if (score >= 70)
    return {
      ring: "#22c55e",
      text: "#16a34a",
      bg: "rgba(34,197,94,0.1)",
      label: "Excellent Match",
    };
  if (score >= 40)
    return {
      ring: "#f59e0b",
      text: "#d97706",
      bg: "rgba(245,158,11,0.1)",
      label: "Good Match",
    };
  return {
    ring: "#ef4444",
    text: "#dc2626",
    bg: "rgba(239,68,68,0.1)",
    label: "Low Match",
  };
};

/* ── SVG Circular progress ──────────────────────────────────── */
const ScoreCircle = ({ score }) => {
  const { ring, text } = getScoreColor(score);
  const r = 38;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={ring}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - dash}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold leading-none" style={{ color: text }}>
          {score}
        </span>
        <span className="text-[10px] text-gray-400">/ 100</span>
      </div>
    </div>
  );
};

/* ── Preference form data ─────────────────────────────────────
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
  { step: "01", title: "Fill Preferences", desc: "Share your lifestyle habits and budget." },
  { step: "02", title: "Smart Matching", desc: "Our algorithm finds seekers with similar habits." },
  { step: "03", title: "Scored Results", desc: "Compatibility scored 0–100 per profile." },
  { step: "04", title: "Connect", desc: "Message matches directly from their profile." },
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

  /* ── Option chip selector ─────────────────────────────────── */
  const OptionRow = ({ label, name, options, required }) => (
    <div>
      <p className="text-sm font-semibold mb-2" style={{ color: C.darkGreen }}>
        {label}
        {required && <span style={{ color: C.btnPrimary }}> *</span>}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = form[name] === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => handleFieldChange(name, opt)}
              className="px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all duration-200"
              style={
                active
                  ? { backgroundColor: C.darkGreen, color: C.white, borderColor: C.darkGreen }
                  : { backgroundColor: "transparent", color: "#6b7280", borderColor: "#e5e7eb" }
              }
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.borderColor = C.btnPrimary;
                  e.currentTarget.style.color = C.btnPrimary;
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.color = "#6b7280";
                }
              }}
            >
              {formatLabel(opt)}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f9fafb" }}>
      {/* ── Header ─────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-20 border-b"
        style={{ backgroundColor: C.darkGreen }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link
            to="/seeker/dashboard"
            className="p-2 rounded-xl transition-all duration-200"
            style={{ backgroundColor: "rgba(255,255,255,0.1)", color: C.white }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")}
          >
            <RiArrowLeftLine className="text-xl" />
          </Link>
          <div className="flex-1">
            <h1 className="font-bold text-white text-lg">Roommate Match</h1>
            <p className="text-white/60 text-xs">
              Find compatible roommates based on your lifestyle
            </p>
          </div>
          {pref && (
            <button
              onClick={() => { setTab("matches"); loadMatches(); }}
              className="hidden sm:flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200"
              style={{ backgroundColor: C.btnPrimary, color: C.white }}
            >
              <RiGroupLine /> View Matches
              {matches.length > 0 && (
                <span className="ml-1 bg-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold" style={{ color: C.btnPrimary }}>
                  {matches.length}
                </span>
              )}
            </button>
          )}
        </div>
      </header>

      {/* ── How It Works Banner ─────────────────────────────── */}
      <div style={{ backgroundColor: C.promise }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="text-center mb-8">
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: C.btnPrimary }}>
              AI-Powered
            </p>
            <h2 className="text-2xl md:text-3xl font-bold" style={{ color: C.darkGreen }}>
              How Roommate Matching Works
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {MATCHING_STEPS.map(({ step, title, desc }, i) => (
              <div key={step} className="relative text-center group">
                {i < MATCHING_STEPS.length - 1 && (
                  <div
                    className="hidden lg:block absolute top-6 left-1/2 w-full h-px opacity-20"
                    style={{ background: `linear-gradient(to right, ${C.btnPrimary}, transparent)` }}
                    aria-hidden="true"
                  />
                )}
                <div className="relative inline-flex flex-col items-center">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 font-black text-lg transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: C.darkGreen, color: C.white }}
                  >
                    {step}
                  </div>
                  <h3 className="font-bold text-sm mb-1" style={{ color: C.darkGreen }}>
                    {title}
                  </h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-[73px] z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
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
                className="px-6 py-4 text-sm font-semibold border-b-2 transition-all duration-200"
                style={
                  tab === key
                    ? { borderBottomColor: C.btnPrimary, color: C.darkGreen }
                    : { borderBottomColor: "transparent", color: "#9ca3af" }
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Page Content ────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* ════ PREFERENCES TAB ══════════════════════════════ */}
        {tab === "preferences" &&
          (prefLoading ? (
            <div className="flex justify-center py-24">
              <RiLoader4Line className="animate-spin text-4xl" style={{ color: C.btnPrimary }} />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* ── Form ──────────────────────────────────── */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                  <div className="flex items-center gap-4 mb-8">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${C.btnPrimary}18` }}
                    >
                      <RiGroupLine className="text-xl" style={{ color: C.btnPrimary }} />
                    </div>
                    <div>
                      <h2 className="font-bold text-lg" style={{ color: C.darkGreen }}>
                        Lifestyle Preferences
                      </h2>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {pref
                          ? "Update your preferences to refresh matches."
                          : "Complete your profile to find compatible roommates."}
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSave} className="space-y-6">
                    <OptionRow label="Sleep Schedule" name="sleepSchedule" options={SLEEP_OPTIONS} required />
                    <OptionRow label="Occupation" name="occupation" options={OCCUPATION_OPTIONS} required />
                    <OptionRow label="Your Gender" name="gender" options={GENDER_OPTIONS} required />
                    <OptionRow label="Preferred Roommate Gender" name="genderPreference" options={GENDER_PREF_OPTIONS} />

                    {/* Cleanliness slider */}
                    <div>
                      <p className="text-sm font-semibold mb-3" style={{ color: C.darkGreen }}>
                        Cleanliness Level{" "}
                        <span className="font-normal text-gray-400">({form.cleanliness}/5)</span>
                      </p>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        step={1}
                        value={form.cleanliness}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, cleanliness: parseInt(e.target.value) }))
                        }
                        className="w-full h-2 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: C.darkGreen }}
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-2">
                        <span>Relaxed</span>
                        <span>Average</span>
                        <span>Very Clean</span>
                      </div>
                    </div>

                    {/* Smoker / Pets */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { field: "smoker", label: "🚬  Smoking is OK" },
                        { field: "pets", label: "🐾  Pets are OK" },
                      ].map(({ field, label }) => (
                        <label
                          key={field}
                          className="flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200"
                          style={
                            form[field]
                              ? { borderColor: C.darkGreen, backgroundColor: `${C.darkGreen}08` }
                              : { borderColor: "#e5e7eb", backgroundColor: "transparent" }
                          }
                        >
                          <input
                            type="checkbox"
                            checked={form[field]}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, [field]: e.target.checked }))
                            }
                            className="w-4 h-4 rounded"
                            style={{ accentColor: C.darkGreen }}
                          />
                          <span className="text-sm font-medium" style={{ color: C.darkGreen }}>
                            {label}
                          </span>
                        </label>
                      ))}
                    </div>

                    {/* Budget */}
                    <div>
                      <label
                        className="text-sm font-semibold block mb-2"
                        style={{ color: C.darkGreen }}
                        htmlFor="rm-budget"
                      >
                        Monthly Budget <span className="font-normal text-gray-400">(PKR)</span>
                      </label>
                      <input
                        id="rm-budget"
                        type="number"
                        min={1000}
                        placeholder="e.g. 15,000"
                        value={form.budget}
                        onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 outline-none text-sm transition-all duration-200"
                        style={{ color: C.darkGreen }}
                        onFocus={(e) => (e.target.style.borderColor = C.btnPrimary)}
                        onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label
                        className="text-sm font-semibold block mb-2"
                        style={{ color: C.darkGreen }}
                        htmlFor="rm-city"
                      >
                        Preferred City
                      </label>
                      <select
                        id="rm-city"
                        value={form.preferredCity}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, preferredCity: e.target.value }))
                        }
                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 outline-none text-sm transition-all duration-200"
                        style={{ color: C.darkGreen }}
                        onFocus={(e) => (e.target.style.borderColor = C.btnPrimary)}
                        onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                      >
                        <option value="">Any City</option>
                        {CITIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Bio */}
                    <div>
                      <label
                        className="text-sm font-semibold block mb-2"
                        style={{ color: C.darkGreen }}
                        htmlFor="rm-bio"
                      >
                        About Me
                      </label>
                      <textarea
                        id="rm-bio"
                        value={form.bio}
                        onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                        rows={3}
                        placeholder="Tell potential roommates a bit about yourself…"
                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 outline-none text-sm resize-none transition-all duration-200"
                        style={{ color: C.darkGreen }}
                        onFocus={(e) => (e.target.style.borderColor = C.btnPrimary)}
                        onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={prefSaving}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold text-sm transition-all duration-200 hover:opacity-90 active:scale-95"
                      style={{ backgroundColor: C.btnPrimary }}
                    >
                      {prefSaving ? (
                        <>
                          <RiLoader4Line className="animate-spin" /> Saving…
                        </>
                      ) : (
                        <>
                          <RiSaveLine />
                          {pref ? "Update Preferences & Refresh Matches" : "Save & Find Matches"}
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* ── Sidebar ────────────────────────────────── */}
              <div className="space-y-5">
                {pref && (
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${C.darkGreen}12` }}
                      >
                        <RiUserLine className="text-base" style={{ color: C.darkGreen }} />
                      </div>
                      <h3 className="font-bold text-sm" style={{ color: C.darkGreen }}>
                        Your Current Profile
                      </h3>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { label: "Sleep", val: pref.sleepSchedule },
                        { label: "Cleanliness", val: pref.cleanliness },
                        { label: "Occupation", val: pref.occupation },
                        { label: "Gender", val: pref.gender },
                        { label: "Smoker", val: pref.smoker },
                        { label: "City", val: pref.preferredCity },
                      ]
                        .filter((x) => x.val !== undefined && x.val !== null && x.val !== "")
                        .map(({ label, val }) => (
                          <div key={label} className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">{label}</span>
                            <span className="font-semibold capitalize" style={{ color: C.darkGreen }}>
                              {formatLabel(val)}
                            </span>
                          </div>
                        ))}
                    </div>
                    <button
                      onClick={() => { setTab("matches"); loadMatches(); }}
                      className="w-full mt-5 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 font-semibold text-sm transition-all duration-200 hover:opacity-80"
                      style={{ borderColor: C.darkGreen, color: C.darkGreen }}
                    >
                      <RiGroupLine /> View My Matches
                    </button>
                  </div>
                )}

                {/* Tips card */}
                <div
                  className="rounded-3xl p-6"
                  style={{ backgroundColor: C.promise }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <RiSparklingLine style={{ color: C.btnPrimary }} />
                    <h3 className="font-bold text-sm" style={{ color: C.darkGreen }}>
                      Tips for Better Matches
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {[
                      "Complete all required fields for a higher match rate.",
                      "Add a bio — it increases profile views by 3×.",
                      "Set a realistic budget to get compatible matches.",
                      "Update preferences whenever your habits change.",
                    ].map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
                        <RiCheckLine className="mt-0.5 shrink-0" style={{ color: C.btnPrimary }} />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}

        {/* ════ MATCHES TAB ═══════════════════════════════════ */}
        {tab === "matches" &&
          (!pref ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: `${C.btnPrimary}12` }}
              >
                <RiGroupLine className="text-4xl" style={{ color: C.btnPrimary }} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: C.darkGreen }}>
                Set Up Your Preferences First
              </h3>
              <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                Fill in your lifestyle preferences to see compatible roommate matches.
              </p>
              <button
                onClick={() => setTab("preferences")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-sm transition-all duration-200 hover:opacity-90"
                style={{ backgroundColor: C.btnPrimary }}
              >
                Set Preferences <RiArrowRightLine />
              </button>
            </div>
          ) : matchLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="text-center">
                <RiLoader4Line
                  className="animate-spin text-5xl mx-auto mb-4"
                  style={{ color: C.btnPrimary }}
                />
                <p className="text-gray-500 text-sm">Finding your best matches…</p>
              </div>
            </div>
          ) : matchError ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-red-500 text-sm mb-5">{matchError}</p>
              <button
                onClick={loadMatches}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border-2 font-bold text-sm transition-all duration-200"
                style={{ borderColor: C.darkGreen, color: C.darkGreen }}
              >
                <RiRefreshLine /> Try Again
              </button>
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: `${C.darkGreen}10` }}
              >
                <RiGroupLine className="text-4xl" style={{ color: C.darkGreen }} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: C.darkGreen }}>
                No Matches Yet
              </h3>
              <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                No other seekers have set up preferences yet. Check back soon, or update yours.
              </p>
              <button
                onClick={() => setTab("preferences")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border-2 font-bold text-sm transition-all duration-200"
                style={{ borderColor: C.btnPrimary, color: C.btnPrimary }}
              >
                Update Preferences
              </button>
            </div>
          ) : (
            <>
              {/* ── Header row ──────────────────────────── */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: C.btnPrimary }}>
                    Results
                  </p>
                  <h2 className="text-2xl font-bold" style={{ color: C.darkGreen }}>
                    {matches.length} Potential Match{matches.length !== 1 ? "es" : ""}
                  </h2>
                  <p className="text-gray-500 text-sm mt-0.5">Sorted by compatibility score</p>
                </div>
                <button
                  onClick={loadMatches}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-semibold text-sm transition-all duration-200 hover:opacity-75"
                  style={{ borderColor: C.darkGreen, color: C.darkGreen }}
                >
                  <RiRefreshLine /> Refresh
                </button>
              </div>

              {/* ── Match Cards Grid ─────────────────────── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {matches.map((match, idx) => {
                  const seeker = match.user || match.seeker;
                  const score = Math.round(
                    match.compatibility?.score ||
                      match.compatibilityScore ||
                      match.score ||
                      0,
                  );
                  const { bg, text: scoreText, label: scoreLabel } = getScoreColor(score);

                  return (
                    <div
                      key={seeker?._id || idx}
                      className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                    >
                      {/* Card top accent */}
                      <div className="h-1" style={{ backgroundColor: C.darkGreen }} />

                      <div className="p-6">
                        {/* ── Profile row ─────────────────── */}
                        <div className="flex items-start gap-4 mb-5">
                          {/* Avatar */}
                          <div className="shrink-0">
                            {seeker?.profilePhoto?.url ? (
                              <img
                                src={seeker.profilePhoto.url}
                                alt={seeker.name}
                                className="w-16 h-16 rounded-2xl object-cover"
                              />
                            ) : (
                              <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                                style={{ backgroundColor: C.darkGreen }}
                              >
                                <span className="text-2xl font-black text-white">
                                  {(seeker?.name || "?")[0].toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Name + city + badge */}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-base" style={{ color: C.darkGreen }}>
                              {seeker?.name || "Seeker"}
                            </p>
                            {seeker?.city && (
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <RiMapPin2Line style={{ color: C.btnPrimary }} />
                                {seeker.city}
                              </p>
                            )}
                            <div
                              className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={{ backgroundColor: bg, color: scoreText }}
                            >
                              <RiHeart3Line className="text-xs" />
                              {scoreLabel}
                            </div>
                          </div>

                          {/* Score circle */}
                          <ScoreCircle score={score} />
                        </div>

                        {/* ── Score Breakdown ──────────────── */}
                        {(match.compatibility?.breakdown || match.breakdown) &&
                          Object.keys(match.compatibility?.breakdown || match.breakdown || {}).length > 0 && (
                            <div className="border-t border-gray-100 pt-4 mb-4">
                              <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
                                Score Breakdown
                              </p>
                              <div className="space-y-2">
                                {Object.entries(match.compatibility?.breakdown || match.breakdown || {})
                                  .slice(0, 4)
                                  .map(([key, val]) => {
                                    const { ring } = getScoreColor(val);
                                    return (
                                      <div key={key} className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400 w-28 shrink-0 capitalize">
                                          {key.replace(/([A-Z])/g, " $1").trim()}
                                        </span>
                                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                                          <div
                                            className="h-1.5 rounded-full transition-all duration-500"
                                            style={{
                                              width: `${Math.min(100, val)}%`,
                                              backgroundColor: ring,
                                            }}
                                          />
                                        </div>
                                        <span className="text-xs font-semibold w-7 text-right" style={{ color: ring }}>
                                          {Math.round(val)}
                                        </span>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          )}

                        {/* ── Preference Tags ───────────────── */}
                        <div className="flex flex-wrap gap-1.5 mb-5">
                          {[
                            match.preference?.sleepSchedule,
                            match.preference?.occupation,
                            match.preference?.gender,
                          ]
                            .filter(Boolean)
                            .map((tag) => (
                              <span
                                key={tag}
                                className="text-xs px-2.5 py-1 rounded-full font-medium capitalize"
                                style={{
                                  backgroundColor: `${C.darkGreen}0a`,
                                  color: C.darkGreen,
                                  border: `1px solid ${C.darkGreen}20`,
                                }}
                              >
                                {formatLabel(tag)}
                              </span>
                            ))}
                        </div>

                        {/* ── Message button ────────────────── */}
                        <Link
                          to={`/seeker/messages?user=${seeker?._id || ""}&name=${encodeURIComponent(seeker?.name || "Matched Seeker")}&city=${encodeURIComponent(seeker?.city || "")}`}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 hover:opacity-90 active:scale-95"
                          style={{ backgroundColor: C.btnPrimary, color: C.white }}
                        >
                          Say Hello <RiArrowRightLine />
                        </Link>
                      </div>
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
