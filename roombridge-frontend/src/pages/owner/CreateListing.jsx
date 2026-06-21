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
  { id: 4, label: "Pricing & Pricing",  icon: RiMoneyDollarCircleLine },
  { id: 5, label: "Photos",             icon: RiImageAddLine },
];

const ROOM_TYPES = [
  { value: "single",    label: "Single Room",    desc: "Private room for one person" },
  { value: "shared",    label: "Shared Room",    desc: "Shared space with others" },
  { value: "apartment", label: "Full Apartment", desc: "Entire apartment" },
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
  const fileRef  = useRef();
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
    roomType:         "",
    genderPreference: "any",
    availableFrom:    "",
    furnished:        false,
    amenities:        [],
  });
  const [photos, setPhotos]   = useState([]);
  const [previews, setPreviews] = useState([]);

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

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files);
    const remaining = 6 - photos.length;
    const toAdd = files.slice(0, remaining);
    if (files.length > remaining) toast.error(`Max 6 photos. Only adding ${remaining}.`);
    setPhotos((p) => [...p, ...toAdd]);
    toAdd.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviews((p) => [...p, ev.target.result]);
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  };

  const removePhoto = (i) => {
    setPhotos((p) => p.filter((_, idx) => idx !== i));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
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
      if (!form.roomType) e.roomType = "Room type is required";
    }
    if (s === 3) {
      if (!form.city)             e.city    = "City is required";
      if (!form.address.trim())   e.address = "Address is required";
    }
    if (s === 4) {
      if (!form.rent || Number(form.rent) < 1000)
        e.rent = "Rent must be at least PKR 1,000";
      if (!form.availableFrom)
        e.availableFrom = "Available from date is required";
    }
    if (s === 5) {
      if (photos.length === 0) e.photos = "At least one photo is required";
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
    if (!validateStep(5)) return;
    try {
      setLoading(true);
      const fd = new FormData();
      const { amenities, ...rest } = form;
      Object.entries(rest).forEach(([k, v]) => fd.append(k, v));
      amenities.forEach((a) => fd.append("amenities", a));
      photos.forEach((f) => fd.append("photos", f));
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
      nearbyUniversity: "", roomType: "", genderPreference: "any",
      availableFrom: "", furnished: false, amenities: [],
    });
    setPhotos([]); setPreviews([]); setErrors({});
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
                  <Label required>Room Type</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
                    {ROOM_TYPES.map(({ value, label, desc }) => {
                      const sel = form.roomType === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            setForm((f) => ({ ...f, roomType: value }));
                            if (errors.roomType) setErrors((e) => ({ ...e, roomType: "" }));
                          }}
                          className="text-left p-4 rounded-xl border transition-all"
                          style={{
                            borderColor: sel ? DK : "#E8E2D9",
                            backgroundColor: sel ? `${DK}08` : "#fff",
                          }}
                        >
                          <p className="font-bold text-sm" style={{ color: sel ? DK : "#374151" }}>
                            {label}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                          {sel && (
                            <div
                              className="mt-2 w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: DK }}
                            >
                              <RiCheckLine className="text-white text-xs" />
                            </div>
                          )}
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
                <div>
                  <Label required>Monthly Rent (PKR)</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 pointer-events-none">
                      ₨
                    </span>
                    <InputField
                      name="rent"
                      type="number"
                      min="1000"
                      max="500000"
                      value={form.rent}
                      onChange={handleChange}
                      placeholder="15000"
                      error={errors.rent}
                      className="pl-9"
                    />
                  </div>
                  <ErrMsg msg={errors.rent} />
                </div>

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
                {form.rent && Number(form.rent) >= 1000 && (
                  <div
                    className="rounded-xl p-4 border"
                    style={{ backgroundColor: `${DK}08`, borderColor: `${DK}20` }}
                  >
                    <p className="text-xs text-gray-400 font-medium mb-1">Rent Summary</p>
                    <p className="text-2xl font-extrabold" style={{ color: DK }}>
                      PKR {Number(form.rent).toLocaleString()}
                      <span className="text-sm font-medium text-gray-400">/month</span>
                    </p>
                    {form.availableFrom && (
                      <p className="text-xs text-gray-400 mt-1">
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
                <div>
                  <p className="text-sm text-gray-400 mb-4">
                    Upload up to <strong>6 photos</strong>. The first photo will be the cover image shown in listings.
                  </p>

                  {/* Photo grid */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {previews.map((src, i) => (
                      <div
                        key={i}
                        className="relative aspect-square rounded-xl overflow-hidden border"
                        style={{ borderColor: "#E8E2D9" }}
                      >
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          aria-label="Remove photo"
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-md"
                        >
                          <RiCloseLine className="text-white text-xs" />
                        </button>
                        {i === 0 && (
                          <span
                            className="absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: DK }}
                          >
                            Cover
                          </span>
                        )}
                      </div>
                    ))}

                    {/* Add photo slot */}
                    {photos.length < 6 && (
                      <button
                        type="button"
                        onClick={() => fileRef.current.click()}
                        className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center
                                   cursor-pointer transition-all hover:border-opacity-60"
                        style={{ borderColor: `${DK}40`, backgroundColor: `${DK}05` }}
                      >
                        <RiImageAddLine className="text-2xl mb-1" style={{ color: DK }} />
                        <span className="text-xs font-semibold" style={{ color: DK }}>
                          Add Photo
                        </span>
                        <span className="text-[10px] text-gray-400 mt-0.5">
                          {photos.length}/6
                        </span>
                      </button>
                    )}
                  </div>

                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotos}
                  />
                  <ErrMsg msg={errors.photos} />

                  {photos.length > 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      ✓ {photos.length} photo{photos.length !== 1 ? "s" : ""} selected. Drag the first slot to change the cover.
                    </p>
                  )}
                </div>
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
