import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  RiMapPin2Line,
  RiStarFill,
  RiHeart3Line,
  RiHeart3Fill,
  RiShareLine,
  RiCheckLine,
  RiMessage3Line,
  RiWifiLine,
  RiTempColdLine,
  RiCarLine,
  RiRestaurantLine,
  RiShirtLine,
  RiShieldLine,
  RiPlugLine,
  RiGroupLine,
  RiCalendarLine,
  RiArrowRightSLine,
  RiArrowLeftSLine,
  RiArrowRightLine,
  RiLoader4Line,
  RiAlertLine,
  RiFlagLine,
} from "react-icons/ri";
import StarRating from "../../components/common/StarRating";
import ReportModal from "../../components/reports/ReportModal";
import listingService from "../../services/listingService";
import bookingService from "../../services/bookingService";
import reportService from "../../services/reportService";
import { addBooking } from "../../redux/slices/bookingSlice";
import { toggleSavedListing } from "../../redux/slices/listingSlice";
import toast from "react-hot-toast";

const AMENITY_ICONS = {
  WiFi: RiWifiLine,
  AC: RiTempColdLine,
  Parking: RiCarLine,
  Kitchen: RiRestaurantLine,
  Laundry: RiShirtLine,
  Security: RiShieldLine,
  Generator: RiPlugLine,
  default: RiCheckLine,
};

const TYPE_LABELS = {
  single: "Single Room",
  shared: "Shared Room",
  apartment: "Full Apartment",
};

