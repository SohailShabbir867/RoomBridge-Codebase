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

const ROOM_TYPE_LABELS = {
  single: "Single Room",
  shared: "Shared Room",
  apartment: "Apartment",
};

const SavedListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    listingService
      .getSavedListings()
      .then((res) => {
        /*
          Backend getSavedListings returns { success, listings, pagination }.
          Old code: res.data → undefined → always [] → empty state always shown.
        */
        setListings(
          Array.isArray(res.listings)
            ? res.listings
            : Array.isArray(res.data)
              ? res.data
              : [],
        );
      })
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
      /* err.message is undefined on axios errors */
      toast.error(
        err.response?.data?.message || "Failed to remove from saved.",
      );
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
          <div className="flex justify-center py-20">
            <RiLoader4Line className="animate-spin text-4xl text-primary" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-card border border-border shadow-card">
            <RiHeart3Fill className="text-6xl text-border mx-auto mb-4" />
            <p className="text-primary font-semibold text-xl mb-2">
              No Saved Rooms Yet
            </p>
            <p className="text-text-secondary text-sm mb-6">
              Browse rooms and click the ♥ icon to save them for later.
            </p>
            <Link
              to="/listings"
              className="btn-primary inline-flex items-center gap-2"
            >
              <RiSearchLine /> Browse Rooms
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((l) => (
              <div
                key={l._id}
                className="bg-white rounded-card border border-border shadow-card hover:shadow-hover
                              transition-all duration-300 group overflow-hidden"
              >
                {/* Image */}
                <div className="relative overflow-hidden">
                  <img
                    src={
                      l.photos?.[0]?.url ||
                      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80"
                    }
                    alt={l.title}
                    className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.src =
                        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80";
                    }}
                    loading="lazy"
                  />
                  <button
                    onClick={() => handleUnsave(l._id)}
                    disabled={removing === l._id}
                    aria-label="Remove from saved"
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm
                               flex items-center justify-center shadow-card hover:bg-white transition-all
                               disabled:opacity-60"
                  >
                    {removing === l._id ? (
                      <RiLoader4Line className="animate-spin text-error text-base" />
                    ) : (
                      <RiHeart3Fill className="text-error text-base" />
                    )}
                  </button>
                  <div
                    className="absolute top-3 left-3 bg-primary/90 backdrop-blur-sm
                                  text-white text-xs font-medium px-2.5 py-1 rounded-full"
                  >
                    {ROOM_TYPE_LABELS[l.roomType] || l.roomType || "Room"}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3
                    className="font-semibold text-primary text-sm leading-snug line-clamp-2
                                 group-hover:text-secondary transition-colors mb-1"
                  >
                    {l.title}
                  </h3>
                  <p className="text-xs text-text-secondary flex items-center gap-1 mb-3">
                    <RiMapPin2Line className="text-accent shrink-0" />
                    {l.address ? `${l.address}, ` : ""}
                    {l.city}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-base font-bold text-primary">
                        PKR {(l.rent || 0).toLocaleString()}
                      </span>
                      <span className="text-xs text-text-secondary">/mo</span>
                    </div>
                    <Link
                      to={`/listings/${l._id}`}
                      className="text-xs font-semibold text-secondary border border-secondary/30
                                     px-2.5 py-1 rounded-full hover:bg-secondary hover:text-white
                                     transition-all duration-200 flex items-center gap-1"
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
