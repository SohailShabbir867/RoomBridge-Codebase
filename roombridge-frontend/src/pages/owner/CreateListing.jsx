import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import listingService from "../../services/listingService";
import RoleDashboardLayout from "../../components/dashboard/common/RoleDashboardLayout";
import toast from "react-hot-toast";
import {
  RiImageAddLine,
  RiCloseLine,
  RiHome4Line,
  RiMapPin2Line,
  RiMoneyDollarCircleLine,
  RiCheckboxCircleLine,
  RiLoader4Line,
  RiArrowRightLine,
  RiArrowLeftLine,
  RiCheckLine,
  RiBuildingLine,
  RiStarLine,
} from "react-icons/ri";
import { CITIES, AMENITIES } from "../../utils/constants";

document.title = "Post a Room — RoomBridge";

/* ── Design tokens ──────────────────────────────────────────── */
const DK  = "#012D1D";
const BTN = "#8E4E14";
const ACC = "#FFAB69";
const CR  = "#F7F4EF";

/* ── Form steps definition ──────────────────────────────────── */
const STEPS = [
  { id: 1, label: "Basic Info",         icon: RiHome4Line },
  { id: 2, label: "Room Details",       icon: RiStarLine },
  { id: 3, label: "Location",           icon: RiMapPin2Line },
  { id: 4, label: "Pricing & Availability",  icon: RiMoneyDollarCircleLine },
  { id: 5, label: "Photos",             icon: RiImageAddLine },
];

const ROOM_TYPES = [
  { value: "1_person",           label: "1 Person Room",       desc: "Private room for one person" },
  { value: "2_person",           label: "2 Person Room",       desc: "Shared room for two persons" },
  { value: "3_person",           label: "3 Person Room",       desc: "Shared room for three persons" },
  { value: "4_person",           label: "4 Person Room",       desc: "Shared room for four persons" },
  { value: "more_than_4_person", label: "More than 4 Persons", desc: "Large room or dormitory" },
];

const GENDER_OPTIONS = [
  { value: "any",    label: "Any" },
  { value: "male",   label: "Male Only" },
  { value: "female", label: "Female Only" },
];

/* ── Helper components ──────────────────────────────────────── */
const Label = ({ children, required }) => (
  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
    {children} {required && <span style={{ color: "#EF4444" }}>*</span>}
  </label>
);

const InputField = ({ error, className = "", ...props }) => (
  <input
    {...props}
    className={`w-full rounded-xl py-3 px-4 text-sm outline-none transition-all border
                ${error ? "border-red-400 ring-1 ring-red-400" : "border-[#E8E2D9] focus:ring-2 focus:ring-[#012D1D]/20"}
                ${className}`}
    style={{ backgroundColor: CR }}
  />
);

const SelectField = ({ error, children, ...props }) => (
  <select
    {...props}
    className={`w-full rounded-xl py-3 px-4 text-sm outline-none transition-all border
                ${error ? "border-red-400 ring-1 ring-red-400" : "border-[#E8E2D9] focus:ring-2 focus:ring-[#012D1D]/20"}`}
    style={{ backgroundColor: CR }}
  >
    {children}
  </select>
);

const ErrMsg = ({ msg }) =>
  msg ? <p className="text-red-500 text-xs mt-1 font-medium">{msg}</p> : null;

