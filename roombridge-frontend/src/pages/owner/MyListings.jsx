import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import listingService from "../../services/listingService";
import RoleDashboardLayout from "../../components/dashboard/common/RoleDashboardLayout";
import toast from "react-hot-toast";
import {
  RiHome4Line,
  RiLoader4Line,
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiEyeLine,
  RiMapPin2Line,
  RiTimeLine,
} from "react-icons/ri";

document.title = "My Listings — RoomBridge";

/* ── Design tokens ──────────────────────────────────────────── */
const DK  = "#012D1D";
const BTN = "#8E4E14";
const ACC = "#FFAB69";

const ROOM_TYPE_LABELS = {
  "1_person":           "1 Person Room",
  "2_person":           "2 Person Room",
  "3_person":           "3 Person Room",
  "4_person":           "4 Person Room",
  "more_than_4_person": "More than 4 Persons",
  single:    "Single Room",
  shared:    "Shared Room",
  apartment: "Full Apartment",
};
const resolveRoomType = (rt) =>
  Array.isArray(rt) ? rt.map((v) => ROOM_TYPE_LABELS[v] || v).join(" / ") : ROOM_TYPE_LABELS[rt] || rt || "";

const STATUS_COLOR = {
  active:   { bg: "#D1FAE5", text: "#065F46" },
  pending:  { bg: "#FEF3C7", text: "#92400E" },
  rejected: { bg: "#FEE2E2", text: "#991B1B" },
  inactive: { bg: "#F3F4F6", text: "#6B7280" },
};

const MyListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [filter, setFilter]     = useState("all");

  useEffect(() => {
    listingService
      .getMyListings({ limit: 50 })
      .then((res) =>
        setListings(
          Array.isArray(res.listings) ? res.listings
          : Array.isArray(res.data)   ? res.data
          : [],
        ),
      )
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      setDeleting(id);
      await listingService.deleteListing(id);
      setListings((ls) => ls.filter((l) => l._id !== id));
      toast.success("Listing deleted.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete listing.");
    } finally {
      setDeleting(null);
    }
  };

  const filtered =
    filter === "all" ? listings : listings.filter((l) => l.status === filter);

  const FILTERS = ["all", "active", "pending", "rejected", "inactive"];

  return (
    <RoleDashboardLayout
      role="owner"
      title="My Listings"
      subtitle={`${listings.length} total listings`}
      headerAction={
        <Link
          to="/owner/listings/create"
          className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl
                     hover:opacity-90 active:scale-95 transition-all shadow-sm"
          style={{ backgroundColor: BTN }}
        >
          <RiAddLine /> Post Room
        </Link>
      }
    >
      <div className="max-w-5xl mx-auto">

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {FILTERS.map((f) => {
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all border"
                style={{
                  backgroundColor: isActive ? DK : "#FFFFFF",
                  color:           isActive ? "#FFFFFF" : "#6B7280",
                  borderColor:     isActive ? DK : "#E8E2D9",
                }}
              >
                {f}
                {f !== "all" && (
                  <span className="ml-1 opacity-60">
                    ({listings.filter((l) => l.status === f).length})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-24">
            <RiLoader4Line className="animate-spin text-4xl" style={{ color: DK }} />
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="text-center py-20 bg-white rounded-2xl border shadow-sm"
            style={{ borderColor: "#E8E2D9" }}
          >
            <RiHome4Line className="text-5xl mx-auto mb-4 text-gray-200" />
            <p className="font-bold text-base mb-1" style={{ color: DK }}>
              {filter === "all" ? "No Listings Yet" : `No ${filter} listings`}
            </p>
            <p className="text-gray-400 text-sm mb-6">
              {filter === "all" && "Start by posting your first room listing."}
            </p>
            {filter === "all" && (
              <Link
                to="/owner/listings/create"
                className="inline-flex items-center gap-2 text-white text-xs font-bold px-5 py-2.5 rounded-xl"
                style={{ backgroundColor: BTN }}
              >
                <RiAddLine /> Post First Room
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((l) => {
              const sc = STATUS_COLOR[l.status] || STATUS_COLOR.inactive;
              return (
                <div
                  key={l._id}
                  className="bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  style={{ borderColor: "#E8E2D9" }}
                >
                  {/* Image */}
                  <div className="relative h-40 bg-gray-100">
                    <img
                      src={
                        l.photos?.[0]?.url ||
                        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80"
                      }
                      alt={l.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src =
                          "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80";
                      }}
                      loading="lazy"
                    />
                    {/* Status badge */}
                    <span
                      className="absolute top-3 left-3 text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize"
                      style={{ backgroundColor: sc.bg, color: sc.text }}
                    >
                      {l.status}
                    </span>
                    {l.bookingCount > 0 && (
                      <span
                        className="absolute top-3 right-3 text-[11px] font-bold px-2.5 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: DK }}
                      >
                        {l.bookingCount} request{l.bookingCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-sm line-clamp-1 mb-2" style={{ color: DK }}>
                      {l.title}
                    </h3>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-3">
                      <span className="flex items-center gap-1">
                        <RiMapPin2Line style={{ color: ACC }} /> {l.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <RiEyeLine /> {l.views || 0} views
                      </span>
                      <span className="flex items-center gap-1">
                        <RiTimeLine /> {new Date(l.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-extrabold text-base" style={{ color: DK }}>
                        PKR {(l.rent || 0).toLocaleString()}
                        <span className="font-medium text-xs text-gray-400">/mo</span>
                      </span>
                      <span className="text-xs text-gray-400">
                        {resolveRoomType(l.roomType)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t" style={{ borderColor: "#F3EFE9" }}>
                      {l.status === "active" && (
                        <Link
                          to={`/explore/${l._id}`}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
                                     border text-xs font-semibold text-gray-500 hover:border-gray-400 transition-colors"
                          style={{ borderColor: "#E8E2D9" }}
                        >
                          <RiEyeLine /> View
                        </Link>
                      )}
                      <Link
                        to={`/owner/listings/${l._id}/edit`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
                                   border text-xs font-bold text-white transition-colors hover:opacity-90"
                        style={{ backgroundColor: DK, borderColor: DK }}
                      >
                        <RiEditLine /> Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(l._id, l.title)}
                        disabled={deleting === l._id}
                        aria-label="Delete listing"
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl
                                   border text-xs font-semibold text-red-500 hover:bg-red-50 disabled:opacity-60 transition-colors"
                        style={{ borderColor: "#FECACA" }}
                      >
                        {deleting === l._id ? (
                          <RiLoader4Line className="animate-spin" />
                        ) : (
                          <RiDeleteBinLine />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </RoleDashboardLayout>
  );
};

export default MyListings;
