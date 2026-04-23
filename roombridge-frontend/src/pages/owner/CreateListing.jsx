import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import listingService from "../../services/listingService";
import toast from "react-hot-toast";
import {
  RiArrowLeftLine,
  RiImageAddLine,
  RiCloseLine,
  RiHome4Line,
  RiMapPin2Line,
  RiMoneyDollarCircleLine,
  RiCheckboxCircleLine,
  RiLoader4Line,
} from "react-icons/ri";
import { CITIES, AMENITIES } from "../../utils/constants";

document.title = "Post a Room — RoomBridge";

/*
  Room type values must match the Listing.model.js enum exactly:
  'single_room' | 'shared_room' | 'full_apartment' | 'hostel'
  Old values 'single', 'shared', 'apartment' were rejected by validator.
*/
const ROOM_TYPES = [
  { value: "single", label: "Single Room" },
  { value: "shared", label: "Shared Room" },
  { value: "apartment", label: "Full Apartment" },
];

const CreateListing = () => {
  const fileRef = useRef();

  const [form, setForm] = useState({
    title: "",
    description: "",
    rent: "",
    city: "",
    address: "",
    area: "",
    roomType: "",
    genderPreference: "any",
    availableFrom: "",
    furnished: false,
    amenities: [],
  });
  const [photos, setPhotos] = useState([]); // File objects
  const [previews, setPreviews] = useState([]); // Data URLs
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: "" }));
  };

  /*
    The old code used field name 'features' and sent:
      JSON.stringify(amenities.map(name => ({ name, available: true })))
    Backend Listing.model.js amenities field is a plain string array.
    Fixed: use field name 'amenities' and send the string values directly.
  */
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
    if (files.length > remaining)
      toast.error(`Max 6 photos. Only adding ${remaining}.`);
    setPhotos((p) => [...p, ...toAdd]);
    toAdd.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviews((p) => [...p, ev.target.result]);
      reader.readAsDataURL(f);
    });
    /* Reset file input so the same file can be picked again */
    e.target.value = "";
  };

  const removePhoto = (i) => {
    setPhotos((p) => p.filter((_, idx) => idx !== i));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim() || form.title.length < 10)
      e.title = "Title must be at least 10 characters";
    if (!form.description.trim() || form.description.length < 50)
      e.description = "Description must be at least 50 characters";
    if (!form.rent || Number(form.rent) < 1000)
      e.rent = "Rent must be at least PKR 1,000";
    if (!form.city) e.city = "City is required";
    if (!form.address.trim()) e.address = "Address is required";
    if (!form.roomType) e.roomType = "Room type is required";
    if (!form.availableFrom)
      e.availableFrom = "Available from date is required";
    if (photos.length === 0) e.photos = "At least one photo is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the errors below.");
      return;
    }

    try {
      setLoading(true);
      const fd = new FormData();

      /*
        amenities (formerly 'features') must be appended as individual
        string values, not as a JSON blob of objects. The backend expects:
          amenities: ['WiFi', 'AC', 'Parking']  (plain string array from req.body)
        FormData sends repeated keys as an array when parsed by express:
          fd.append('amenities', 'WiFi')
          fd.append('amenities', 'AC')
        Backend Listing model: amenities: [{ type: String }]
      */
      const { amenities, ...rest } = form;
      Object.entries(rest).forEach(([k, v]) => fd.append(k, v));
      amenities.forEach((a) => fd.append("amenities", a));
      photos.forEach((f) => fd.append("photos", f));

      await listingService.createListing(fd);
      setSuccess(true);
      toast.success("Listing submitted for review! 🎉");
    } catch (err) {
      /* err.message is undefined on axios errors */
      toast.error(
        err.response?.data?.message || "Failed to create listing. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setForm({
      title: "",
      description: "",
      rent: "",
      city: "",
      address: "",
      area: "",
      roomType: "",
      genderPreference: "any",
      availableFrom: "",
      furnished: false,
      amenities: [],
    });
    setPhotos([]);
    setPreviews([]);
    setErrors({});
  };

  if (success)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="bg-white rounded-card shadow-card border border-border p-10 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <RiCheckboxCircleLine className="text-success text-5xl" />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2">
            Submitted for Review!
          </h2>
          <p className="text-text-secondary text-sm mb-6">
            Your listing is pending admin approval. You'll be notified once it's
            live.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/owner/listings" className="btn-secondary">
              My Listings
            </Link>
            <button onClick={resetForm} className="btn-primary">
              Post Another
            </button>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-border px-6 py-4 flex items-center gap-4">
        <Link
          to="/owner/dashboard"
          className="p-2 rounded-lg hover:bg-background text-text-secondary hover:text-primary transition-colors"
        >
          <RiArrowLeftLine className="text-xl" />
        </Link>
        <div>
          <h1 className="font-bold text-primary">Post a Room</h1>
          <p className="text-text-secondary text-xs">
            Fill in details to list your room
          </p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          {/* Photos */}
          <div className="bg-white rounded-card border border-border shadow-card p-6">
            <h2 className="font-semibold text-primary mb-1 flex items-center gap-2">
              <RiImageAddLine className="text-secondary" /> Photos
            </h2>
            <p className="text-xs text-text-secondary mb-4">
              Upload up to 6 photos. First photo will be the cover.
            </p>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-3">
              {previews.map((src, i) => (
                <div
                  key={i}
                  className="relative aspect-square rounded-lg overflow-hidden border border-border"
                >
                  <img
                    src={src}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    aria-label="Remove photo"
                    className="absolute top-1 right-1 w-5 h-5 bg-error rounded-full flex items-center justify-center"
                  >
                    <RiCloseLine className="text-white text-xs" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 text-[9px] bg-primary text-white px-1 rounded">
                      Cover
                    </span>
                  )}
                </div>
              ))}
              {photos.length < 6 && (
                <button
                  type="button"
                  onClick={() => fileRef.current.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-border
                                   flex flex-col items-center justify-center text-text-secondary
                                   hover:border-secondary hover:text-secondary transition-colors cursor-pointer"
                >
                  <RiImageAddLine className="text-xl mb-1" />
                  <span className="text-xs">Add</span>
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
            {errors.photos && (
              <p className="text-xs text-error mt-1">{errors.photos}</p>
            )}
          </div>

          {/* Basic Info */}
          <div className="bg-white rounded-card border border-border shadow-card p-6 space-y-4">
            <h2 className="font-semibold text-primary flex items-center gap-2">
              <RiHome4Line className="text-secondary" /> Basic Information
            </h2>

            <div>
              <label className="label" htmlFor="cl-title">
                Listing Title *
              </label>
              <input
                id="cl-title"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Cozy Single Room in DHA Phase 6"
                className={`input ${errors.title ? "input-error" : ""}`}
              />
              <div className="flex items-center justify-between mt-1">
                {errors.title && <p className="error-msg">{errors.title}</p>}
                <span className="text-xs text-text-secondary ml-auto">
                  {form.title.length}/100
                </span>
              </div>
            </div>

            <div>
              <label className="label" htmlFor="cl-desc">
                Description *
              </label>
              <textarea
                id="cl-desc"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                placeholder="Describe your room in detail — size, floor, nearby facilities..."
                className={`input resize-none ${errors.description ? "input-error" : ""}`}
              />
              <div className="flex items-center justify-between mt-1">
                {errors.description && (
                  <p className="error-msg">{errors.description}</p>
                )}
                <span className="text-xs text-text-secondary ml-auto">
                  {form.description.length}/2000
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="cl-roomType">
                  Room Type *
                </label>
                {/*
                  Values now match the backend Listing model enum:
                  single_room | shared_room | full_apartment | hostel
                */}
                <select
                  id="cl-roomType"
                  name="roomType"
                  value={form.roomType}
                  onChange={handleChange}
                  className={`input ${errors.roomType ? "input-error" : ""}`}
                >
                  <option value="">Select type</option>
                  {ROOM_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                {errors.roomType && (
                  <p className="error-msg">{errors.roomType}</p>
                )}
              </div>
              <div>
                <label className="label" htmlFor="cl-gender">
                  Gender Preference
                </label>
                <select
                  id="cl-gender"
                  name="genderPreference"
                  value={form.genderPreference}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="any">Any</option>
                  <option value="male">Male only</option>
                  <option value="female">Female only</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-3 p-3 bg-background rounded-input border border-border cursor-pointer select-none">
              <input
                type="checkbox"
                id="cl-furnished"
                name="furnished"
                checked={form.furnished}
                onChange={handleChange}
                className="accent-primary w-4 h-4"
              />
              <span className="text-sm text-primary">Furnished room</span>
            </label>
          </div>

          {/* Pricing & Date */}
          <div className="bg-white rounded-card border border-border shadow-card p-6 space-y-4">
            <h2 className="font-semibold text-primary flex items-center gap-2">
              <RiMoneyDollarCircleLine className="text-secondary" /> Pricing &
              Availability
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="cl-rent">
                  Monthly Rent (PKR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-text-secondary font-medium pointer-events-none">
                    ₨
                  </span>
                  <input
                    id="cl-rent"
                    name="rent"
                    type="number"
                    min="1000"
                    max="500000"
                    value={form.rent}
                    onChange={handleChange}
                    placeholder="15000"
                    className={`input pl-8 ${errors.rent ? "input-error" : ""}`}
                  />
                </div>
                {errors.rent && <p className="error-msg">{errors.rent}</p>}
              </div>
              <div>
                <label className="label" htmlFor="cl-available">
                  Available From *
                </label>
                <input
                  id="cl-available"
                  name="availableFrom"
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={form.availableFrom}
                  onChange={handleChange}
                  className={`input ${errors.availableFrom ? "input-error" : ""}`}
                />
                {errors.availableFrom && (
                  <p className="error-msg">{errors.availableFrom}</p>
                )}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-card border border-border shadow-card p-6 space-y-4">
            <h2 className="font-semibold text-primary flex items-center gap-2">
              <RiMapPin2Line className="text-secondary" /> Location
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="cl-city">
                  City *
                </label>
                <select
                  id="cl-city"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className={`input ${errors.city ? "input-error" : ""}`}
                >
                  <option value="">Select city</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {errors.city && <p className="error-msg">{errors.city}</p>}
              </div>
              <div>
                <label className="label" htmlFor="cl-area">
                  Area / Sector
                </label>
                <input
                  id="cl-area"
                  name="area"
                  value={form.area}
                  onChange={handleChange}
                  placeholder="e.g. DHA Phase 6"
                  className="input"
                />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="cl-address">
                Full Address *
              </label>
              <input
                id="cl-address"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="e.g. House 123, Street 5, DHA Phase 6"
                className={`input ${errors.address ? "input-error" : ""}`}
              />
              {errors.address && <p className="error-msg">{errors.address}</p>}
            </div>
          </div>

          {/* Amenities
            Was called 'features' and sent as JSON objects [{name, available}].
            Now correctly uses 'amenities' with AMENITIES from constants.js (string labels
            that match the backend string array field).
          */}
          <div className="bg-white rounded-card border border-border shadow-card p-6">
            <h2 className="font-semibold text-primary mb-4">
              Amenities & Features
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AMENITIES.map((a) => (
                <label
                  key={a}
                  className={`flex items-center gap-2 p-3 rounded-input border cursor-pointer
                                   transition-all duration-150 text-sm select-none
                                   ${
                                     form.amenities.includes(a)
                                       ? "border-secondary bg-secondary/5 text-secondary font-medium"
                                       : "border-border text-text-secondary hover:border-border/80"
                                   }`}
                >
                  <input
                    type="checkbox"
                    checked={form.amenities.includes(a)}
                    onChange={() => handleAmenity(a)}
                    className="accent-secondary shrink-0"
                  />
                  {a}
                </label>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <Link
              to="/owner/dashboard"
              className="btn-secondary flex-1 justify-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 justify-center gap-2"
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <RiLoader4Line className="animate-spin" /> Submitting…
                </>
              ) : (
                <>
                  <RiCheckboxCircleLine /> Submit Listing
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateListing;
