import React, { useEffect, useState } from "react";
import communityService from "../../services/communityService";
import CommunityCard from "../../components/community/CommunityCard";
import {
  RiLoader4Line,
  RiSearchLine,
  RiGroupLine,
  RiCloseLine,
  RiCommunityLine,
  RiMegaphoneLine,
  RiMapPin2Line,
} from "react-icons/ri";
import toast from "react-hot-toast";

const DK  = "#012D1D";
const ACC = "#FFAB69";

const PAKISTAN_CITIES = [
  "Karachi","Lahore","Islamabad","Rawalpindi","Peshawar","Quetta",
  "Faisalabad","Multan","Hyderabad","Sialkot","Gujranwala",
  "Bahawalpur","Sargodha","Abbottabad","Murree",
];

const TYPES = [
  { value: "",             label: "All",           icon: RiGroupLine },
  { value: "city",         label: "City",          icon: RiCommunityLine },
  { value: "announcement", label: "Announcements", icon: RiMegaphoneLine },
  { value: "general",      label: "General",       icon: RiGroupLine },
];

const CommunityListPage = () => {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [type, setType]               = useState("");
  const [city, setCity]               = useState("");
  const [search, setSearch]           = useState("");

  useEffect(() => { document.title = "Communities — RoomBridge"; }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (type) params.type = type;
    if (city) params.city = city;
    communityService
      .getCommunities(params)
      .then((res) => setCommunities(Array.isArray(res.data) ? res.data : []))
      .catch((err) => toast.error(err.response?.data?.message || "Failed to load communities."))
      .finally(() => setLoading(false));
  }, [type, city]);

  /* client-side search filter */
  const filtered = search.trim()
    ? communities.filter(
        (c) =>
          c.name?.toLowerCase().includes(search.toLowerCase()) ||
          c.city?.toLowerCase().includes(search.toLowerCase()) ||
          c.description?.toLowerCase().includes(search.toLowerCase()),
      )
    : communities;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F9F7F2" }}>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ backgroundColor: DK }}>
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ backgroundColor: ACC }} aria-hidden="true" />
        <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full blur-3xl opacity-8 pointer-events-none"
          style={{ backgroundColor: ACC }} aria-hidden="true" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 text-center relative z-10">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5 border border-white/20"
            style={{ backgroundColor: "rgba(255,255,255,0.08)", color: ACC }}
          >
            <RiGroupLine /> RoomBridge Communities
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-3 leading-tight font-serif">
            Connect With Your{" "}
            <span style={{ color: ACC }}>City's Community</span>
          </h1>

          <p className="text-white/60 text-sm sm:text-base mb-8 leading-relaxed max-w-xl mx-auto px-2">
            Join city groups, get announcements, and chat with seekers and owners across Pakistan.
          </p>

          {/* Search bar inside hero */}
          <div className="relative max-w-md mx-auto">
            <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-base" />
            <input
              type="text"
              placeholder="Search communities, cities…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white rounded-2xl pl-11 pr-10 py-3.5 text-sm font-medium outline-none shadow-lg"
              style={{ color: DK }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <RiCloseLine />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Filters ── */}
      <div className="bg-white border-b sticky top-[60px] z-20 shadow-sm" style={{ borderColor: "#E8E2D9" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Type pill chips */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-3" style={{ scrollbarWidth: "none" }}>
            {TYPES.map(({ value, label, icon: Icon }) => {
              const active = type === value;
              return (
                <button
                  key={value}
                  onClick={() => setType(value)}
                  className="inline-flex items-center gap-1.5 shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border active:scale-95 cursor-pointer"
                  style={{
                    backgroundColor: active ? DK : "transparent",
                    color:           active ? "#FFF" : DK,
                    borderColor:     active ? DK : "#E8E2D9",
                  }}
                >
                  <Icon className="text-xs" /> {label}
                </button>
              );
            })}

            {/* Divider */}
            <div className="w-px bg-gray-200 shrink-0 my-1" />

            {/* City chips */}
            <button
              onClick={() => setCity("")}
              className="inline-flex items-center gap-1.5 shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border active:scale-95 cursor-pointer"
              style={{
                backgroundColor: city === "" ? ACC : "transparent",
                color:           city === "" ? DK : DK,
                borderColor:     city === "" ? ACC : "#E8E2D9",
              }}
            >
              <RiMapPin2Line className="text-xs" /> All Cities
            </button>
            {PAKISTAN_CITIES.map((c) => {
              const active = city === c;
              return (
                <button
                  key={c}
                  onClick={() => setCity(active ? "" : c)}
                  className="inline-flex items-center gap-1 shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border active:scale-95 cursor-pointer"
                  style={{
                    backgroundColor: active ? ACC : "transparent",
                    color:           active ? DK : DK,
                    borderColor:     active ? ACC : "#E8E2D9",
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>

          {/* Active filter summary */}
          {(type || city || search) && (
            <div className="flex items-center gap-2 pb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Filtered:
              </span>
              {type && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: DK }}>
                  {type} <RiCloseLine className="cursor-pointer" onClick={() => setType("")} />
                </span>
              )}
              {city && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: ACC, color: DK }}>
                  {city} <RiCloseLine className="cursor-pointer" onClick={() => setCity("")} />
                </span>
              )}
              {search && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  "{search}" <RiCloseLine className="cursor-pointer" onClick={() => setSearch("")} />
                </span>
              )}
              <button
                onClick={() => { setType(""); setCity(""); setSearch(""); }}
                className="ml-auto text-[10px] text-red-400 hover:text-red-600 font-bold cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Results ── */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">

          {/* Count */}
          {!loading && filtered.length > 0 && (
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">
              {filtered.length} communit{filtered.length === 1 ? "y" : "ies"} found
            </p>
          )}

          {loading ? (
            <div className="flex justify-center py-24">
              <RiLoader4Line className="animate-spin text-3xl" style={{ color: DK }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${DK}0D` }}>
                <RiSearchLine className="text-2xl" style={{ color: DK }} />
              </div>
              <p className="font-bold text-base" style={{ color: DK }}>No communities found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting the filters above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filtered.map((c) => (
                <CommunityCard key={c._id} community={c} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CommunityListPage;