/* ── Step progress bar ──────────────────────────────────────── */
const StepBar = ({ current, total }) => (
  <div className="flex items-center gap-1.5 mb-8">
    {Array.from({ length: total }, (_, i) => {
      const n = i + 1;
      const done = n < current;
      const active = n === current;
      return (
        <React.Fragment key={n}>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all"
            style={{
              backgroundColor: done ? "#16A34A" : active ? DK : "#E8E2D9",
              color: done || active ? "#fff" : "#9CA3AF",
            }}
          >
            {done ? <RiCheckLine className="text-sm" /> : n}
          </div>
          {n < total && (
            <div
              className="flex-1 h-0.5 rounded-full transition-all"
              style={{ backgroundColor: done ? "#16A34A" : "#E8E2D9" }}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

/* ════════════════════════════════════════════════════════════ */
const CreateListing = () => {
  const navigate = useNavigate();
  const fileRef          = useRef();
  const uploadContextRef = useRef(null); // { roomType, tag, maxCount }
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors]   = useState({});

  const [form, setForm] = useState({
    title:            "",
    description:      "",
    rent:             "",
    city:             "",
    address:          "",
    area:             "",
    nearbyUniversity: "",
    roomType:         [],   // ← now an ARRAY
    genderPreference: "any",
    availableFrom:    "",
    furnished:        false,
    amenities:        [],
    rentByType:       {},   // { "1_person": 15000, "2_person": 12000, ... }
  });
  // Unified photo store: [{ file, preview, roomType, tag }]
  const [photos, setPhotos] = useState([]);

  /* ── Field handlers ─────────────────────────────────────── */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: "" }));
  };

  const handleAmenity = (a) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a)
        ? f.amenities.filter((x) => x !== a)
        : [...f.amenities, a],
    }));
  };

  /* ── Room-type multi-select toggle ─────────────────────── */
  const handleRoomTypeToggle = (value) => {
    setForm((f) => {
      const nextRoomType = f.roomType.includes(value)
        ? f.roomType.filter((v) => v !== value)
        : [...f.roomType, value];

      const nextRentByType = { ...f.rentByType };
      if (!nextRoomType.includes(value)) {
        delete nextRentByType[value];
      }

      return {
        ...f,
        roomType: nextRoomType,
        rentByType: nextRentByType,
      };
    });

    // Clean up photos for unchecked room type
    setPhotos((prev) => prev.filter((p) => p.roomType !== value));

    if (errors.roomType) setErrors((er) => ({ ...er, roomType: "" }));
  };

  /* ── Categorized photo helpers ─────────────────────────── */
  const photosBySlot = (roomType, tag) =>
    photos.filter((p) => p.roomType === roomType && p.tag === tag);

  const triggerUpload = (roomType, tag, maxCount) => {
    uploadContextRef.current = { roomType, tag, maxCount };
    fileRef.current.click();
  };

  const handlePhotos = (e) => {
    const ctx = uploadContextRef.current;
    if (!ctx) return;
    const { roomType, tag, maxCount } = ctx;
    const existing = photosBySlot(roomType, tag);
    const remaining = maxCount - existing.length;
    const files = Array.from(e.target.files);
    const toAdd = files.slice(0, remaining);
    if (files.some((f) => f.size > 10 * 1024 * 1024)) {
      toast.error("Image size should be less than 10MB");
      e.target.value = "";
      return;
    }
    if (files.length > remaining)
      toast.error(`Max ${maxCount} ${tag} photo(s) for this section. Adding ${remaining} only.`);
    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setPhotos((p) => [...p, { file, preview: ev.target.result, roomType, tag }]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
    uploadContextRef.current = null;
  };

  const removePhoto = (roomType, tag, slotIdx) => {
    setPhotos((prev) => {
      const matching = prev.filter((p) => p.roomType === roomType && p.tag === tag);
      const toRemove = matching[slotIdx];
      return prev.filter((p) => p !== toRemove);
    });
  };

  /* ── Per-step validation ────────────────────────────────── */
  const validateStep = (s) => {
    const e = {};
    if (s === 1) {
      if (!form.title.trim() || form.title.length < 10)
        e.title = "Title must be at least 10 characters";
      if (!form.description.trim() || form.description.length < 50)
        e.description = "Description must be at least 50 characters";
    }
    if (s === 2) {
      if (form.roomType.length === 0) e.roomType = "Select at least one room type";
    }
    if (s === 3) {
      if (!form.city)             e.city    = "City is required";
      if (!form.address.trim())   e.address = "Address is required";
    }
    if (s === 4) {
      // Every selected room type must have a valid rent price
      const LABELS = ROOM_TYPES.reduce((acc, r) => { acc[r.value] = r.label; return acc; }, {});
      form.roomType.forEach((rt) => {
        const val = Number(form.rentByType?.[rt]);
        if (!form.rentByType?.[rt] || isNaN(val) || val < 1000)
          e[`rent_${rt}`] = `${LABELS[rt]}: min PKR 1,000`;
        else if (val > 500000)
          e[`rent_${rt}`] = `${LABELS[rt]}: max PKR 500,000`;
      });
      if (form.roomType.length === 0) e.rent = "Select at least one room type first (Step 2)";
      if (!form.availableFrom) e.availableFrom = "Available from date is required";
    }
    if (s === 5) {
      // Every selected room type must have at least one room photo
      const missing = form.roomType.filter(
        (rt) => !photos.some((p) => p.roomType === rt && p.tag === "room")
      );
      if (photos.length === 0 || missing.length > 0) {
        const labels = ROOM_TYPES.reduce((acc, r) => { acc[r.value] = r.label; return acc; }, {});
        e.photos = missing.length > 0
          ? `Add at least one room photo for: ${missing.map((v) => labels[v] || v).join(", ")}`
          : "At least one photo is required";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateAll = () => {
    const e = {};

    // Step 1
    if (!form.title.trim() || form.title.length < 10)
      e.title = "Title must be at least 10 characters";
    if (!form.description.trim() || form.description.length < 50)
      e.description = "Description must be at least 50 characters";

    // Step 2
    if (form.roomType.length === 0) {
      e.roomType = "Select at least one room type";
    }

    // Step 3
    if (!form.city) e.city = "City is required";
    if (!form.address.trim()) e.address = "Address is required";

    // Step 4
    if (form.roomType.length > 0) {
      const LABELS = ROOM_TYPES.reduce((acc, r) => { acc[r.value] = r.label; return acc; }, {});
      form.roomType.forEach((rt) => {
        const val = Number(form.rentByType?.[rt]);
        if (!form.rentByType?.[rt] || isNaN(val) || val < 1000)
          e[`rent_${rt}`] = `${LABELS[rt]}: min PKR 1,000`;
        else if (val > 500000)
          e[`rent_${rt}`] = `${LABELS[rt]}: max PKR 500,000`;
      });
      if (!form.availableFrom) e.availableFrom = "Available from date is required";
    } else {
      e.rent = "Select at least one room type first (Step 2)";
    }

    // Step 5
    if (form.roomType.length > 0) {
      const missing = form.roomType.filter(
        (rt) => !photos.some((p) => p.roomType === rt && p.tag === "room")
      );
      if (photos.length === 0 || missing.length > 0) {
        const labels = ROOM_TYPES.reduce((acc, r) => { acc[r.value] = r.label; return acc; }, {});
        e.photos = missing.length > 0
          ? `Add at least one room photo for: ${missing.map((v) => labels[v] || v).join(", ")}`
          : "At least one photo is required";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, STEPS.length));
  };
  const goPrev = () => setStep((s) => Math.max(s - 1, 1));

  /* ── Submit ─────────────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!validateAll()) {
      toast.error("Please fill in all required fields and upload correct photos.");
      return;
    }
    try {
      setLoading(true);
      const fd = new FormData();
      const { amenities, roomType, rentByType, ...rest } = form;
      // Send remaining scalar fields (excludes rent — computed below)
      const { availableFrom, furnished, genderPreference, ...textFields } = rest;
      Object.entries(textFields).forEach(([k, v]) => { if (v !== "") fd.append(k, v); });
      fd.append("availableFrom", availableFrom);
      fd.append("furnished", furnished);
      fd.append("genderPreference", genderPreference);
      amenities.forEach((a) => fd.append("amenities", a));
      // Send each selected room type as a separate FormData entry
      roomType.forEach((rt) => fd.append("roomType", rt));
      // Compute minimum rent for display/search and send rentByType as JSON
      const rentVals = roomType.map((rt) => Number(rentByType[rt])).filter((n) => n >= 1000);
      const minRent = rentVals.length > 0 ? Math.min(...rentVals) : 1000;
      fd.append("rent", minRent);
      fd.append("rentByType", JSON.stringify(rentByType));
      // Send each photo file + its metadata
      photos.forEach((p) => {
        fd.append("photos", p.file);
        fd.append("photoMetadata", JSON.stringify({ roomType: p.roomType, tag: p.tag }));
      });
      await listingService.createListing(fd);
      setSuccess(true);
      toast.success("Listing submitted for review! 🎉");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create listing. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setStep(1);
    setForm({
      title: "", description: "", rent: "", city: "", address: "", area: "",
      nearbyUniversity: "", roomType: [], genderPreference: "any",
      availableFrom: "", furnished: false, amenities: [], rentByType: {},
    });
    setPhotos([]); setErrors({});
  };

  /* ── Success screen ─────────────────────────────────────── */
  if (success)
    return (
      <RoleDashboardLayout role="owner" title="Post a Room">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div
            className="bg-white rounded-2xl border shadow-sm p-10 text-center max-w-md w-full"
            style={{ borderColor: "#E8E2D9" }}
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: "#D1FAE5" }}
            >
              <RiCheckboxCircleLine className="text-5xl text-green-600" />
            </div>
            <h2 className="text-2xl font-extrabold mb-2" style={{ color: DK }}>
              Submitted for Review!
            </h2>
            <p className="text-gray-400 text-sm mb-7">
              Your listing is pending admin approval. You'll be notified once it's live.
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                to="/owner/listings"
                className="px-5 py-2.5 rounded-xl border text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
                style={{ borderColor: "#E8E2D9" }}
              >
                My Listings
              </Link>
              <button
                onClick={resetForm}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all"
                style={{ backgroundColor: BTN }}
              >
                Post Another
              </button>
            </div>
          </div>
        </div>
      </RoleDashboardLayout>
    );

  /* ── Main form ──────────────────────────────────────────── */
  return (
    <RoleDashboardLayout
      role="owner"
      title="Post a Room"
      subtitle="List your hostel / room on RoomBridge for free"
    >
      <div className="max-w-2xl mx-auto">

        {/* Step progress */}
        <StepBar current={step} total={STEPS.length} />

        {/* Card wrapper */}
        <div
          className="bg-white rounded-2xl border shadow-sm overflow-hidden"
          style={{ borderColor: "#E8E2D9" }}
        >
          {/* Card header */}
          <div
            className="px-6 py-5 border-b"
            style={{ borderColor: "#F3EFE9", backgroundColor: `${DK}08` }}
          >
            <div className="flex items-center gap-3">
              {React.createElement(STEPS[step - 1].icon, {
                className: "text-xl",
                style: { color: ACC },
              })}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Step {step} of {STEPS.length}
                </p>
                <h2 className="font-extrabold text-base" style={{ color: DK }}>
                  {STEPS[step - 1].label}
                </h2>
              </div>
            </div>
          </div>

          {/* Card body */}
          <div className="px-6 py-6 space-y-5">

            {/* ── STEP 1: Basic Info ─────────────────────────── */}
            {step === 1 && (
              <>
                <div>
                  <Label required>Listing Title</Label>
                  <InputField
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. Cozy Single Room in DHA Phase 6"
                    maxLength={100}
                    error={errors.title}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <ErrMsg msg={errors.title} />
                    <span className="text-xs text-gray-400 ml-auto">{form.title.length}/100</span>
                  </div>
                </div>

                <div>
                  <Label required>Description</Label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={6}
                    maxLength={2000}
                    placeholder="Describe your room in detail — size, floor, nearby facilities, house rules..."
                    className={`w-full rounded-xl py-3 px-4 text-sm outline-none transition-all border resize-none
                                ${errors.description ? "border-red-400 ring-1 ring-red-400" : "border-[#E8E2D9] focus:ring-2 focus:ring-[#012D1D]/20"}`}
                    style={{ backgroundColor: CR }}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <ErrMsg msg={errors.description} />
                    <span className="text-xs text-gray-400 ml-auto">{form.description.length}/2000</span>
                  </div>
                </div>
              </>
            )}

            {/* ── STEP 2: Room Details ───────────────────────── */}
            {step === 2 && (
              <>
                <div>
                  <Label required>Room Type (select all that apply)</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                    {ROOM_TYPES.map(({ value, label, desc }) => {
                      const sel = form.roomType.includes(value);
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleRoomTypeToggle(value)}
                          className="text-left p-4 rounded-xl border transition-all"
                          style={{
                            borderColor: sel ? DK : "#E8E2D9",
                            backgroundColor: sel ? `${DK}08` : "#fff",
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                              style={{
                                borderColor: sel ? DK : "#D1D5DB",
                                backgroundColor: sel ? DK : "transparent",
                              }}
                            >
                              {sel && <RiCheckLine className="text-white text-[11px]" />}
                            </div>
                            <div>
                              <p className="font-bold text-sm" style={{ color: sel ? DK : "#374151" }}>{label}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <ErrMsg msg={errors.roomType} />
                </div>

                <div>
                  <Label>Gender Preference</Label>
                  <div className="flex gap-2 mt-1">
                    {GENDER_OPTIONS.map(({ value, label }) => {
                      const sel = form.genderPreference === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, genderPreference: value }))}
                          className="flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all"
                          style={{
                            borderColor:     sel ? DK : "#E8E2D9",
                            backgroundColor: sel ? DK : "#fff",
                            color:           sel ? "#fff" : "#6B7280",
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label
                  className="flex items-center gap-3 p-4 rounded-xl border cursor-pointer select-none transition-all"
                  style={{
                    borderColor:     form.furnished ? DK : "#E8E2D9",
                    backgroundColor: form.furnished ? `${DK}08` : CR,
                  }}
                >
                  <input
                    type="checkbox"
                    name="furnished"
                    checked={form.furnished}
                    onChange={handleChange}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: DK }}
                  />
                  <div>
                    <p className="font-bold text-sm" style={{ color: DK }}>Furnished Room</p>
                    <p className="text-xs text-gray-400">Beds, tables, wardrobes included</p>
                  </div>
                </label>

                <div>
                  <Label>Amenities & Features</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                    {AMENITIES.map((a) => {
                      const sel = form.amenities.includes(a);
                      return (
                        <label
                          key={a}
                          className="flex items-center gap-2 p-3 rounded-xl border cursor-pointer text-sm select-none transition-all"
                          style={{
                            borderColor:     sel ? DK : "#E8E2D9",
                            backgroundColor: sel ? `${DK}08` : "#fff",
                            color:           sel ? DK : "#6B7280",
                            fontWeight:      sel ? 600 : 400,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={sel}
                            onChange={() => handleAmenity(a)}
                            className="shrink-0"
                            style={{ accentColor: DK }}
                          />
                          {a}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* ── STEP 3: Location ───────────────────────────── */}
            {step === 3 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label required>City</Label>
                    <SelectField
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      error={errors.city}
                    >
                      <option value="">Select city</option>
                      {CITIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </SelectField>
                    <ErrMsg msg={errors.city} />
                  </div>
                  <div>
                    <Label>Area / Sector</Label>
                    <InputField
                      name="area"
                      value={form.area}
                      onChange={handleChange}
                      placeholder="e.g. DHA Phase 6"
                    />
                  </div>
                </div>

                <div>
                  <Label required>Full Address</Label>
                  <InputField
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="e.g. House 123, Street 5, DHA Phase 6, Karachi"
                    error={errors.address}
                  />
                  <ErrMsg msg={errors.address} />
                </div>

                <div>
                  <Label>Nearby University</Label>
                  <div className="relative">
                    <RiBuildingLine
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <InputField
                      name="nearbyUniversity"
                      value={form.nearbyUniversity}
                      onChange={handleChange}
                      placeholder="e.g. FAST NUCES, UET Lahore"
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Optional — helps students find accommodation near their campus.
                  </p>
                </div>
              </>
            )}

            {/* ── STEP 4: Pricing & Availability ────────────── */}
            {step === 4 && (
              <>
                {/* Per-type rent inputs */}
                {form.roomType.length === 0 ? (
                  <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-3">
                    ⚠️ Please go back to Step 2 and select at least one room type first.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                      Monthly Rent per Room Type (PKR) *
                    </p>
                    {form.roomType.map((rt) => {
                      const rtInfo = ROOM_TYPES.find((r) => r.value === rt);
                      const errKey = `rent_${rt}`;
                      return (
                        <div
                          key={rt}
                          className="rounded-xl border overflow-hidden"
                          style={{ borderColor: errors[errKey] ? "#EF4444" : "#E8E2D9" }}
                        >
                          <div
                            className="px-4 py-2.5 border-b flex items-center justify-between"
                            style={{ borderColor: "#F3EFE9", backgroundColor: `${DK}08` }}
                          >
                            <p className="font-bold text-sm" style={{ color: DK }}>
                              👤 {rtInfo?.label || rt}
                            </p>
                            <p className="text-xs text-gray-400">{rtInfo?.desc}</p>
                          </div>
                          <div className="px-4 py-3">
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 pointer-events-none">
                                ₨
                              </span>
                              <InputField
                                type="number"
                                min="1000"
                                max="500000"
                                value={form.rentByType?.[rt] || ""}
                                onChange={(e) =>
                                  setForm((f) => ({
                                    ...f,
                                    rentByType: { ...f.rentByType, [rt]: e.target.value },
                                  }))
                                }
                                placeholder="e.g. 15000"
                                error={!!errors[errKey]}
                                className="pl-9"
                              />
                            </div>
                            {errors[errKey] && <ErrMsg msg={errors[errKey]} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {errors.rent && <ErrMsg msg={errors.rent} />}

                <div>
                  <Label required>Available From</Label>
                  <InputField
                    name="availableFrom"
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={form.availableFrom}
                    onChange={handleChange}
                    error={errors.availableFrom}
                  />
                  <ErrMsg msg={errors.availableFrom} />
                </div>

                {/* Rent summary card */}
                {form.roomType.some((rt) => Number(form.rentByType?.[rt]) >= 1000) && (
                  <div
                    className="rounded-xl p-4 border"
                    style={{ backgroundColor: `${DK}08`, borderColor: `${DK}20` }}
                  >
                    <p className="text-xs text-gray-400 font-medium mb-2">Rent Summary</p>
                    <div className="space-y-1.5">
                      {form.roomType.map((rt) => {
                        const val = Number(form.rentByType?.[rt]);
                        if (!val || val < 1000) return null;
                        const rtLabel = ROOM_TYPES.find((r) => r.value === rt)?.label || rt;
                        return (
                          <div key={rt} className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">{rtLabel}</span>
                            <span className="font-extrabold text-lg" style={{ color: DK }}>
                              PKR {val.toLocaleString()}
                              <span className="text-xs font-medium text-gray-400">/mo</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {form.availableFrom && (
                      <p className="text-xs text-gray-400 mt-3 border-t pt-2" style={{ borderColor: `${DK}20` }}>
                        Available from {new Date(form.availableFrom).toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ── STEP 5: Photos ─────────────────────────────── */}
            {step === 5 && (
              <>
                <p className="text-sm text-gray-400 mb-4">
                  Upload photos for each room type you selected.
                  Each section allows <strong>2 room photos</strong> and <strong>1 washroom photo</strong>.
                </p>

                {/* Hidden file input — shared across all slots */}
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotos}
                />

                {form.roomType.length === 0 && (
                  <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-3">
                    ⚠️ Go back to Step 2 and select at least one room type first.
                  </p>
                )}

                {form.roomType.map((rt) => {
                  const rtLabel = ROOM_TYPES.find((r) => r.value === rt)?.label || rt;
                  const roomPhotos = photosBySlot(rt, "room");
                  const washPhotos = photosBySlot(rt, "washroom");
                  return (
                    <div
                      key={rt}
                      className="mb-6 border rounded-xl overflow-hidden"
                      style={{ borderColor: "#E8E2D9" }}
                    >
                      {/* Section header */}
                      <div
                        className="px-4 py-3 border-b"
                        style={{ borderColor: "#F3EFE9", backgroundColor: `${DK}08` }}
                      >
                        <p className="font-bold text-sm" style={{ color: DK }}>
                          📷 {rtLabel}
                        </p>
                      </div>

                      <div className="p-4 space-y-4">
                        {/* Room photos (max 2) */}
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Room Photos <span className="text-gray-400 font-normal">(max 2)</span>
                          </p>
                          <div className="flex gap-3">
                            {roomPhotos.map((p, i) => (
                              <div
                                key={i}
                                className="relative w-28 h-28 rounded-xl overflow-hidden border"
                                style={{ borderColor: "#E8E2D9" }}
                              >
                                <img src={p.preview} alt="" className="w-full h-full object-cover" />
                                {i === 0 && (
                                  <span
                                    className="absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                                    style={{ backgroundColor: DK }}
                                  >
                                    Cover
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removePhoto(rt, "room", i)}
                                  aria-label="Remove"
                                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                                >
                                  <RiCloseLine className="text-white text-[10px]" />
                                </button>
                              </div>
                            ))}
                            {roomPhotos.length < 2 && (
                              <button
                                type="button"
                                onClick={() => triggerUpload(rt, "room", 2)}
                                className="w-28 h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center
                                           cursor-pointer transition-all hover:border-opacity-70"
                                style={{ borderColor: `${DK}40`, backgroundColor: `${DK}05` }}
                              >
                                <RiImageAddLine className="text-xl mb-0.5" style={{ color: DK }} />
                                <span className="text-[10px] font-semibold" style={{ color: DK }}>
                                  Add ({roomPhotos.length}/2)
                                </span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Washroom photo (max 1) */}
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Washroom Photo <span className="text-gray-400 font-normal">(max 1)</span>
                          </p>
                          <div className="flex gap-3">
                            {washPhotos.map((p, i) => (
                              <div
                                key={i}
                                className="relative w-28 h-28 rounded-xl overflow-hidden border"
                                style={{ borderColor: "#E8E2D9" }}
                              >
                                <img src={p.preview} alt="" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => removePhoto(rt, "washroom", i)}
                                  aria-label="Remove"
                                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                                >
                                  <RiCloseLine className="text-white text-[10px]" />
                                </button>
                              </div>
                            ))}
                            {washPhotos.length < 1 && (
                              <button
                                type="button"
                                onClick={() => triggerUpload(rt, "washroom", 1)}
                                className="w-28 h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center
                                           cursor-pointer transition-all hover:border-opacity-70"
                                style={{ borderColor: `${ACC}80`, backgroundColor: `${ACC}10` }}
                              >
                                <RiImageAddLine className="text-xl mb-0.5" style={{ color: BTN }} />
                                <span className="text-[10px] font-semibold" style={{ color: BTN }}>
                                  Washroom
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <ErrMsg msg={errors.photos} />

                {photos.length > 0 && (
                  <p className="text-xs text-gray-400 mt-2">
                    ✓ {photos.length} photo{photos.length !== 1 ? "s" : ""} selected across all room types.
                  </p>
                )}
              </>
            )}

          </div>{/* end card body */}

          {/* Card footer — navigation */}
          <div
            className="px-6 py-4 border-t flex items-center justify-between gap-3"
            style={{ borderColor: "#F3EFE9", backgroundColor: "#FAFAF8" }}
          >
            {step > 1 ? (
              <button
                type="button"
                onClick={goPrev}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold text-gray-600
                           hover:bg-gray-50 transition-all"
                style={{ borderColor: "#E8E2D9" }}
              >
                <RiArrowLeftLine /> Back
              </button>
            ) : (
              <Link
                to="/owner/dashboard"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold text-gray-600
                           hover:bg-gray-50 transition-all"
                style={{ borderColor: "#E8E2D9" }}
              >
                Cancel
              </Link>
            )}

            {step < STEPS.length ? (
              <button
                type="button"
                onClick={goNext}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white
                           hover:opacity-90 active:scale-95 transition-all shadow-sm"
                style={{ backgroundColor: DK }}
              >
                Next <RiArrowRightLine />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white
                           hover:opacity-90 disabled:opacity-60 active:scale-95 transition-all shadow-sm"
                style={{ backgroundColor: BTN }}
              >
                {loading ? (
                  <><RiLoader4Line className="animate-spin" /> Submitting…</>
                ) : (
                  <><RiCheckboxCircleLine /> Submit Listing</>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Step labels below */}
        <div className="flex justify-between mt-3 px-1">
          {STEPS.map(({ id, label }) => (
            <p
              key={id}
              className="text-[10px] font-semibold text-center"
              style={{ color: id === step ? DK : "#9CA3AF", flex: 1 }}
            >
              {label}
            </p>
          ))}
        </div>

      </div>
    </RoleDashboardLayout>
  );
};

export default CreateListing;
