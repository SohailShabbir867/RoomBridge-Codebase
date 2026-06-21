import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import adminService from "../../services/adminService";
import RoleDashboardLayout from "../../components/dashboard/common/RoleDashboardLayout";
import toast from "react-hot-toast";
import {
  RiUserLine,
  RiHome4Line,
  RiCalendarCheckLine,
  RiFlagLine,
  RiArrowRightLine,
  RiLoader4Line,
  RiGroupLine,
  RiRefreshLine,
  RiMailLine,
  RiLineChartLine,
  RiShieldCheckLine,
  RiAlertLine,
} from "react-icons/ri";

document.title = "Admin Dashboard — RoomBridge";

/* ── Design tokens ──────────────────────────────────────────── */
const DK  = "#012D1D";
const BTN = "#8E4E14";
const ACC = "#FFAB69";
const CR  = "#F7F4EF";

/* ── Stat card ───────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, sub, accent, to }) => {
  const inner = (
    <div
      className="bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-4
                 hover:shadow-md transition-all group cursor-pointer"
      style={{ borderColor: "#E8E2D9" }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${accent}18` }}
      >
        <Icon className="text-xl" style={{ color: accent }} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold leading-none" style={{ color: DK }}>
          {value ?? "—"}
        </p>
        <p className="text-xs text-gray-400 mt-1 group-hover:text-gray-600 transition-colors leading-snug">
          {label}
        </p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
};

/* ── Performance Analytics SVG chart ─────────────────────────── */
const PerformanceChart = ({ title, data = [], accent, gradientId }) => {
  const normalized = data.map((d, i) => ({
    label: d?.label || `M${i + 1}`,
    count: Number(d?.count || 0),
  }));
  const max   = Math.max(...normalized.map((d) => d.count), 1);
  const first = normalized[0]?.count || 0;
  const last  = normalized[normalized.length - 1]?.count || 0;
  const trendRaw = first > 0 ? ((last - first) / first) * 100 : last > 0 ? 100 : 0;
  const trend = Number(trendRaw.toFixed(1));
  const isUp  = trend >= 0;

  const W = 420, H = 120, topPad = 12, botPad = 20;
  const pts = normalized.map((d, i) => {
    const x = normalized.length > 1 ? (i / (normalized.length - 1)) * W : W / 2;
    const y = topPad + (1 - d.count / max) * (H - topPad - botPad);
    return { ...d, x, y };
  });
  const linePts = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const area    = pts.length
    ? `M ${pts[0].x} ${H - botPad} L ${pts.map((p) => `${p.x} ${p.y}`).join(" L ")} L ${pts[pts.length - 1].x} ${H - botPad} Z`
    : "";

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5" style={{ borderColor: "#E8E2D9" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Performance Analytics</p>
          <h3 className="font-extrabold text-sm mt-0.5" style={{ color: DK }}>{title}</h3>
        </div>
        <span
          className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
          style={{
            backgroundColor: isUp ? "#D1FAE5" : "#FEE2E2",
            color:           isUp ? "#065F46" : "#991B1B",
          }}
        >
          <RiLineChartLine className={isUp ? "" : "rotate-180"} />
          {isUp ? "+" : ""}{trend}%
        </span>
      </div>

      {/* Chart */}
      {pts.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">No data available.</p>
      ) : (
        <>
          <div
            className="rounded-xl p-3 mb-3"
            style={{ backgroundColor: CR }}
          >
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-24" role="img" aria-label={title}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={accent} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={accent} stopOpacity="0"   />
                </linearGradient>
              </defs>
              {[0.33, 0.66].map((r) => (
                <line
                  key={r}
                  x1="0" x2={W}
                  y1={topPad + r * (H - topPad - botPad)}
                  y2={topPad + r * (H - topPad - botPad)}
                  stroke="#E8E2D9" strokeDasharray="4 3"
                />
              ))}
              <path d={area} fill={`url(#${gradientId})`} />
              <polyline
                points={linePts}
                fill="none"
                stroke={accent}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {pts.map((p) => (
                <circle
                  key={p.label}
                  cx={p.x} cy={p.y} r="4"
                  fill={accent} stroke="#fff" strokeWidth="2"
                />
              ))}
            </svg>
          </div>

          {/* Month labels */}
          <div className="flex justify-between text-[10px] text-gray-400 px-1 mb-3">
            {normalized.map((d, i) => (
              <span key={`${d.label}-${i}`}>{d.label.slice(0, 3)}</span>
            ))}
          </div>

          {/* Summary row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Start",   val: first },
              { label: "Peak",    val: max   },
              { label: "Current", val: last  },
            ].map(({ label, val }) => (
              <div
                key={label}
                className="rounded-xl p-2.5 text-center border"
                style={{ backgroundColor: CR, borderColor: "#E8E2D9" }}
              >
                <p className="text-[10px] text-gray-400">{label}</p>
                <p className="font-extrabold text-sm mt-0.5" style={{ color: DK }}>{val}</p>
              </div>
            ))}
          </div>

          {/* Monthly breakdown */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {normalized.map((d, i) => (
              <div
                key={`mb-${i}`}
                className="flex items-center justify-between rounded-lg px-2.5 py-1.5 border text-xs"
                style={{ backgroundColor: CR, borderColor: "#E8E2D9" }}
              >
                <span className="text-gray-400 truncate">{d.label}</span>
                <span className="font-bold ml-2" style={{ color: DK }}>{d.count}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ── Section heading ─────────────────────────────────────────── */
const SectionLabel = ({ children }) => (
  <p
    className="text-[10px] font-black uppercase tracking-widest mb-3"
    style={{ color: `${DK}80` }}
  >
    {children}
  </p>
);

/* ── Quick link row ──────────────────────────────────────────── */
const QuickLink = ({ to, icon: Icon, label, count, accent }) => (
  <Link
    to={to}
    className="flex items-center justify-between px-4 py-3 rounded-xl border bg-white
               hover:shadow-sm transition-all group"
    style={{ borderColor: "#E8E2D9" }}
  >
    <div className="flex items-center gap-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${accent}18` }}
      >
        <Icon className="text-sm" style={{ color: accent }} />
      </div>
      <span className="text-sm font-semibold" style={{ color: DK }}>{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {count !== undefined && (
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${accent}18`, color: accent }}
        >
          {count}
        </span>
      )}
      <RiArrowRightLine className="text-gray-300 group-hover:text-gray-500 transition-colors" />
    </div>
  </Link>
);

/* ── Main component ──────────────────────────────────────────── */
const AdminDashboard = () => {
  const { user }   = useSelector((s) => s.auth);
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await adminService.getStats();
      setStats(res.data || res);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load stats.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <RoleDashboardLayout
      role="admin"
      title="Admin Dashboard"
      subtitle="Platform overview & analytics"
      headerAction={
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 text-xs font-bold text-white px-4 py-2 rounded-xl
                     hover:opacity-90 disabled:opacity-60 transition-all"
          style={{ backgroundColor: BTN }}
        >
          <RiRefreshLine className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <RiLoader4Line className="animate-spin text-4xl" style={{ color: DK }} />
        </div>
      ) : !stats ? (
        <div className="text-center py-24">
          <p className="text-gray-400 mb-4">Failed to load stats.</p>
          <button
            onClick={fetchStats}
            className="inline-flex items-center gap-2 text-white text-sm font-bold px-5 py-2.5 rounded-xl"
            style={{ backgroundColor: DK }}
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto space-y-7">

          {/* ── Welcome banner ───────────────────────────────── */}
          <div
            className="rounded-2xl p-5 flex items-center justify-between gap-4"
            style={{ background: `linear-gradient(120deg, ${DK} 60%, #024a2e)` }}
          >
            <div>
              <p className="text-white/60 text-xs font-medium">{greeting}, {user?.name?.split(" ")[0] || "Admin"} 👋</p>
              <h2 className="text-white font-extrabold text-lg mt-0.5">Platform is Running Smoothly</h2>
              <p className="text-white/50 text-xs mt-1">
                {stats.users?.total || 0} total users · {stats.listings?.active || 0} active listings
              </p>
            </div>
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${ACC}20` }}
            >
              <RiShieldCheckLine className="text-2xl" style={{ color: ACC }} />
            </div>
          </div>

          {/* ── Users ────────────────────────────────────────── */}
          <section>
            <SectionLabel>Users</SectionLabel>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard icon={RiGroupLine}   label="Total Users" value={stats.users?.total}   accent={DK}      to="/admin/users" />
              <StatCard icon={RiUserLine}    label="Seekers"     value={stats.users?.seekers} accent="#2563EB" to="/admin/users?role=seeker" />
              <StatCard icon={RiHome4Line}   label="Owners"      value={stats.users?.owners}  accent={BTN}     to="/admin/users?role=owner"
                        sub={`+${stats.recent?.newUsersLast7 || 0} this week`} />
              <StatCard icon={RiShieldCheckLine} label="Admins"  value={stats.users?.admins}  accent="#7C3AED" to="/admin/users?role=admin" />
            </div>
          </section>

          {/* ── Listings ──────────────────────────────────────── */}
          <section>
            <SectionLabel>Listings</SectionLabel>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <StatCard icon={RiHome4Line} label="Total"    value={stats.listings?.total}    accent={DK}      to="/admin/listings" />
              <StatCard icon={RiHome4Line} label="Active"   value={stats.listings?.active}   accent="#16A34A" to="/admin/listings?status=active" />
              <StatCard icon={RiHome4Line} label="Pending"  value={stats.listings?.pending}  accent="#D97706" to="/admin/listings?status=pending" sub="Need review" />
              <StatCard icon={RiHome4Line} label="Rejected" value={stats.listings?.rejected} accent="#DC2626" to="/admin/listings?status=rejected" />
              <StatCard icon={RiHome4Line} label="Inactive" value={stats.listings?.inactive} accent="#6B7280" to="/admin/listings?status=inactive" />
            </div>
          </section>

          {/* ── Activity ─────────────────────────────────────── */}
          <section>
            <SectionLabel>Activity</SectionLabel>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard icon={RiCalendarCheckLine} label="Total Bookings"    value={stats.bookings?.total}        accent={DK}      to="/admin/bookings" />
              <StatCard icon={RiCalendarCheckLine} label="Accepted"          value={stats.bookings?.accepted}     accent="#16A34A" to="/admin/bookings?status=accepted" />
              <StatCard icon={RiFlagLine}          label="Total Reports"     value={stats.reports?.total}         accent="#DC2626" to="/admin/reports" />
              <StatCard icon={RiAlertLine}         label="Pending Reports"   value={stats.reports?.pending}       accent="#D97706" to="/admin/reports" sub="Need action" />
              <StatCard icon={RiMailLine}          label="Contact Messages"  value={stats.contactMessages?.total} accent="#2563EB" to="/admin/contact-messages" />
              <StatCard icon={RiMailLine}          label="New Contacts"      value={stats.contactMessages?.new}   accent={BTN}    to="/admin/contact-messages" sub="Need response" />
            </div>
          </section>

          {/* ── Performance Analytics charts ──────────────────── */}
          {stats.growth && (
            <section>
              <SectionLabel>Performance Analytics</SectionLabel>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <PerformanceChart
                  title="User Growth (6 months)"
                  data={stats.growth.monthlyUsers || []}
                  accent={DK}
                  gradientId="grad-users"
                />
                <PerformanceChart
                  title="Listing Growth (6 months)"
                  data={stats.growth.monthlyListings || []}
                  accent={BTN}
                  gradientId="grad-listings"
                />
              </div>
            </section>
          )}

          {/* ── Quick Navigation ──────────────────────────────── */}
          <section>
            <SectionLabel>Quick Navigation</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <QuickLink to="/admin/users"           icon={RiGroupLine}        label="Manage Users"      count={stats.users?.total}         accent={DK}      />
              <QuickLink to="/admin/listings"        icon={RiHome4Line}        label="Manage Listings"   count={stats.listings?.pending}    accent={BTN}     />
              <QuickLink to="/admin/bookings"        icon={RiCalendarCheckLine} label="View Bookings"   count={stats.bookings?.total}      accent="#2563EB" />
              <QuickLink to="/admin/reports"         icon={RiFlagLine}         label="Pending Reports"   count={stats.reports?.pending}     accent="#DC2626" />
              <QuickLink to="/admin/contact-messages" icon={RiMailLine}        label="Contact Messages"  count={stats.contactMessages?.new} accent="#D97706" />
            </div>
          </section>

        </div>
      )}
    </RoleDashboardLayout>
  );
};

export default AdminDashboard;
