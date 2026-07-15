import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import listingService from "../../services/listingService";
import toast from "react-hot-toast";
import {
  RiMapPin2Line,
  RiHeart3Line,
  RiHeart3Fill,
  RiEyeLine,
  RiTimeLine,
  RiCheckboxCircleLine,
} from "react-icons/ri";

/*
  ListingCard — individual room listing card.

  Props:
    listing:     Listing object from API
    onUnsave:    (id) => void   — called after successfully unsaving
    showStatus:  bool           — show status badge (admin/owner views)
    showOwner:   bool           — show owner info
    horizontal:  bool           — horizontal (wide) layout vs default card
*/

const ROOM_TYPE_LABELS = {
  "1_person":           "1 Person Room",
  "2_person":           "2 Person Room",
  "3_person":           "3 Person Room",
  "4_person":           "4 Person Room",
  "more_than_4_person": "More than 4 Persons",
  // legacy backwards-compat
  single:    "Single Room",
  shared:    "Shared Room",
  apartment: "Full Apartment",
};

/** Resolve roomType (string or array) to a display string */
const resolveRoomType = (roomType) => {
  if (Array.isArray(roomType))
    return roomType.map((v) => ROOM_TYPE_LABELS[v] || v).join(" / ");
  return ROOM_TYPE_LABELS[roomType] || roomType || "Room";
};

const GENDER_LABELS = {
  any: "Any Gender",
  male: "Male Only",
  female: "Female Only",
};

const STATUS_BADGE = {
  active: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  rejected: "bg-error/10 text-error border-error/20",
  inactive: "bg-border text-text-secondary border-border",
};

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80";