/* ── Booking form component ─────────────────────────────────── */
const BookingForm = ({ listing, onSuccess }) => {
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [booking, setBooking] = useState({ moveInDate: "", message: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  /* Rule: seekers only, and not the owner of this very listing */
  const isOwner = user?._id === (listing.owner?._id || listing.owner);
  const isSeeker = user?.role === "seeker";
  const canBook = isAuthenticated && isSeeker && !isOwner;

  const validate = () => {
    const e = {};
    if (!booking.moveInDate) e.moveInDate = "Please select a move-in date";
    else {
      const d = new Date(booking.moveInDate);
      if (d <= new Date()) e.moveInDate = "Move-in date must be in the future";
    }
    if (!booking.message || booking.message.trim().length < 10) {
      e.message = "Message must be at least 10 characters";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please log in to send a booking request.");
      navigate("/login", { state: { from: `/listings/${listing._id}` } });
      return;
    }
    if (!canBook) {
      toast.error(
        isOwner
          ? "You can't book your own listing."
          : "Only seekers can send booking requests.",
      );
      return;
    }
    if (!validate()) return;
    try {
      setLoading(true);
      const res = await bookingService.createBooking({
        listingId: listing._id,
        moveInDate: booking.moveInDate,
        message: booking.message,
      });
      dispatch(addBooking(res.data?.booking || res.booking || res.data));
      setSent(true);
      toast.success("Booking request sent! The owner will respond shortly. 🎉");
      onSuccess?.();
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to send booking request.";
      toast.error(msg);
      if (msg.toLowerCase().includes("already")) {
        setSent(true); // treat duplicate as "already sent"
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="border border-border rounded-input p-4 text-center">
        <p className="text-text-secondary text-sm mb-3">
          Sign in to send a booking request
        </p>
        <Link
          to="/login"
          state={{ from: `/listings/${listing._id}` }}
          className="btn-primary w-full justify-center gap-2 text-sm"
        >
          Log In to Book
        </Link>
      </div>
    );
  }

  if (isOwner) {
    return (
      <div className="border border-warning/30 bg-warning/5 rounded-input p-4 text-center">
        <RiAlertLine className="text-warning text-2xl mx-auto mb-2" />
        <p className="text-text-secondary text-sm">This is your own listing.</p>
      </div>
    );
  }

  if (user?.role !== "seeker") {
    return (
      <div className="border border-border rounded-input p-4 text-center">
        <p className="text-text-secondary text-sm">
          Only seekers can book rooms.
        </p>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="bg-success/10 border border-success/30 rounded-input p-4 text-center">
        <RiCheckLine className="text-success text-2xl mx-auto mb-1" />
        <p className="text-success text-sm font-medium">
          Booking request sent!
        </p>
        <p className="text-text-secondary text-xs mt-1">
          The owner will respond within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="label" htmlFor="move-in-date">
          Move-in Date
        </label>
        <div className="relative">
          <RiCalendarLine className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          <input
            id="move-in-date"
            type="date"
            value={booking.moveInDate}
            onChange={(e) => {
              setBooking((b) => ({ ...b, moveInDate: e.target.value }));
              setErrors({});
            }}
            min={new Date(Date.now() + 86400000).toISOString().split("T")[0]} // tomorrow
            className={`input pl-9 text-sm ${errors.moveInDate ? "input-error" : ""}`}
          />
        </div>
        {errors.moveInDate && <p className="error-msg">{errors.moveInDate}</p>}
      </div>
      <div>
        <label className="label" htmlFor="booking-message">
          Message to Owner
        </label>
        <textarea
          id="booking-message"
          value={booking.message}
          onChange={(e) => {
            setBooking((b) => ({ ...b, message: e.target.value }));
            setErrors((er) => ({ ...er, message: undefined }));
          }}
          rows={3}
          placeholder="Introduce yourself and ask any questions… (min 10 characters)"
          className={`input text-sm resize-none ${errors.message ? "input-error" : ""}`}
        />
        {errors.message && <p className="error-msg">{errors.message}</p>}
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary btn-lg justify-center gap-2"
        aria-busy={loading}
      >
        {loading ? (
          <>
            <RiLoader4Line className="animate-spin h-4 w-4" />
            Sending…
          </>
        ) : (
          <>
            <RiCalendarLine /> Send Booking Request
          </>
        )}
      </button>
    </form>
  );
};

/* ════════════════════════════════════════════════════════════
   LISTING DETAIL PAGE
════════════════════════════════════════════════════════════ */
const ListingDetailPage = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImg, setActiveImg] = useState(0);
  const [saved, setSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);

  /* ── Load listing from real API ─────────────────────────────── */
  const loadListing = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await listingService.getListingById(id);
      /*
        was using hardcoded MOCK data — never called the API.
        Backend returns { success, listing } (single object, not array).
      */
      const data = res.data?.listing || res.listing || res.data;
      setListing(data);
      setSaved(data?.isSaved || false);
      document.title = `${data?.title || "Room"} — RoomBridge`;
      /* Increment view count (backend only increments on explicit call) */
      listingService.incrementViews(id).catch(() => {});
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) {
        setError("This listing does not exist or has been removed.");
      } else {
        setError(err.response?.data?.message || "Failed to load listing.");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadListing();
  }, [loadListing]);

  /* ── Photo navigation ─────────────────────────────────────── */
  const photos = listing?.photos?.map((p) => p.url) || [];
  const prevImg = () =>
    setActiveImg((i) => (i === 0 ? photos.length - 1 : i - 1));
  const nextImg = () =>
    setActiveImg((i) => (i === photos.length - 1 ? 0 : i + 1));

  /* ── Save/Unsave ─────────────────────────────────────────────- */
  const handleSave = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to save listings.");
      navigate("/login", { state: { from: `/listings/${id}` } });
      return;
    }
    try {
      setSaveLoading(true);
      if (saved) {
        await listingService.unsaveListing(id);
        setSaved(false);
        dispatch(toggleSavedListing({ id, isSaved: false }));
        toast.success("Removed from saved listings.");
      } else {
        await listingService.saveListing(id);
        setSaved(true);
        dispatch(toggleSavedListing({ id, isSaved: true }));
        toast.success("Saved to your favourites!");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to update saved listings.",
      );
    } finally {
      setSaveLoading(false);
    }
  };

  /* ── Share ───────────────────────────────────────────────────── */
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: listing?.title, url });
      } catch {
        // User dismissed the native share sheet.
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const openReportModal = ({ type, id: targetId, label }) => {
    if (!isAuthenticated) {
      toast.error("Please log in to submit a report.");
      navigate("/login", { state: { from: `/listings/${id}` } });
      return;
    }
    setReportTarget({ type, id: targetId, label });
  };

  const handleSubmitReport = async ({ reason, description }) => {
    if (!reportTarget) return;

    try {
      setReportSubmitting(true);
      const payload = {
        reason,
        description,
        ...(reportTarget.type === "listing"
          ? { reportedListing: reportTarget.id }
          : { reportedUser: reportTarget.id }),
      };

      await reportService.submitReport(payload);
      toast.success("Report submitted. Admin team will review it.");
      setReportTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit report.");
    } finally {
      setReportSubmitting(false);
    }
  };

  /* ── Loading state ───────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RiLoader4Line className="animate-spin text-4xl text-primary mx-auto mb-3" />
          <p className="text-text-secondary text-sm">Loading listing…</p>
        </div>
      </div>
    );
  }

  /* ── Error state ─────────────────────────────────────────────── */
  if (error || !listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <RiAlertLine className="text-5xl text-error mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-primary mb-2">
            Listing Not Found
          </h2>
          <p className="text-text-secondary mb-6">
            {error || "This listing is no longer available."}
          </p>
          <Link
            to="/listings"
            className="btn-primary inline-flex items-center gap-2"
          >
            <RiArrowRightLine className="rotate-180" /> Browse Listings
          </Link>
        </div>
      </div>
    );
  }

  /* ── Helpers ─────────────────────────────────────────────────── */
  const amenities = Array.isArray(listing.amenities) ? listing.amenities : [];
  const rules = Array.isArray(listing.houseRules) ? listing.houseRules : [];
  const reviewList = Array.isArray(listing.reviews) ? listing.reviews : [];
  /*
    listing.price doesn't exist on the model — the field is 'rent'.
    listing.type doesn't exist on the model — the field is 'roomType'.
  */
  const rent = listing.rent || 0;
  const typeLabel = TYPE_LABELS[listing.roomType] || listing.roomType || "Room";
  const ownerName = listing.owner?.name || "Owner";
  const ownerId = listing.owner?._id || listing.owner;
  const canReportListing =
    isAuthenticated && user?._id && ownerId && user._id !== ownerId.toString();
  const canReportOwner =
    isAuthenticated && user?._id && ownerId && user._id !== ownerId.toString();

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-border">
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3
                        flex items-center gap-2 text-sm text-text-secondary"
        >
          <Link to="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <RiArrowRightSLine aria-hidden="true" />
          <Link to="/listings" className="hover:text-primary transition-colors">
            Listings
          </Link>
          <RiArrowRightSLine aria-hidden="true" />
          <span className="text-primary font-medium truncate max-w-[200px]">
            {listing.city}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-white bg-primary px-2.5 py-1 rounded-full">
                {typeLabel}
              </span>
              <span className="text-xs font-semibold text-success bg-success/10 px-2.5 py-1 rounded-full">
                {listing.status === "active"
                  ? "Available"
                  : listing.status || "Available"}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary leading-tight mb-1">
              {listing.title}
            </h1>
            <p className="text-text-secondary flex items-center gap-1.5">
              <RiMapPin2Line className="text-accent" />
              {listing.address ? `${listing.address}, ` : ""}
              {listing.city}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleSave}
              disabled={saveLoading}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-btn border text-sm font-medium
                          transition-all duration-200 disabled:opacity-60
                          ${
                            saved
                              ? "border-error text-error bg-red-50"
                              : "border-border text-text-secondary hover:border-error hover:text-error"
                          }`}
            >
              {saveLoading ? (
                <RiLoader4Line className="animate-spin" />
              ) : saved ? (
                <RiHeart3Fill />
              ) : (
                <RiHeart3Line />
              )}
              {saved ? "Saved" : "Save"}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-4 py-2 rounded-btn border border-border
                         text-sm font-medium text-text-secondary hover:border-primary hover:text-primary transition-all"
            >
              <RiShareLine /> Share
            </button>
            <button
              onClick={() =>
                openReportModal({
                  type: "listing",
                  id,
                  label: listing.title,
                })
              }
              className="flex items-center gap-1.5 px-4 py-2 rounded-btn border border-error/30 text-sm font-medium text-error hover:bg-error hover:text-white transition-all"
              disabled={isAuthenticated && !canReportListing}
              title={
                isAuthenticated && !canReportListing
                  ? "You cannot report your own listing"
                  : "Report this listing"
              }
            >
              <RiFlagLine /> Report
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left: Photos + Details ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo gallery */}
            {photos.length > 0 ? (
              <>
                <div className="relative bg-black rounded-card overflow-hidden">
                  <img
                    src={photos[activeImg]}
                    alt={`${listing.title} — photo ${activeImg + 1}`}
                    className="w-full h-72 md:h-96 object-cover"
                  />
                  {photos.length > 1 && (
                    <>
                      <button
                        onClick={prevImg}
                        aria-label="Previous photo"
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full
                                   bg-black/50 text-white flex items-center justify-center
                                   hover:bg-black/70 transition-colors backdrop-blur-sm"
                      >
                        <RiArrowLeftSLine />
                      </button>
                      <button
                        onClick={nextImg}
                        aria-label="Next photo"
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full
                                   bg-black/50 text-white flex items-center justify-center
                                   hover:bg-black/70 transition-colors backdrop-blur-sm"
                      >
                        <RiArrowRightSLine />
                      </button>
                      <div
                        className="absolute bottom-3 right-3 bg-black/60 text-white text-xs
                                      px-2.5 py-1 rounded-full backdrop-blur-sm"
                      >
                        {activeImg + 1} / {photos.length}
                      </div>
                    </>
                  )}
                </div>
                {/* Thumbnails */}
                {photos.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {photos.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImg(i)}
                        aria-label={`Photo ${i + 1}`}
                        aria-current={activeImg === i ? "true" : undefined}
                        className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all
                                    ${
                                      activeImg === i
                                        ? "border-primary shadow-card"
                                        : "border-transparent opacity-60 hover:opacity-100"
                                    }`}
                      >
                        <img
                          src={img}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* No photos placeholder */
              <div
                className="w-full h-72 bg-background rounded-card border border-border
                              flex items-center justify-center"
              >
                <p className="text-text-secondary text-sm">
                  No photos available
                </p>
              </div>
            )}

            {/* Description */}
            <div className="bg-white rounded-card border border-border p-6">
              <h2 className="text-lg font-bold text-primary mb-3">
                About this Room
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-line">
                {listing.description || "No description provided."}
              </p>
              {/* Key details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-border">
                {[
                  { label: "Room Type", value: typeLabel },
                  { label: "City", value: listing.city },
                  listing.genderPreference && {
                    label: "Preferred",
                    value:
                      listing.genderPreference === "any"
                        ? "Any gender"
                        : `${listing.genderPreference} only`,
                  },
                  listing.availableFrom && {
                    label: "Available From",
                    value: new Date(listing.availableFrom).toLocaleDateString(
                      "en-PK",
                      { month: "short", day: "numeric", year: "numeric" },
                    ),
                  },
                ]
                  .filter(Boolean)
                  .map(({ label, value }) => (
                    <div key={label} className="bg-background rounded-lg p-3">
                      <p className="text-xs text-text-secondary font-medium mb-0.5">
                        {label}
                      </p>
                      <p className="text-sm font-semibold text-primary">
                        {value}
                      </p>
                    </div>
                  ))}
              </div>
            </div>

            {/* Amenities */}
            {amenities.length > 0 && (
              <div className="bg-white rounded-card border border-border p-6">
                <h2 className="text-lg font-bold text-primary mb-4">
                  Amenities
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {amenities.map((a) => {
                    const Icon = AMENITY_ICONS[a] || AMENITY_ICONS.default;
                    return (
                      <div
                        key={a}
                        className="flex items-center gap-2.5 p-3 bg-background rounded-lg"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="text-primary text-sm" />
                        </div>
                        <span className="text-sm font-medium text-primary">
                          {a}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* House Rules */}
            {rules.length > 0 && (
              <div className="bg-white rounded-card border border-border p-6">
                <h2 className="text-lg font-bold text-primary mb-4">
                  House Rules
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {rules.map((rule) => (
                    <div
                      key={rule}
                      className="flex items-center gap-2 text-sm text-text-secondary"
                    >
                      <RiCheckLine className="text-success shrink-0" /> {rule}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white rounded-card border border-border p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-primary">
                  Reviews
                  <span className="text-text-secondary text-sm font-normal ml-2">
                    ({listing.reviewCount || reviewList.length})
                  </span>
                </h2>
                {listing.averageRating > 0 && (
                  <div className="flex items-center gap-1.5">
                    <RiStarFill className="text-warning" />
                    <span className="font-bold text-primary">
                      {Number(listing.averageRating).toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              {reviewList.length > 0 ? (
                <div className="space-y-4">
                  {reviewList.map((r, idx) => (
                    <div
                      key={r._id || idx}
                      className="pb-4 border-b border-border last:border-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {(r.user?.name || r.user || "U")[0].toUpperCase()}
                            </span>
                          </div>
                          <span className="font-semibold text-primary text-sm">
                            {r.user?.name || "Anonymous"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <StarRating
                            rating={r.rating}
                            size="sm"
                            showValue={false}
                          />
                          {r.createdAt && (
                            <span className="text-xs text-text-secondary">
                              {new Date(r.createdAt).toLocaleDateString(
                                "en-PK",
                                { month: "short", year: "numeric" },
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-text-secondary text-sm ml-10">
                        {r.comment || r.text}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-secondary text-sm text-center py-6">
                  No reviews yet. Be the first to review after your stay!
                </p>
              )}
            </div>
          </div>

          {/* ── Right: Price + Booking sidebar ── */}
          <div className="space-y-4">
            {/* Price card */}
            <div className="bg-white rounded-card border border-border p-6 sticky top-36">
              <div className="flex items-end gap-2 mb-1">
                {/* was listing.price — correct field is listing.rent */}
                <span className="text-3xl font-bold text-primary">
                  PKR {rent.toLocaleString()}
                </span>
                <span className="text-text-secondary text-sm mb-1">/month</span>
              </div>
              {listing.averageRating > 0 && (
                <div className="flex items-center gap-1.5 mb-5">
                  <StarRating rating={listing.averageRating} size="sm" />
                  <span className="text-xs text-text-secondary">
                    ({listing.reviewCount || 0} reviews)
                  </span>
                </div>
              )}

              {/* Booking form — now connected to real API */}
              <BookingForm listing={listing} />

              <div className="border-t border-border mt-4 pt-4 space-y-2">
                {/* Message owner */}
                <Link
                  to={
                    isAuthenticated
                      ? `/seeker/messages?owner=${listing.owner?._id || ""}&listing=${listing._id || id || ""}`
                      : "/login"
                  }
                  state={
                    !isAuthenticated ? { from: `/listings/${id}` } : undefined
                  }
                  className="w-full flex items-center justify-center gap-2
                             text-sm font-medium text-primary border border-primary
                             py-2.5 rounded-btn hover:bg-primary hover:text-white
                             transition-all duration-200"
                >
                  <RiMessage3Line /> Message Owner
                </Link>
              </div>
            </div>

            {/* Owner card */}
            <div className="bg-white rounded-card border border-border p-5">
              <h3 className="font-semibold text-primary mb-3 text-sm">
                About the Owner
              </h3>
              <div className="flex items-center gap-3 mb-4">
                {listing.owner?.profilePhoto?.url ? (
                  <img
                    src={listing.owner.profilePhoto.url}
                    alt={ownerName}
                    className="w-12 h-12 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-white font-bold">{ownerName[0]}</span>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-primary text-sm">
                    {ownerName}
                  </p>
                  {listing.owner?.createdAt && (
                    <p className="text-xs text-text-secondary">
                      Member since{" "}
                      {new Date(listing.owner.createdAt).getFullYear()}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Listings",
                    value: listing.owner?.listingCount ?? "–",
                  },
                  {
                    label: "Response Rate",
                    value: listing.owner?.responseRate
                      ? `${listing.owner.responseRate}%`
                      : "–",
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="text-center bg-background rounded-lg p-3"
                  >
                    <p className="font-bold text-primary">{value}</p>
                    <p className="text-xs text-text-secondary">{label}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() =>
                  openReportModal({
                    type: "user",
                    id: ownerId,
                    label: ownerName,
                  })
                }
                className="w-full mt-4 flex items-center justify-center gap-2 text-sm font-medium text-error border border-error/30 py-2.5 rounded-btn hover:bg-error hover:text-white transition-all"
                disabled={isAuthenticated && !canReportOwner}
                title={
                  isAuthenticated && !canReportOwner
                    ? "You cannot report yourself"
                    : "Report this owner"
                }
              >
                <RiFlagLine /> Report Owner
              </button>
            </div>
          </div>
        </div>
      </div>

      <ReportModal
        isOpen={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        onSubmit={handleSubmitReport}
        targetLabel={reportTarget?.label || ""}
        targetType={reportTarget?.type || "listing"}
        loading={reportSubmitting}
      />
    </div>
  );
};

export default ListingDetailPage;
