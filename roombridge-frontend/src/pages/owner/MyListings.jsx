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
  RiCheckboxCircleLine,
  RiTimeLine,
} from "react-icons/ri";

document.title = "My Listings — RoomBridge";

const ROOM_TYPE_LABELS = {
  single: "Single Room",
  shared: "Shared Room",
  apartment: "Apartment",
};

const STATUS_BADGE = {
  pending: "bg-warning/10 text-warning border-warning/20",
  active: "bg-success/10 text-success border-success/20",
  inactive: "bg-border text-text-secondary border-border",
  rejected: "bg-error/10 text-error border-error/20",
};

const MyListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    listingService
      .getMyListings({ limit: 50 })
      .then((res) => {
        /*
          Backend returns { success, listings, pagination }.
          Old code: res.data → always undefined → always empty array.
          New code: res.listings with res.data fallback.
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

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      setDeleting(id);
      await listingService.deleteListing(id);
      setListings((ls) => ls.filter((l) => l._id !== id));
      toast.success("Listing deleted.");
    } catch (err) {
      /* err.message is undefined on axios errors */
      toast.error(err.response?.data?.message || "Failed to delete listing.");
    } finally {
      setDeleting(null);
    }
  };

  const filtered =
    filter === "all" ? listings : listings.filter((l) => l.status === filter);

  return (
    <RoleDashboardLayout
      role="owner"
      title="My Listings"
      subtitle={`${listings.length} total listings`}
      headerAction={
        <Link
          to="/owner/listings/create"
          className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-btn hover:bg-secondary transition-colors shadow-card"
        >
          <RiAddLine /> Post Room
        </Link>
      }
    >
      <div className="max-w-5xl mx-auto">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["all", "active", "pending", "rejected", "inactive"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all
                                ${
                                  filter === f
                                    ? "bg-primary text-white shadow-card"
                                    : "bg-white border border-border text-text-secondary hover:text-primary"
                                }`}
            >
              {f}
              {f !== "all" && (
                <span className="ml-1 text-xs opacity-70">
                  ({listings.filter((l) => l.status === f).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <RiLoader4Line className="animate-spin text-4xl text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-card border border-border shadow-card">
            <RiHome4Line className="text-6xl text-border mx-auto mb-4" />
            <p className="text-primary font-semibold text-xl mb-2">
              {filter === "all" ? "No Listings Yet" : `No ${filter} listings`}
            </p>
            <p className="text-text-secondary text-sm mb-6">
              {filter === "all" && "Start by posting your first room listing."}
            </p>
            {filter === "all" && (
              <Link
                to="/owner/listings/create"
                className="btn-primary inline-flex items-center gap-2"
              >
                <RiAddLine /> Post First Room
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map((l) => (
              <div
                key={l._id}
                className="bg-white rounded-card border border-border shadow-card hover:shadow-hover
                              transition-all duration-300 overflow-hidden"
              >
                {/* Image */}
                <div className="relative">
                  <img
                    src={
                      l.photos?.[0]?.url ||
                      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80"
                    }
                    alt={l.title}
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                      e.target.src =
                        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80";
                    }}
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize
                                      ${STATUS_BADGE[l.status] || STATUS_BADGE.inactive}`}
                    >
                      {l.status}
                    </span>
                  </div>
                  {l.bookingCount > 0 && (
                    <div
                      className="absolute top-3 right-3 bg-primary text-white text-xs
                                    font-medium px-2 py-0.5 rounded-full"
                    >
                      {l.bookingCount} request{l.bookingCount !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-primary line-clamp-1 mb-1">
                    {l.title}
                  </h3>
                  <div className="flex flex-wrap gap-3 text-xs text-text-secondary mb-3">
                    <span className="flex items-center gap-1">
                      <RiMapPin2Line className="text-accent" />
                      {l.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <RiEyeLine className="text-secondary" />
                      {l.views || 0} views
                    </span>
                    <span className="flex items-center gap-1">
                      <RiTimeLine className="text-secondary" />
                      {new Date(l.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-primary text-lg">
                      PKR {(l.rent || 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {ROOM_TYPE_LABELS[l.roomType] || l.roomType}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-border">
                    {l.status === "active" && (
                      <Link
                        to={`/listings/${l._id}`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-btn
                                       border border-border text-text-secondary text-sm hover:text-primary
                                       hover:border-primary transition-colors"
                      >
                        <RiEyeLine className="text-sm" /> View
                      </Link>
                    )}
                    <Link
                      to={`/owner/listings/${l._id}/edit`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-btn
                                     border border-secondary/30 text-secondary text-sm hover:bg-secondary
                                     hover:text-white transition-colors"
                    >
                      <RiEditLine className="text-sm" /> Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(l._id, l.title)}
                      disabled={deleting === l._id}
                      aria-label="Delete listing"
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-btn
                                 border border-error/30 text-error text-sm hover:bg-error hover:text-white
                                 disabled:opacity-60 transition-colors"
                    >
                      {deleting === l._id ? (
                        <RiLoader4Line className="animate-spin text-sm" />
                      ) : (
                        <RiDeleteBinLine className="text-sm" />
                      )}
                    </button>
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

export default MyListings;