const ListingCard = ({
  listing,
  onUnsave,
  showStatus = false,
  showOwner = false,
  horizontal = false,
}) => {
  const { user, isAuthenticated } = useSelector((s) => s.auth);

  /*
    Local saved state: derive from listing.savedBy or user.savedListings.
    Backend populates listing.savedBy as array of user IDs.
  */
  const isSavedInitially = Array.isArray(listing.savedBy)
    ? listing.savedBy.includes(user?._id)
    : false;

  const [saved, setSaved] = useState(isSavedInitially);
  const [toggling, setToggling] = useState(false);

  const handleSaveToggle = useCallback(
    async (e) => {
      e.preventDefault(); // prevent navigating to detail page
      e.stopPropagation();

      if (!isAuthenticated) {
        toast.error("Please log in to save listings.");
        return;
      }
      if (user?.role === "owner") {
        toast.error("Owners cannot save listings.");
        return;
      }

      try {
        setToggling(true);
        if (saved) {
          await listingService.unsaveListing(listing._id);
          setSaved(false);
          toast.success("Removed from saved.");
          if (onUnsave) onUnsave(listing._id);
        } else {
          await listingService.saveListing(listing._id);
          setSaved(true);
          toast.success("Saved to your list!");
        }
      } catch (err) {
        toast.error(
          err.response?.data?.message || "Failed to update saved status.",
        );
      } finally {
        setToggling(false);
      }
    },
    [saved, isAuthenticated, user, listing._id, onUnsave],
  );

  const thumb = listing.photos?.[0]?.url || FALLBACK_IMG;
  const isOwner =
    listing.owner?._id === user?._id || listing.owner === user?._id;

  if (horizontal) {
    return (
      <Link
        to={`/explore/${listing._id}`}
        className="flex bg-white rounded-card border border-border shadow-card
                       hover:shadow-hover transition-all duration-300 group overflow-hidden"
      >
        {/* Image */}
        <div className="relative w-48 shrink-0 overflow-hidden">
          <img
            src={thumb}
            alt={listing.title}
            className="w-48 h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.src = FALLBACK_IMG;
            }}
            loading="lazy"
          />
          {showStatus && (
            <span
              className={`absolute top-2 left-2 text-xs font-medium px-2 py-0.5
                              rounded-full border capitalize ${STATUS_BADGE[listing.status] || ""}`}
            >
              {listing.status}
            </span>
          )}
        </div>
        {/* Info */}
        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3
                className="font-semibold text-primary line-clamp-2 leading-snug
                             group-hover:text-secondary transition-colors text-sm"
              >
                {listing.title}
              </h3>
              {isAuthenticated && user?.role === "seeker" && !isOwner && (
                <button
                  onClick={handleSaveToggle}
                  disabled={toggling}
                  aria-label={saved ? "Unsave listing" : "Save listing"}
                  className="shrink-0 p-1 rounded-full hover:bg-background transition-colors"
                >
                  {saved ? (
                    <RiHeart3Fill className="text-error text-base" />
                  ) : (
                    <RiHeart3Line className="text-text-secondary text-base hover:text-error" />
                  )}
                </button>
              )}
            </div>
            <p className="text-xs text-text-secondary flex items-center gap-1 mb-2">
              <RiMapPin2Line className="text-accent shrink-0" />
              {listing.address ? `${listing.address}, ` : ""}
              {listing.city}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {listing.furnished && (
                <span className="text-[10px] bg-primary/5 text-primary border border-primary/10 px-1.5 py-0.5 rounded-full">
                  Furnished
                </span>
              )}
              {listing.genderPreference &&
                listing.genderPreference !== "any" && (
                  <span className="text-[10px] bg-secondary/5 text-secondary border border-secondary/10 px-1.5 py-0.5 rounded-full">
                    {GENDER_LABELS[listing.genderPreference]}
                  </span>
                )}
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="font-bold text-primary">
              PKR {(listing.rent || 0).toLocaleString()}
              <span className="text-xs font-normal text-text-secondary">
                /mo
              </span>
            </span>
            <span className="text-xs text-text-secondary">
              {resolveRoomType(listing.roomType)}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  /* ── Default vertical card ───────────────────────────── */
  return (
    <Link
      to={`/explore/${listing._id}`}
      className="flex flex-col bg-white rounded-card border border-border shadow-card
                     hover:shadow-hover transition-all duration-300 group overflow-hidden"
    >
      {/* Image */}
      <div className="relative overflow-hidden">
        <img
          src={thumb}
          alt={listing.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = FALLBACK_IMG;
          }}
          loading="lazy"
        />

        {/* Room type badge */}
        <div className="absolute top-3 left-3">
          <span
            className="text-xs font-medium bg-primary/90 backdrop-blur-sm text-white
                           px-2.5 py-1 rounded-full"
          >
            {resolveRoomType(listing.roomType)}
          </span>
        </div>

        {/* Status badge (admin/owner view) */}
        {showStatus && (
          <div className="absolute top-3 right-12">
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize
                              ${STATUS_BADGE[listing.status] || ""}`}
            >
              {listing.status}
            </span>
          </div>
        )}

        {/* Save / Heart button — seekers only */}
        {isAuthenticated && user?.role === "seeker" && !isOwner && (
          <button
            onClick={handleSaveToggle}
            disabled={toggling}
            aria-label={saved ? "Remove from saved" : "Save listing"}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm
                       flex items-center justify-center shadow-card hover:bg-white transition-all
                       disabled:opacity-60 z-10"
          >
            {saved ? (
              <RiHeart3Fill className="text-error text-base" />
            ) : (
              <RiHeart3Line className="text-text-secondary text-base" />
            )}
          </button>
        )}

        {/* Furnished badge */}
        {listing.furnished && (
          <div className="absolute bottom-3 left-3">
            <span
              className="text-[10px] bg-white/90 backdrop-blur-sm text-primary font-medium
                             px-2 py-0.5 rounded-full flex items-center gap-1"
            >
              <RiCheckboxCircleLine className="text-success text-xs" />{" "}
              Furnished
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-4">
        {/* Title */}
        <h3
          className="font-semibold text-primary line-clamp-2 leading-snug mb-1.5
                       group-hover:text-secondary transition-colors text-sm"
        >
          {listing.title}
        </h3>

        {/* Location */}
        <p className="text-xs text-text-secondary flex items-center gap-1 mb-2">
          <RiMapPin2Line className="text-accent shrink-0" />
          <span className="truncate">
            {listing.address ? `${listing.address}, ` : ""}
            {listing.city}
          </span>
        </p>

        {/* Owner info (admin view) */}
        {showOwner && listing.owner && (
          <p className="text-xs text-text-secondary mb-2">
            By:{" "}
            <span className="font-medium text-primary">
              {listing.owner.name}
            </span>
          </p>
        )}

        {/* Gender pref */}
        {listing.genderPreference && listing.genderPreference !== "any" && (
          <p className="text-xs text-secondary font-medium mb-1">
            {GENDER_LABELS[listing.genderPreference]}
          </p>
        )}

        {/* Meta row: views + date */}
        <div className="flex items-center gap-3 text-xs text-text-secondary mt-auto pt-2 border-t border-border/50">
          {typeof listing.views === "number" && (
            <span className="flex items-center gap-0.5">
              <RiEyeLine /> {listing.views}
            </span>
          )}
          <span className="flex items-center gap-0.5">
            <RiTimeLine /> {new Date(listing.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-end justify-between mt-2">
          <div>
            <span className="text-lg font-bold text-primary">
              PKR {(listing.rent || 0).toLocaleString()}
            </span>
            <span className="text-xs text-text-secondary">/mo</span>
          </div>
          {listing.availableFrom && (
            <span className="text-xs text-text-secondary">
              From{" "}
              {new Date(listing.availableFrom).toLocaleDateString("en-PK", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ListingCard;
