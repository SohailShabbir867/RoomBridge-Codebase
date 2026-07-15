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
  Array.isArray(rt) ? rt.map((v) => TYPE_LABELS[v] || v).join(" / ") : TYPE_LABELS[rt] || rt || "Room";

/* ─── Design tokens (match Figma) ──────────────────────────── */
const C = {
  darkGreen: "#012D1D",
  btnBrown:  "#8E4E14",
  accent:    "#FFAB69",
  cream:     "#F7F4EF",
  promise:   "#F0EDE9",
  white:     "#FFFFFF",
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
      navigate("/login", { state: { from: `/explore/${listing._id}` } });
      return;
    }
    if (!canBook) {
      toast.error(
        isOwner
          ? "You can't book your own listing."
          : "Only seekers can send booking requests."
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
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="border border-gray-100 rounded-2xl p-5 text-center bg-gray-50/50">
        <p className="text-gray-400 text-xs mb-3 font-semibold uppercase tracking-wider">
          Sign in to request booking
        </p>
        <Link
          to="/login"
          state={{ from: `/explore/${listing._id}` }}
          className="w-full text-white font-bold py-3.5 px-6 rounded-xl hover:opacity-95 active:scale-[0.98] transition-all duration-200 text-xs uppercase tracking-wider shadow-md cursor-pointer flex justify-center items-center"
          style={{ backgroundColor: C.darkGreen }}
        >
          Log In to Book
        </Link>
      </div>
    );
  }

  if (isOwner) {
    return (
      <div className="border border-[#FFF3E0] bg-[#FFF3E0]/20 rounded-2xl p-5 text-center">
        <RiAlertLine className="text-[#EF6C00] text-2xl mx-auto mb-2" />
        <p className="text-[#EF6C00] text-xs font-bold uppercase tracking-wider">This is your listing</p>
      </div>
    );
  }

  if (user?.role !== "seeker") {
    return (
      <div className="border border-gray-150 rounded-2xl p-5 text-center bg-gray-50/50">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
          Only seekers can book rooms
        </p>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="bg-[#E8F5E9]/50 border border-[#E8F5E9] rounded-2xl p-5 text-center">
        <RiCheckLine className="text-[#2E7D32] text-2xl mx-auto mb-1" />
        <p className="text-[#2E7D32] text-sm font-bold">Booking Request Sent!</p>
        <p className="text-gray-400 text-[10px] uppercase tracking-wider mt-1 font-semibold">
          The owner will respond soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
          Move-in Date
        </label>
        <div className="relative">
          <RiCalendarLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-base" />
          <input
            id="move-in-date"
            type="date"
            value={booking.moveInDate}
            onChange={(e) => {
              setBooking((b) => ({ ...b, moveInDate: e.target.value }));
              setErrors({});
            }}
            min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
            className={`w-full bg-[#F5F2EB] border-0 rounded-xl py-3.5 pl-10 pr-4 text-xs font-semibold focus:ring-1 focus:ring-[#8E4E14] outline-none text-gray-800 ${
              errors.moveInDate ? "ring-1 ring-red-500" : ""
            }`}
          />
        </div>
        {errors.moveInDate && (
          <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.moveInDate}</p>
        )}
      </div>

      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
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
          placeholder="Introduce yourself and ask any questions..."
          className={`w-full bg-[#F5F2EB] border-0 rounded-xl p-4 text-xs font-semibold focus:ring-1 focus:ring-[#8E4E14] outline-none text-gray-800 placeholder-gray-400 resize-none ${
            errors.message ? "ring-1 ring-red-500" : ""
          }`}
        />
        {errors.message && (
          <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full text-white font-bold py-4 px-6 rounded-xl hover:opacity-95
                   active:scale-[0.98] transition-all duration-200 text-xs uppercase tracking-wider shadow-md
                   disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
        style={{ backgroundColor: C.darkGreen }}
        aria-busy={loading}
      >
        {loading ? (
          <>
            <RiLoader4Line className="animate-spin text-base" />
            Sending...
          </>
        ) : (
          <>
            <RiCalendarLine className="text-base" /> Send Booking Request
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

  const loadListing = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await listingService.getListingById(id);
      const data = res.data?.listing || res.listing || res.data;
      setListing(data);
      setSaved(data?.isSaved || false);
      document.title = `${data?.title || "Room"} — RoomBridge`;
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

  const photos = listing?.photos?.map((p) => p.url) || [];
  const prevImg = () =>
    setActiveImg((i) => (i === 0 ? photos.length - 1 : i - 1));
  const nextImg = () =>
    setActiveImg((i) => (i === photos.length - 1 ? 0 : i + 1));

  const handleSave = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to save listings.");
      navigate("/login", { state: { from: `/explore/${id}` } });
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
        err.response?.data?.message || "Failed to update saved listings."
      );
    } finally {
      setSaveLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: listing?.title, url });
      } catch {
        // user dismiss
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const openReportModal = ({ type, id: targetId, label }) => {
    if (!isAuthenticated) {
      toast.error("Please log in to submit a report.");
      navigate("/login", { state: { from: `/explore/${id}` } });
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: C.cream }}>
        <div className="text-center">
          <RiLoader4Line className="animate-spin text-4xl mx-auto mb-3" style={{ color: C.darkGreen }} />
          <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Loading listing...</p>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: C.cream }}>
        <div className="text-center max-w-md bg-white p-10 rounded-[32px] border border-gray-100 shadow-sm">
          <RiAlertLine className="text-5xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold font-serif mb-2" style={{ color: C.darkGreen }}>
            Listing Not Found
          </h2>
          <p className="text-gray-500 text-xs mb-8 leading-relaxed font-light">
            {error || "This listing is no longer available."}
          </p>
          <Link
            to="/explore"
            className="inline-flex items-center justify-center text-white font-bold py-3.5 px-8 rounded-xl hover:opacity-90 active:scale-95 transition-all text-xs uppercase tracking-wider shadow-md cursor-pointer"
            style={{ backgroundColor: C.darkGreen }}
          >
            Browse Listings
          </Link>
        </div>
      </div>
    );
  }

  const amenities = Array.isArray(listing.amenities) ? listing.amenities : [];
  const rules = Array.isArray(listing.houseRules) ? listing.houseRules : [];
  const reviewList = Array.isArray(listing.reviews) ? listing.reviews : [];

  const rent = listing.rent || 0;
  const typeLabel = resolveRoomType(listing.roomType);
  const ownerName = listing.owner?.name || "Owner";
  const ownerId = listing.owner?._id || listing.owner;
  const canReportListing =
    isAuthenticated && user?._id && ownerId && user._id !== ownerId.toString();
  const canReportOwner =
    isAuthenticated && user?._id && ownerId && user._id !== ownerId.toString();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: C.cream }}>
      
      {/* ── Breadcrumb ── */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
          <Link to="/" className="hover:text-[#8E4E14] transition-colors">
            Home
          </Link>
          <RiArrowRightSLine className="text-sm" />
          <Link to="/explore" className="hover:text-[#8E4E14] transition-colors">
            Listings
          </Link>
          <RiArrowRightSLine className="text-sm" />
          <span className="text-[#012D1D] truncate max-w-[200px]">
            {listing.city}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ── Header details row ── */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className="text-[9px] font-bold text-white px-3 py-1 rounded-full uppercase tracking-wider"
                style={{ backgroundColor: C.darkGreen }}
              >
                {typeLabel}
              </span>
              <span className="text-[9px] font-bold text-[#2E7D32] bg-[#E8F5E9] px-3 py-1 rounded-full uppercase tracking-wider">
                {listing.status === "active" ? "Available" : listing.status || "Available"}
              </span>
            </div>
            
            <h1
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-serif leading-tight mt-1 mb-2.5"
              style={{ color: C.darkGreen }}
            >
              {listing.title}
            </h1>
            
            <p className="text-gray-400 text-xs flex items-center gap-1.5 font-light">
              <RiMapPin2Line className="text-[#8E4E14]" />
              {listing.address ? `${listing.address}, ` : ""}
              {listing.city}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
            
            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saveLoading}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer ${
                saved
                  ? "border-red-200 text-red-500 bg-red-50/50"
                  : "border-gray-200 bg-white text-gray-700 hover:border-red-400 hover:text-red-500"
              }`}
            >
              {saveLoading ? (
                <RiLoader4Line className="animate-spin text-sm" />
              ) : saved ? (
                <RiHeart3Fill className="text-sm" />
              ) : (
                <RiHeart3Line className="text-sm" />
              )}
              {saved ? "Saved" : "Save"}
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:border-gray-400 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <RiShareLine className="text-sm" /> Share
            </button>

            {/* Report */}
            <button
              onClick={() =>
                openReportModal({
                  type: "listing",
                  id,
                  label: listing.title,
                })
              }
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200/50 bg-white text-xs font-bold text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer"
              disabled={isAuthenticated && !canReportListing}
              title={
                isAuthenticated && !canReportListing
                  ? "You cannot report your own listing"
                  : "Report this listing"
              }
            >
              <RiFlagLine className="text-sm" /> Report
            </button>

          </div>
        </div>

        {/* ── Main content grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Panel: Photos, details, amenities */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Gallery card */}
            <div className="bg-white rounded-[32px] p-4 shadow-sm border border-gray-150/40">
              {photos.length > 0 ? (
                <div className="space-y-4">
                  <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-[24px] overflow-hidden shadow-sm bg-black">
                    <img
                      src={photos[activeImg]}
                      alt={`${listing.title} — ${activeImg + 1}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {photos.length > 1 && (
                      <>
                        <button
                          onClick={prevImg}
                          aria-label="Previous photo"
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 text-[#012D1D] flex items-center justify-center transition-all backdrop-blur-md border border-white/25 cursor-pointer active:scale-90"
                        >
                          <RiArrowLeftSLine className="text-lg" />
                        </button>
                        
                        <button
                          onClick={nextImg}
                          aria-label="Next photo"
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 text-[#012D1D] flex items-center justify-center transition-all backdrop-blur-md border border-white/25 cursor-pointer active:scale-90"
                        >
                          <RiArrowRightSLine className="text-lg" />
                        </button>
                        
                        <div className="absolute bottom-4 right-4 bg-black/55 text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full backdrop-blur-md">
                          {activeImg + 1} / {photos.length}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Thumbnail Strip */}
                  {photos.length > 1 && (
                    <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
                      {photos.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveImg(i)}
                          aria-label={`Photo ${i + 1}`}
                          aria-current={activeImg === i ? "true" : undefined}
                          className={`shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                            activeImg === i
                              ? "border-[#8E4E14] scale-95 shadow-sm"
                              : "border-transparent opacity-60 hover:opacity-100"
                          }`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-72 bg-[#F5F2EB] rounded-[24px] flex items-center justify-center border border-dashed border-gray-200">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">No photos available</p>
                </div>
              )}
            </div>

            {/* About / Description */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-150/40 space-y-6">
              <div>
                <h2 className="text-xl font-extrabold font-serif mb-3 text-[#012D1D]">About this Room</h2>
                <p className="text-gray-500 text-sm leading-relaxed whitespace-pre-line font-light">
                  {listing.description || "No description provided."}
                </p>
              </div>

              {/* Grid properties */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 pt-6 border-t border-gray-100">
                {[
                  { label: "Room Type", value: typeLabel },
                  { label: "City", value: listing.city },
                  listing.area && { label: "Area / Sector", value: listing.area },
                  { label: "Furnished", value: listing.furnished ? "Fully Furnished" : "Unfurnished" },
                  listing.genderPreference && {
                    label: "Preferred Seeker",
                    value:
                      listing.genderPreference === "any"
                        ? "Any Gender"
                        : listing.genderPreference === "male"
                        ? "Boys Only"
                        : "Girls Only",
                  },
                  listing.availableFrom && {
                    label: "Available From",
                    value: new Date(listing.availableFrom).toLocaleDateString("en-PK", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }),
                  },
                ]
                  .filter(Boolean)
                  .map(({ label, value }) => (
                    <div key={label} className="bg-[#F5F2EB] rounded-2xl p-4 flex flex-col justify-between">
                      <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5 block">
                        {label}
                      </span>
                      <span className="text-xs font-extrabold text-[#012D1D] leading-snug">
                        {value}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Roommate Preferences Section */}
            {listing.roommatePreferences && (Object.values(listing.roommatePreferences).some(val => val !== undefined && val !== null && val !== "")) && (
              <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-150/40">
                <h2 className="text-xl font-extrabold font-serif mb-5 text-[#012D1D]">Roommate Preferences</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {listing.roommatePreferences.sleepSchedule && (
                    <div className="bg-[#F5F2EB] rounded-2xl p-4 flex flex-col justify-between">
                      <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5 block">
                        Sleep Schedule
                      </span>
                      <span className="text-xs font-extrabold text-[#012D1D] capitalize leading-snug">
                        {listing.roommatePreferences.sleepSchedule}
                      </span>
                    </div>
                  )}
                  {listing.roommatePreferences.occupation && (
                    <div className="bg-[#F5F2EB] rounded-2xl p-4 flex flex-col justify-between">
                      <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5 block">
                        Occupation
                      </span>
                      <span className="text-xs font-extrabold text-[#012D1D] capitalize leading-snug">
                        {listing.roommatePreferences.occupation}
                      </span>
                    </div>
                  )}
                  {listing.roommatePreferences.gender && (
                    <div className="bg-[#F5F2EB] rounded-2xl p-4 flex flex-col justify-between">
                      <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5 block">
                        Gender Preference
                      </span>
                      <span className="text-xs font-extrabold text-[#012D1D] capitalize leading-snug">
                        {listing.roommatePreferences.gender}
                      </span>
                    </div>
                  )}
                  {listing.roommatePreferences.smoker !== undefined && (
                    <div className="bg-[#F5F2EB] rounded-2xl p-4 flex flex-col justify-between">
                      <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5 block">
                        Smoking Allowed
                      </span>
                      <span className="text-xs font-extrabold text-[#012D1D] leading-snug">
                        {listing.roommatePreferences.smoker ? "Yes" : "No"}
                      </span>
                    </div>
                  )}
                  {listing.roommatePreferences.pets !== undefined && (
                    <div className="bg-[#F5F2EB] rounded-2xl p-4 flex flex-col justify-between">
                      <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5 block">
                        Pets Allowed
                      </span>
                      <span className="text-xs font-extrabold text-[#012D1D] leading-snug">
                        {listing.roommatePreferences.pets ? "Yes" : "No"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Nearby Places Section */}
            {listing.nearbyPlaces && listing.nearbyPlaces.length > 0 && (
              <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-150/40">
                <h2 className="text-xl font-extrabold font-serif mb-5 text-[#012D1D]">Nearby Places</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {listing.nearbyPlaces.map((place, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-[#F5F2EB] rounded-2xl border border-transparent hover:border-gray-200/55 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0 text-[#012D1D]">
                          <RiMapPin2Line />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-[#012D1D] block truncate">{place.name}</span>
                          {place.type && (
                            <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block mt-0.5">
                              {place.type}
                            </span>
                          )}
                        </div>
                      </div>
                      {place.distance && (
                        <span className="text-xs font-extrabold text-[#8E4E14] shrink-0">
                          {place.distance}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Amenities Section */}
            {amenities.length > 0 && (
              <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-150/40">
                <h2 className="text-xl font-extrabold font-serif mb-6 text-[#012D1D]">Amenities</h2>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {amenities.map((a) => {
                    const Icon = AMENITY_ICONS[a] || AMENITY_ICONS.default;
                    return (
                      <div
                        key={a}
                        className="flex items-center gap-3 p-3.5 bg-[#F5F2EB] rounded-2xl"
                      >
                        <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 text-[#012D1D] text-lg">
                          <Icon />
                        </div>
                        <span className="text-xs font-bold text-[#012D1D] truncate">{a}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* House Rules */}
            {rules.length > 0 && (
              <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-150/40">
                <h2 className="text-xl font-extrabold font-serif mb-5 text-[#012D1D]">House Rules</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {rules.map((rule) => (
                    <div
                      key={rule}
                      className="flex items-center gap-2.5 text-xs font-semibold text-gray-500 leading-normal"
                    >
                      <div className="w-5 h-5 rounded-full bg-[#E8F5E9] flex items-center justify-center text-[#2E7D32] shrink-0 text-2xs font-bold">
                        ✓
                      </div>
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-150/40 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h2 className="text-xl font-extrabold font-serif text-[#012D1D]">
                  Reviews
                  <span className="text-gray-400 text-xs font-normal ml-2 tracking-wide font-sans">
                    ({listing.reviewCount || reviewList.length})
                  </span>
                </h2>
                {listing.averageRating > 0 && (
                  <div className="flex items-center gap-1 bg-[#FFF3E8] py-1 px-3 rounded-lg text-xs font-extrabold text-[#8E4E14]">
                    <RiStarFill className="text-[#8E4E14]" />
                    <span>{Number(listing.averageRating).toFixed(1)}</span>
                  </div>
                )}
              </div>

              {reviewList.length > 0 ? (
                <div className="space-y-6">
                  {reviewList.map((r, idx) => (
                    <div
                      key={r._id || idx}
                      className="pb-5 border-b border-gray-50 last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                            style={{ backgroundColor: C.darkGreen }}
                          >
                            <span className="text-white text-xs font-extrabold">
                              {(r.user?.name || r.user || "U")[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <span className="font-extrabold text-[#012D1D] text-xs block leading-tight">
                              {r.user?.name || "Anonymous"}
                            </span>
                            {r.createdAt && (
                              <span className="text-[10px] text-gray-400 font-light block mt-0.5">
                                {new Date(r.createdAt).toLocaleDateString("en-PK", {
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0">
                          <StarRating rating={r.rating} size="sm" showValue={false} />
                        </div>
                      </div>
                      <p className="text-gray-500 text-xs ml-12 leading-relaxed font-light">
                        {r.comment || r.text}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-100">
                  <p className="text-gray-400 text-xs font-medium leading-relaxed max-w-xs mx-auto">
                    No reviews yet. Be the first to write a review after your stay!
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* Right Panel: Sticky Booking, Prices, Owner Card */}
          <div className="space-y-6">
            
            {/* Booking & Price Card */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-150/40 space-y-6">
              
              {/* Rent & rating */}
              <div className="border-b border-gray-100 pb-5">
                {listing.rentByType && Object.keys(listing.rentByType).length > 0 ? (
                  <div className="space-y-2 mb-3">
                    <p className="text-2xs font-extrabold uppercase tracking-wider text-gray-400">Rates by Room Capacity</p>
                    {listing.roomType.map((rt) => {
                      const price = listing.rentByType[rt] || listing.rent;
                      if (!price) return null;
                      return (
                        <div key={rt} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                          <span className="text-xs text-gray-500 font-semibold">{TYPE_LABELS[rt] || rt}</span>
                          <span className="text-sm font-extrabold text-[#8E4E14]">
                            PKR {Number(price).toLocaleString()}
                            <span className="text-3xs font-medium text-gray-400 ml-0.5">/mo</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-extrabold font-serif text-[#8E4E14]">
                      PKR {rent.toLocaleString()}
                    </span>
                    <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">/month</span>
                  </div>
                )}
                
                {listing.averageRating > 0 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <StarRating rating={listing.averageRating} size="sm" />
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                      ({listing.reviewCount || 0} reviews)
                    </span>
                  </div>
                )}
              </div>

              {/* Booking Request Form */}
              <BookingForm listing={listing} />

              {/* Message owner */}
              <div className="pt-2">
                <Link
                  to={
                    isAuthenticated
                      ? `/seeker/messages?owner=${listing.owner?._id || ""}&listing=${listing._id || id || ""}&name=${encodeURIComponent(listing.owner?.name || "Owner")}`
                      : "/login"
                  }
                  state={!isAuthenticated ? { from: `/explore/${id}` } : undefined}
                  className="w-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl border transition-all active:scale-[0.97] cursor-pointer"
                  style={{
                    borderColor: C.darkGreen,
                    color: C.darkGreen,
                  }}
                >
                  <RiMessage3Line className="text-sm" /> Message Owner
                </Link>
              </div>
            </div>

            {/* Owner Details Card */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-150/40 space-y-6">
              
              <div className="flex items-center gap-4">
                {listing.owner?.profilePhoto?.url ? (
                  <img
                    src={listing.owner.profilePhoto.url}
                    alt={ownerName}
                    className="w-14 h-14 rounded-full object-cover shrink-0 shadow-sm"
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                    style={{ backgroundColor: C.darkGreen }}
                  >
                    <span className="text-white text-lg font-extrabold">
                      {ownerName[0]?.toUpperCase()}
                    </span>
                  </div>
                )}

                <div>
                  <h3 className="font-extrabold text-sm text-[#012D1D] leading-tight">
                    {ownerName}
                  </h3>
                  {listing.owner?.createdAt && (
                    <span className="text-[10px] text-gray-400 font-light block mt-1">
                      Member since {new Date(listing.owner.createdAt).getFullYear()}
                    </span>
                  )}
                </div>
              </div>

              {/* Owner Stats */}
              <div className="grid grid-cols-2 gap-3 pt-2">
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
                    className="text-center bg-[#F5F2EB] rounded-2xl p-4 flex flex-col justify-between"
                  >
                    <span className="text-sm font-extrabold text-[#012D1D] leading-none">{value}</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-2 block">{label}</span>
                  </div>
                ))}
              </div>

              {/* Report Owner */}
              <button
                onClick={() =>
                  openReportModal({
                    type: "user",
                    id: ownerId,
                    label: ownerName,
                  })
                }
                className="w-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider text-red-500 border border-red-100 py-3 rounded-xl hover:bg-red-50 transition-all cursor-pointer active:scale-95"
                disabled={isAuthenticated && !canReportOwner}
                title={
                  isAuthenticated && !canReportOwner
                    ? "You cannot report yourself"
                    : "Report this owner"
                }
              >
                <RiFlagLine className="text-sm" /> Report Owner
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
