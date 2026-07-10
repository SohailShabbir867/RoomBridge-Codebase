// ── API Base URL ────────────────────────────────────────
// Points to Azure production API or falls back to local development URL
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

// ── Pakistan Cities ─────────────────────────────────────
export const CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Peshawar",
  "Quetta",
  "Faisalabad",
  "Multan",
  "Hyderabad",
  "Sialkot",
  "Gujranwala",
  "Bahawalpur",
  "Sargodha",
  "Abbottabad",
  "Murree",
];

// ── Pakistan Universities (for hostel proximity search) ──
export const PAKISTAN_UNIVERSITIES = [
  { label: "Islamia University Bahawalpur",  value: "Islamia University Bahawalpur", city: "Bahawalpur" },
  { label: "Punjab University",              value: "University of the Punjab",      city: "Lahore" },
  { label: "LUMS",                           value: "LUMS",                          city: "Lahore" },
  { label: "UET Lahore",                     value: "UET Lahore",                    city: "Lahore" },
  { label: "COMSATS Islamabad",              value: "COMSATS University Islamabad",  city: "Islamabad" },
  { label: "NUST",                           value: "NUST",                          city: "Islamabad" },
  { label: "FAST NUCES",                     value: "FAST NUCES",                    city: "Islamabad" },
  { label: "Quaid-i-Azam University",        value: "Quaid-i-Azam University",       city: "Islamabad" },
  { label: "PIEAS",                          value: "PIEAS",                          city: "Islamabad" },
  { label: "UET Peshawar",                   value: "UET Peshawar",                   city: "Peshawar" },
  { label: "University of Peshawar",         value: "University of Peshawar",         city: "Peshawar" },
  { label: "NED University",                 value: "NED University",                 city: "Karachi" },
  { label: "Karachi University",             value: "University of Karachi",          city: "Karachi" },
  { label: "IBA Karachi",                    value: "IBA Karachi",                    city: "Karachi" },
  { label: "BZU Multan",                     value: "Bahauddin Zakariya University",  city: "Multan" },
  { label: "University of Sargodha",        value: "University of Sargodha",          city: "Sargodha" },
  { label: "University of Faisalabad",       value: "University of Faisalabad",       city: "Faisalabad" },
  { label: "USAT Hyderabad",                value: "University of Sindh",             city: "Hyderabad" },
  { label: "UOB Quetta",                    value: "University of Balochistan",        city: "Quetta" },
  { label: "Abbottabad University",         value: "Abbottabad University of Science", city: "Abbottabad" },
];


// ── Listing / Room Types ────────────────────────────────
// MUST match Listing.model.js enum exactly: 'single' | 'shared' | 'apartment'
// Previous session incorrectly changed these to single_room/shared_room/full_apartment/hostel
// which do NOT exist in the backend schema and were SILENTLY REJECTED by Mongoose validation.
export const ROOM_TYPES = [
  { value: "single", label: "Single Room" },
  { value: "shared", label: "Shared Room" },
  { value: "apartment", label: "Full Apartment" },
];

/** @deprecated Use ROOM_TYPES instead */
export const LISTING_TYPES = ROOM_TYPES;

// ── Price Ranges (PKR) ──────────────────────────────────
export const PRICE_RANGES = [
  { value: "0-5000", label: "Under PKR 5,000" },
  { value: "5000-10000", label: "PKR 5,000 – 10,000" },
  { value: "10000-20000", label: "PKR 10,000 – 20,000" },
  { value: "20000-35000", label: "PKR 20,000 – 35,000" },
  { value: "35000-50000", label: "PKR 35,000 – 50,000" },
  { value: "50000+", label: "PKR 50,000+" },
];

// ── Common Amenities ────────────────────────────────────
export const AMENITIES = [
  "WiFi",
  "AC",
  "Parking",
  "Laundry",
  "Kitchen",
  "Furnished",
  "Attached Bath",
  "Balcony",
  "Generator Backup",
  "Security",
  "Water Supply 24/7",
  "Gas",
];

// ── Gender Preferences ──────────────────────────────────
export const GENDER_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "male", label: "Male Only" },
  { value: "female", label: "Female Only" },
];

// ── Booking Status Labels ───────────────────────────────
export const BOOKING_STATUS = {
  pending: { label: "Pending", color: "#f59e0b", bg: "#fffbeb" },
  accepted: { label: "Accepted", color: "#10b981", bg: "#f0fdf4" },
  rejected: { label: "Rejected", color: "#ef4444", bg: "#fff1f2" },
  cancelled: { label: "Cancelled", color: "#6b7280", bg: "#f9fafb" },
};

// ── Report Reasons ──────────────────────────────────────
export const REPORT_REASONS = [
  "Spam or Scam",
  "Inappropriate Content",
  "Misleading Information",
  "Harassment",
  "Duplicate Listing",
  "Other",
];
