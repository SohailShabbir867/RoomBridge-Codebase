import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import adminService from "../../services/adminService";
import authService from "../../services/authService";
import { logout } from "../../redux/slices/authSlice";
import toast from "react-hot-toast";
import {
  RiDashboardLine,
  RiUserLine,
  RiHome4Line,
  RiCalendarCheckLine,
  RiFlagLine,
  RiLogoutBoxLine,
  RiArrowRightLine,
  RiLoader4Line,
  RiGroupLine,
  RiMenuLine,
  RiCloseLine,
  RiRefreshLine,
  RiMessageLine,
  RiMailLine,
} from "react-icons/ri";

document.title = "Admin Dashboard — RoomBridge";

/* ── Stat card ────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, sub, color, to }) => {
  const baseClass =
    "bg-white rounded-card border border-border p-2 sm:p-3 flex items-start gap-2 sm:gap-3 shadow-card transition-all group";

  const content = (
    <>
      <div
        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}
      >
        <Icon className="text-white text-sm sm:text-base" />
      </div>
      <div className="min-w-0">
        <p className="text-xl sm:text-2xl font-bold text-primary leading-none">{value ?? "—"}</p>
        <p className="text-xs sm:text-sm text-text-secondary group-hover:text-primary transition-colors mt-1">
          {label}
        </p>
        {sub && <p className="text-xs text-text-secondary mt-0.5">{sub}</p>}
      </div>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`${baseClass} hover:shadow-hover`}>
        {content}
      </Link>
    );
  }

  return <div className={baseClass}>{content}</div>;
};

/* ── Growth chart card (line + area + trend) ───────────────── */
const GrowthChartCard = ({ title, data = [], tone = "primary" }) => {
  const normalized = data.map((d, i) => ({
    label: d?.label || `M${i + 1}`,
    count: Number(d?.count || 0),
  }));

  const max = Math.max(...normalized.map((d) => d.count), 1);
  const first = normalized[0]?.count || 0;
  const last = normalized[normalized.length - 1]?.count || 0;
  const trendRaw = first > 0 ? ((last - first) / first) * 100 : last > 0 ? 100 : 0;
  const trend = Number(trendRaw.toFixed(1));
  const isUp = trend >= 0;

  const colorByTone = {
    primary: {
      line: "#1A3A5C",
      fill: "rgba(26,58,92,0.18)",
      chip: "bg-primary/10 text-primary border-primary/20",
      dot: "#1A3A5C",
    },
    secondary: {
      line: "#2C5F8A",
      fill: "rgba(44,95,138,0.18)",
      chip: "bg-secondary/10 text-secondary border-secondary/20",
      dot: "#2C5F8A",
    },
  };

  const palette = colorByTone[tone] || colorByTone.primary;
  const graphW = 420;
  const graphH = 136;
  const topPad = 16;
  const bottomPad = 24;

  const points = normalized.map((d, i) => {
    const x = normalized.length > 1 ? (i / (normalized.length - 1)) * graphW : graphW / 2;
    const usableH = graphH - topPad - bottomPad;
    const y = topPad + (1 - d.count / max) * usableH;
    return { ...d, x, y };
  });

  const linePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPath = points.length
    ? `M ${points[0].x} ${graphH - bottomPad} L ${points.map((p) => `${p.x} ${p.y}`).join(" L ")} L ${points[points.length - 1].x} ${graphH - bottomPad} Z`
    : "";

  const gradId = `growth-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <div className="bg-white rounded-card border border-border shadow-card p-3 sm:p-5">
      <div className="flex items-center justify-between gap-2 sm:gap-3 mb-4">
        <h3 className="font-semibold text-primary text-sm sm:text-base">{title}</h3>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${palette.chip}`}>
          {isUp ? "+" : ""}
          {trend}%
        </span>
      </div>

      {points.length === 0 ? (
        <p className="text-sm text-text-secondary py-8 text-center">
          No growth data available.
        </p>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-background/50 p-3">
            <svg
              viewBox={`0 0 ${graphW} ${graphH}`}
              className="w-full h-28 sm:h-36"
              role="img"
              aria-label={title}
            >
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={palette.fill} />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
              </defs>

              {[0.25, 0.5, 0.75].map((r) => (
                <line
                  key={r}
                  x1="0"
                  x2={graphW}
                  y1={topPad + r * (graphH - topPad - bottomPad)}
                  y2={topPad + r * (graphH - topPad - bottomPad)}
                  stroke="#e5e7eb"
                  strokeDasharray="4 4"
                />
              ))}

              <path d={areaPath} fill={`url(#${gradId})`} />
              <polyline
                points={linePoints}
                fill="none"
                stroke={palette.line}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {points.map((p) => (
                <circle
                  key={`${p.label}-${p.count}`}
                  cx={p.x}
                  cy={p.y}
                  r="3.8"
                  fill={palette.dot}
                  stroke="#fff"
                  strokeWidth="2"
                />
              ))}
            </svg>
          </div>

          <div className="flex justify-between mt-2 text-[10px] text-text-secondary">
            {normalized.map((d, i) => (
              <span key={`${d.label}-${i}`} className="truncate max-w-10" title={d.label}>
                {d.label.slice(0, 3)}
              </span>
            ))}
          </div>

          <div className="mt-3">
            <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-2">
              Monthly Results
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {normalized.map((d, i) => (
                <div
                  key={`monthly-${d.label}-${i}`}
                  className="bg-background rounded-lg p-2 border border-border flex items-center justify-between"
                >
                  <span className="text-[11px] text-text-secondary truncate" title={d.label}>
                    {d.label}
                  </span>
                  <span className="text-xs font-bold text-primary">{d.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-xs">
            <div className="bg-background rounded-lg p-2 border border-border">
              <p className="text-text-secondary">Current</p>
              <p className="font-bold text-primary text-sm">{last}</p>
            </div>
            <div className="bg-background rounded-lg p-2 border border-border">
              <p className="text-text-secondary">Peak</p>
              <p className="font-bold text-primary text-sm">{max}</p>
            </div>
            <div className="bg-background rounded-lg p-2 border border-border">
              <p className="text-text-secondary">Start</p>
              <p className="font-bold text-primary text-sm">{first}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const NAV = [
  { to: "/admin/dashboard", icon: RiDashboardLine, label: "Dashboard" },
  { to: "/admin/users", icon: RiGroupLine, label: "Manage Users" },
  { to: "/admin/listings", icon: RiHome4Line, label: "Manage Listings" },
  { to: "/admin/bookings", icon: RiCalendarCheckLine, label: "Bookings" },
  { to: "/admin/messages", icon: RiMessageLine, label: "Messages" },
  {
    to: "/admin/contact-messages",
    icon: RiMailLine,
    label: "Contact Messages",
  },
  { to: "/admin/reports", icon: RiFlagLine, label: "Reports" },
  { to: "/admin/profile", icon: RiUserLine, label: "My Profile" },
];

const AdminDashboard = () => {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sideOpen, setSideOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true,
  );

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await adminService.getStats();
      /*
        Backend returns { success, data: { users, listings, bookings,
          messages, reports, recent, growth } }
      */
      setStats(res.data || res);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load stats.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout API errors and clear client state anyway.
    }
    dispatch(logout());
    toast.success("Logged out.");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-accent/10 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-primary flex flex-col shadow-2xl
                         transition-transform duration-300
                         ${sideOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shrink-0">
              <span className="text-primary text-sm font-bold">R</span>
            </div>
            <span className="text-white font-bold text-lg truncate">
              Room<span className="text-accent">Bridge</span>
            </span>
          </Link>
          <button
            onClick={() => setSideOpen(false)}
            aria-label="Close sidebar"
            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <RiCloseLine className="text-xl" />
          </button>
        </div>

        <p className="text-white/40 text-xs px-4 pt-2 pb-3 border-b border-white/10">
          Admin Panel
        </p>

        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden shrink-0">
              {user?.profilePhoto?.url ? (
                <img
                  src={user.profilePhoto.url}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-accent font-bold">
                  {user?.name?.[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">
                {user?.name}
              </p>
              <p className="text-white/40 text-xs">Administrator</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => {
                if (window.innerWidth < 1024) setSideOpen(false);
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`
              }
            >
              <Icon className="text-base shrink-0" /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium
                             text-white/70 hover:text-error hover:bg-red-500/10 transition-all duration-150"
          >
            <RiLogoutBoxLine /> Logout
          </button>
        </div>
      </aside>

      {sideOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSideOpen(false)}
        />
      )}

      {!sideOpen && (
        <button
          onClick={() => setSideOpen(true)}
          aria-label="Open sidebar"
          className="fixed top-4 left-3 lg:left-4 z-50 w-10 h-10 rounded-full border border-primary
                     bg-primary text-white flex items-center justify-center shadow-card
                     hover:bg-secondary transition-colors"
        >
          <RiMenuLine className="text-xl" />
        </button>
      )}

      {/* Main */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-[margin] duration-300 ${
          sideOpen ? "lg:ml-64" : "lg:ml-0"
        }`}
      >
        <header
          className={`sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-border pr-3 sm:pr-6 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-3 ${
            sideOpen ? "pl-3 sm:pl-6 lg:pl-6" : "pl-14 sm:pl-16 lg:pl-20"
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="min-w-0">
              <h1 className="font-bold text-primary text-base sm:text-lg leading-tight truncate">
                Admin Dashboard
              </h1>
              <p className="text-text-secondary text-xs truncate">
                Platform overview & statistics
              </p>
            </div>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 text-sm text-secondary border border-secondary/30
                             px-3 py-1.5 rounded-btn hover:bg-secondary hover:text-white transition-colors disabled:opacity-60"
          >
            <RiRefreshLine className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </header>

        <main className="flex-1 p-3 sm:p-4 lg:p-6">
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <RiLoader4Line className="animate-spin text-4xl text-primary" />
            </div>
          ) : !stats ? (
            <div className="text-center py-24">
              <p className="text-text-secondary">Failed to load stats.</p>
              <button onClick={fetchStats} className="btn-primary mt-4">
                Retry
              </button>
            </div>
          ) : (
            <div className="max-w-[1400px] mx-auto">
              {/* ── Users row ─────────────────────────────── */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
                  Users
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
                  <StatCard
                    icon={RiGroupLine}
                    label="Total Users"
                    value={stats.users?.total}
                    color="bg-primary"
                    to="/admin/users"
                  />
                  <StatCard
                    icon={RiUserLine}
                    label="Seekers"
                    value={stats.users?.seekers}
                    color="bg-secondary"
                    to="/admin/users?role=seeker"
                  />
                  <StatCard
                    icon={RiHome4Line}
                    label="Owners"
                    value={stats.users?.owners}
                    color="bg-accent"
                    to="/admin/users?role=owner"
                    sub={`+${stats.recent?.newUsersLast7 || 0} this week`}
                  />
                  <StatCard
                    icon={RiUserLine}
                    label="Admins"
                    value={stats.users?.admins}
                    color="bg-primary/60"
                    to="/admin/users?role=admin"
                  />
                </div>
              </section>

              {/* ── Listings row ────────────────────────── */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
                  Listings
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5 sm:gap-3.5">
                  <StatCard
                    icon={RiHome4Line}
                    label="Total"
                    value={stats.listings?.total}
                    color="bg-primary"
                    to="/admin/listings"
                  />
                  <StatCard
                    icon={RiHome4Line}
                    label="Active"
                    value={stats.listings?.active}
                    color="bg-success"
                    to="/admin/listings?status=active"
                  />
                  <StatCard
                    icon={RiHome4Line}
                    label="Pending"
                    value={stats.listings?.pending}
                    color="bg-warning"
                    to="/admin/listings?status=pending"
                    sub="Need review"
                  />
                  <StatCard
                    icon={RiHome4Line}
                    label="Rejected"
                    value={stats.listings?.rejected}
                    color="bg-error"
                    to="/admin/listings?status=rejected"
                  />
                  <StatCard
                    icon={RiHome4Line}
                    label="Inactive"
                    value={stats.listings?.inactive}
                    color="bg-border text-text-secondary"
                    to="/admin/listings?status=inactive"
                  />
                </div>
              </section>

              {/* ── Bookings + Reports row ───────────────── */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
                  Activity
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3.5">
                  <StatCard
                    icon={RiCalendarCheckLine}
                    label="Total Bookings"
                    value={stats.bookings?.total}
                    color="bg-primary"
                    to="/admin/bookings"
                  />
                  <StatCard
                    icon={RiCalendarCheckLine}
                    label="Accepted"
                    value={stats.bookings?.accepted}
                    color="bg-success"
                    to="/admin/bookings?status=accepted"
                  />
                  <StatCard
                    icon={RiFlagLine}
                    label="Total Reports"
                    value={stats.reports?.total}
                    color="bg-error"
                    to="/admin/reports"
                  />
                  <StatCard
                    icon={RiFlagLine}
                    label="Pending Reports"
                    value={stats.reports?.pending}
                    color="bg-warning"
                    to="/admin/reports"
                    sub="Need action"
                  />
                  <StatCard
                    icon={RiMailLine}
                    label="Contact Messages"
                    value={stats.contactMessages?.total}
                    color="bg-secondary"
                    to="/admin/contact-messages"
                  />
                  <StatCard
                    icon={RiMailLine}
                    label="New Contacts"
                    value={stats.contactMessages?.new}
                    color="bg-accent"
                    to="/admin/contact-messages"
                    sub="Need response"
                  />
                </div>
              </section>

              {/* ── Growth charts ─────────────────────── */}
              {stats.growth && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-5">
                  <GrowthChartCard
                    title="User Growth (6 months)"
                    data={stats.growth.monthlyUsers || []}
                    tone="primary"
                  />
                  <GrowthChartCard
                    title="Listing Growth (6 months)"
                    data={stats.growth.monthlyListings || []}
                    tone="secondary"
                  />
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
