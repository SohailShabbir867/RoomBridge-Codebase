import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import listingService from "../../services/listingService";
import RoleDashboardLayout from "../../components/dashboard/common/RoleDashboardLayout";
import toast from "react-hot-toast";
import {
  RiHeart3Fill,
  RiLoader4Line,
  RiHome4Line,
  RiMapPin2Line,
  RiSearchLine,
  RiArrowRightLine,
} from "react-icons/ri";

document.title = "Saved Rooms — RoomBridge";

/* ── Design tokens ──────────────────────────────────────────── */
const DK  = "#012D1D";
const BTN = "#8E4E14";
const ACC = "#FFAB69";

const ROOM_TYPE_LABELS = {
  single:    "Single Room",
  shared:    "Shared Room",
  apartment: "Apartment",
};

const SavedListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    listingService
      .getSavedListings()
      .then((res) =>
        setListings(
          Array.isArray(res.listings) ? res.listings
          : Array.isArray(res.data)   ? res.data : [],
        ),
      )
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleUnsave = async (id) => {
    try {
      setRemoving(id);
      await listingService.unsaveListing(id);
      setListings((ls) => ls.filter((l) => l._id !== id));
      toast.success("Removed from saved rooms.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove from saved.");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <RoleDashboardLayout
      role="seeker"
      title="Saved Rooms"
      subtitle={`${listings.length} saved listing${listings.length !== 1 ? "s" : ""}`}
    >
      <div className="max-w-5xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-24">
            <RiLoader4Line className="animate-spin text-4xl" style={{ color: DK }} />
          </div>
        ) : listings.length === 0 ? (
          <div
            className="text-center py-20 bg-white rounded-2xl border shadow-sm"
            style={{ borderColor: "#E8E2D9" }}
          >
            <RiHeart3Fill className="text-6xl mx-auto mb-4 text-gray-200" />
            <p className="font-bold text-base mb-1" style={{ color: DK }}>No Saved Rooms Yet</p>
            <p className="text-gray-400 text-sm mb-7">
              Browse rooms and click the ♥ icon to save them for later.
            </p>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 text-white text-sm font-bold px-5 py-2.5 rounded-xl"
              style={{ backgroundColor: BTN }}
            >
              <RiSearchLine /> Browse Rooms
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((l) => (
              <div
                key={l._id}
                className="bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-all group"
                style={{ borderColor: "#E8E2D9" }}
              >
                {/* Image */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={
                      l.photos?.[0]?.url ||
                      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80"
                    }
                    alt={l.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.src =
                        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80";
                    }}
                    loading="lazy"
                  />
                  {/* Unsave button */}
                  <button
                    onClick={() => handleUnsave(l._id)}
                    disabled={removing === l._id}
                    aria-label="Remove from saved"
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm
                               flex items-center justify-center shadow-md hover:bg-white transition-all disabled:opacity-60"
                  >
                    {removing === l._id ? (
                      <RiLoader4Line className="animate-spin text-red-500 text-base" />
                    ) : (
                      <RiHeart3Fill className="text-red-500 text-base" />
                    )}
                  </button>
                  {/* Room type badge */}
                  <span
                    className="absolute top-3 left-3 text-[11px] font-bold px-2.5 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: `${DK}CC` }}
                  >
                    {ROOM_TYPE_LABELS[l.roomType] || l.roomType || "Room"}
                  </span>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-bold text-sm line-clamp-2 mb-2" style={{ color: DK }}>
                    {l.title}
                  </h3>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mb-3">
                    <RiMapPin2Line style={{ color: ACC }} />
                    {l.address ? `${l.address}, ` : ""}{l.city}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "#F3EFE9" }}>
                    <div>
                      <span className="font-extrabold text-sm" style={{ color: DK }}>
                        PKR {(l.rent || 0).toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-400">/mo</span>
                    </div>
                    <Link
                      to={`/explore/${l._id}`}
                      className="flex items-center gap-1 text-xs font-bold text-white px-3 py-1.5 rounded-xl
                                 hover:opacity-90 transition-all"
                      style={{ backgroundColor: DK }}
                    >
                      View <RiArrowRightLine />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </RoleDashboardLayout>
  );
};

export default SavedListings;
