import React, { useState, useRef } from "react";
import communityService from "../../services/communityService";
import toast from "react-hot-toast";
import { RiCloseLine, RiImageAddLine, RiLoader4Line } from "react-icons/ri";

const DK = "#012D1D";
const ACC = "#FFAB69";
const CR = "#F7F4EF";

/* Same city list used in Community.model.js — kept here for the <select>
   options. If the master list changes on the backend, update this too. */
const PAKISTAN_CITIES = [
  "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Peshawar", "Quetta",
  "Faisalabad", "Multan", "Hyderabad", "Sialkot", "Gujranwala",
  "Bahawalpur", "Sargodha", "Abbottabad", "Murree",
];

/*
  CreateCommunityModal — admin-only. Only rendered from ManageCommunities.jsx,
  which is itself behind ProtectedRoute role="admin", so no extra role check
  needed here — the backend route also enforces authorize("admin") regardless.

  Props:
    onClose: () => void
    onCreated: (community) => void
*/
const CreateCommunityModal = ({ onClose, onCreated }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("city");
  const [city, setCity] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleImagePick = (file) => {
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Community name is required.");
      return;
    }
    if (type === "city" && !city) {
      toast.error("Please select a city for a city-type community.");
      return;
    }

    const fd = new FormData();
    fd.append("name", name.trim());
    fd.append("description", description.trim());
    fd.append("type", type);
    if (type === "city") fd.append("city", city);
    fd.append("visibility", visibility);
    if (imageFile) fd.append("image", imageFile);

    try {
      setSubmitting(true);
      const res = await communityService.createCommunity(fd);
      toast.success("Community created.");
      onCreated?.(res.data?.community);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create community.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E8E2D9" }}>
          <h2 className="font-bold text-lg" style={{ color: DK }}>
            Create Community
          </h2>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600">
            <RiCloseLine className="text-2xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
          {/* Cover image */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Cover Image (optional)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-28 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden"
              style={{ borderColor: "#E8E2D9", backgroundColor: CR }}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-gray-400">
                  <RiImageAddLine className="text-2xl" />
                  <span className="text-xs">Click to upload (JPEG, PNG, WebP — max 5MB)</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleImagePick(e.target.files?.[0] || null)}
            />
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-gray-400">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              placeholder="e.g. Lahore Roommates"
              className="rounded-xl border px-3.5 py-2.5 text-sm outline-none"
              style={{ borderColor: "#E8E2D9", color: DK }}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
              rows={2}
              placeholder="What's this community about?"
              className="rounded-xl border px-3.5 py-2.5 text-sm outline-none resize-none"
              style={{ borderColor: "#E8E2D9", color: DK }}
            />
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-gray-400">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-xl border px-3.5 py-2.5 text-sm outline-none bg-white"
              style={{ borderColor: "#E8E2D9", color: DK }}
            >
              <option value="city">City community</option>
              <option value="announcement">Announcement channel</option>
              <option value="general">General / topic group</option>
            </select>
          </div>

          {/* City (only for type=city) */}
          {type === "city" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-gray-400">City</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded-xl border px-3.5 py-2.5 text-sm outline-none bg-white"
                style={{ borderColor: "#E8E2D9", color: DK }}
              >
                <option value="">Select a city…</option>
                {PAKISTAN_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Visibility */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-gray-400">Visibility</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVisibility("public")}
                className="rounded-xl border px-3 py-2.5 text-sm font-medium text-left"
                style={{
                  borderColor: visibility === "public" ? DK : "#E8E2D9",
                  backgroundColor: visibility === "public" ? `${DK}10` : "#FFF",
                  color: DK,
                }}
              >
                Public
                <span className="block text-[11px] text-gray-400 font-normal">All members can message</span>
              </button>
              <button
                type="button"
                onClick={() => setVisibility("private")}
                className="rounded-xl border px-3 py-2.5 text-sm font-medium text-left"
                style={{
                  borderColor: visibility === "private" ? DK : "#E8E2D9",
                  backgroundColor: visibility === "private" ? `${DK}10` : "#FFF",
                  color: DK,
                }}
              >
                Private
                <span className="block text-[11px] text-gray-400 font-normal">View-only — admin posts only</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 w-full rounded-full py-3 text-sm font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: DK }}
          >
            {submitting ? (
              <>
                <RiLoader4Line className="animate-spin" /> Creating…
              </>
            ) : (
              "Create Community"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateCommunityModal;
