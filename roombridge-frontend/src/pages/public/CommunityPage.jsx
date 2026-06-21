import React, { useEffect, useState } from "react";
import communityService from "../../services/communityService";
import CommunityCard from "../../components/community/CommunityCard";
import { RiLoader4Line, RiSearchLine, RiGroupLine } from "react-icons/ri";
import toast from "react-hot-toast";

const DK = "#012D1D";
const ACC = "#FFAB69";
const CR = "#F9F7F2";

const PAKISTAN_CITIES = [
  "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Peshawar", "Quetta",
  "Faisalabad", "Multan", "Hyderabad", "Sialkot", "Gujranwala",
  "Bahawalpur", "Sargodha", "Abbottabad", "Murree",
];

/*
  CommunityListPage — live, API-driven community browse grid.
  This replaces the static "Coming Soon" CommunityPage.jsx.
  Filterable by community type and city.
*/
const CommunityListPage = () => {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    document.title = "Communities — RoomBridge";
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (type) params.type = type;
    if (city) params.city = city;

    communityService
      .getCommunities(params)
      .then((res) => setCommunities(Array.isArray(res.data) ? res.data : []))
      .catch((err) =>
        toast.error(err.response?.data?.message || "Failed to load communities."),
      )
      .finally(() => setLoading(false));
  }, [type, city]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section
        className="py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden"
        style={{ backgroundColor: DK }}
      >
        {/* Decorative ambient glows */}
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ backgroundColor: ACC }}
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl opacity-5 pointer-events-none"
          style={{ backgroundColor: ACC }}
          aria-hidden="true"
        />

        <div className="max-w-3xl mx-auto relative">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                       text-xs font-semibold mb-6 border border-white/20"
            style={{ backgroundColor: "rgba(255,255,255,0.08)", color: ACC }}
          >
            <RiGroupLine /> RoomBridge Communities
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
            Connect With Your{" "}
            <span style={{ color: ACC }}>City's Community</span>
          </h1>

          <p className="text-white/60 text-base sm:text-lg mb-0 leading-relaxed max-w-xl mx-auto">
            Join city groups, get announcements, and chat with other seekers and
            owners across Pakistan.
          </p>
        </div>
      </section>

      {/* ── Content ─────────────────────────────────────────── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-8">
            <select
              id="community-type-filter"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-full border px-5 py-2.5 text-sm bg-white outline-none cursor-pointer transition-all"
              style={{ borderColor: "#E8E2D9", color: DK }}
              onFocus={(e) => (e.target.style.borderColor = DK)}
              onBlur={(e) => (e.target.style.borderColor = "#E8E2D9")}
            >
              <option value="">All types</option>
              <option value="city">City communities</option>
              <option value="announcement">Announcements</option>
              <option value="general">General</option>
            </select>

            <select
              id="community-city-filter"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-full border px-5 py-2.5 text-sm bg-white outline-none cursor-pointer transition-all"
              style={{ borderColor: "#E8E2D9", color: DK }}
              onFocus={(e) => (e.target.style.borderColor = DK)}
              onBlur={(e) => (e.target.style.borderColor = "#E8E2D9")}
            >
              <option value="">All cities</option>
              {PAKISTAN_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex justify-center py-24">
              <RiLoader4Line className="animate-spin text-3xl" style={{ color: DK }} />
            </div>
          ) : communities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: `${DK}0D` }}
              >
                <RiSearchLine className="text-2xl" style={{ color: DK }} />
              </div>
              <p className="font-bold text-base" style={{ color: DK }}>
                No communities found
              </p>
              <p className="text-sm text-gray-400 mt-1">Try changing the filters above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {communities.map((c) => (
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
