import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { updateUser, logout } from "../../redux/slices/authSlice";
import authService from "../../services/authService";
import RoleDashboardLayout from "../../components/dashboard/common/RoleDashboardLayout";
import toast from "react-hot-toast";
import {
  RiMailLine,
  RiPhoneLine,
  RiMapPin2Line,
  RiEditLine,
  RiCheckLine,
  RiLoader4Line,
  RiLogoutBoxLine,
  RiLockLine,
  RiImageAddLine,
  RiCloseLine,
  RiUserLine,
} from "react-icons/ri";

document.title = "Owner Profile — RoomBridge";

/* ── Design tokens ──────────────────────────────────────────── */
const DK  = "#012D1D";
const BTN = "#8E4E14";
const ACC = "#FFAB69";

const CITIES = [
  "Karachi","Lahore","Islamabad","Rawalpindi","Peshawar","Quetta",
  "Faisalabad","Multan","Hyderabad","Sialkot","Gujranwala","Bahawalpur",
  "Sargodha","Abbottabad","Murree",
];

/* ── Input style helper ──────────────────────────────────────── */
const inputCls = "w-full rounded-xl py-3 px-4 text-sm outline-none transition-all border focus:ring-2";
const inputStyle = { backgroundColor: "#F7F4EF", borderColor: "#E8E2D9" };

const OwnerProfile = () => {
  const { user }   = useSelector((s) => s.auth);
  const dispatch   = useDispatch();
  const navigate   = useNavigate();

  const [editing, setEditing]           = useState(false);
  const [form, setForm]                 = useState({
    name:  user?.name  || "",
    phone: user?.phone || "",
    city:  user?.city  || "",
  });
  const [savingProfile, setSavingProfile]   = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [pwForm, setPwForm]       = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwErrors, setPwErrors]   = useState({});
  const [savingPw, setSavingPw]   = useState(false);
  const [showPwSection, setShowPwSection] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await authService.updateProfile(form);
      const updated = res.data?.user || res.user || { ...user, ...form };
      dispatch(updateUser(updated));
      toast.success("Profile updated!");
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingPhoto(true);
      const fd = new FormData();
      fd.append("photo", file);
      const res = await authService.updateProfilePhoto(fd);
      const updated = res.data?.user || res.user || user;
      dispatch(updateUser(updated));
      toast.success("Profile photo updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const validatePw = () => {
    const e = {};
    if (!pwForm.currentPassword) e.currentPassword = "Required";
    if (!pwForm.newPassword || pwForm.newPassword.length < 8) e.newPassword = "Min 8 characters";
    if (pwForm.newPassword !== pwForm.confirm) e.confirm = "Passwords do not match";
    setPwErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!validatePw()) return;
    try {
      setSavingPw(true);
      await authService.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword:     pwForm.newPassword,
      });
      toast.success("Password changed successfully!");
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
      setShowPwSection(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password.");
    } finally {
      setSavingPw(false);
    }
  };

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    dispatch(logout());
    navigate("/login");
  };

  return (
    <RoleDashboardLayout role="owner" title="My Profile" subtitle="Manage your account details">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Profile card ─────────────────────────────────────── */}
        <div
          className="bg-white rounded-2xl border shadow-sm p-6"
          style={{ borderColor: "#E8E2D9" }}
        >
          {/* Avatar + name row */}
          <div className="flex items-start gap-5 mb-6">
            {/* Photo */}
            <div className="relative shrink-0">
              <div
                className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center border-2 font-bold text-2xl"
                style={{ backgroundColor: `${DK}10`, borderColor: "#E8E2D9", color: DK }}
              >
                {uploadingPhoto ? (
                  <RiLoader4Line className="animate-spin text-3xl" style={{ color: DK }} />
                ) : user?.profilePhoto?.url ? (
                  <img src={user.profilePhoto.url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name?.[0]?.toUpperCase() || <RiUserLine />
                )}
              </div>
              <label
                className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center
                           cursor-pointer shadow-md text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: BTN }}
              >
                <RiImageAddLine className="text-sm" />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>

            {/* Name + info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-xl font-extrabold" style={{ color: DK }}>{user?.name}</h2>
                  <p className="text-sm text-gray-400 capitalize mt-0.5">{user?.role}</p>
                </div>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border
                               text-white hover:opacity-90 transition-all"
                    style={{ backgroundColor: BTN, borderColor: BTN }}
                  >
                    <RiEditLine /> Edit
                  </button>
                )}
              </div>
              <div className="mt-3 space-y-1.5 text-sm text-gray-500">
                <p className="flex items-center gap-2">
                  <RiMailLine style={{ color: ACC }} /> {user?.email}
                </p>
                {user?.phone && (
                  <p className="flex items-center gap-2">
                    <RiPhoneLine style={{ color: ACC }} /> {user.phone}
                  </p>
                )}
                {user?.city && (
                  <p className="flex items-center gap-2">
                    <RiMapPin2Line style={{ color: ACC }} /> {user.city}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Edit form */}
          {editing && (
            <form
              onSubmit={handleSaveProfile}
              className="pt-5 border-t space-y-4"
              style={{ borderColor: "#F3EFE9" }}
            >
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Full Name
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className={inputCls}
                  style={inputStyle}
                  placeholder="Your name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    Phone
                  </label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className={inputCls}
                    style={inputStyle}
                    placeholder="03xxxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    City
                  </label>
                  <select
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    className={inputCls}
                    style={inputStyle}
                  >
                    <option value="">Select city</option>
                    {CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border
                             text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all"
                  style={{ borderColor: "#E8E2D9" }}
                >
                  <RiCloseLine /> Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                             text-white text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-all"
                  style={{ backgroundColor: DK }}
                >
                  {savingProfile ? <RiLoader4Line className="animate-spin" /> : <RiCheckLine />}
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ── Change Password ───────────────────────────────────── */}
        <div
          className="bg-white rounded-2xl border shadow-sm p-6"
          style={{ borderColor: "#E8E2D9" }}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <RiLockLine style={{ color: ACC }} className="text-lg" />
              <h3 className="font-bold text-sm" style={{ color: DK }}>Change Password</h3>
            </div>
            <button
              onClick={() => setShowPwSection((s) => !s)}
              className="text-xs font-bold hover:opacity-75 transition-opacity"
              style={{ color: BTN }}
            >
              {showPwSection ? "Cancel" : "Change"}
            </button>
          </div>
          {!showPwSection && (
            <p className="text-xs text-gray-400 mt-1">Keep your account secure with a strong password.</p>
          )}

          {showPwSection && (
            <form
              onSubmit={handleChangePassword}
              className="mt-5 pt-5 border-t space-y-4"
              style={{ borderColor: "#F3EFE9" }}
            >
              {[
                { label: "Current Password", key: "currentPassword" },
                { label: "New Password",     key: "newPassword" },
                { label: "Confirm New Password", key: "confirm" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    {label}
                  </label>
                  <input
                    type="password"
                    value={pwForm[key]}
                    onChange={(e) => setPwForm((f) => ({ ...f, [key]: e.target.value }))}
                    className={`${inputCls} ${pwErrors[key] ? "ring-1 ring-red-400" : ""}`}
                    style={inputStyle}
                  />
                  {pwErrors[key] && (
                    <p className="text-red-500 text-xs mt-1 font-medium">{pwErrors[key]}</p>
                  )}
                </div>
              ))}
              <button
                type="submit"
                disabled={savingPw}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                           text-white text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-all"
                style={{ backgroundColor: DK }}
              >
                {savingPw ? <RiLoader4Line className="animate-spin" /> : <RiLockLine />}
                Update Password
              </button>
            </form>
          )}
        </div>

        {/* ── Account / Danger zone ─────────────────────────────── */}
        <div
          className="bg-white rounded-2xl border shadow-sm p-6"
          style={{ borderColor: "#E8E2D9" }}
        >
          <h3 className="font-bold text-sm mb-4" style={{ color: DK }}>Account</h3>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl border
                       text-red-500 hover:bg-red-50 transition-all"
            style={{ borderColor: "#FECACA" }}
          >
            <RiLogoutBoxLine /> Sign Out
          </button>
        </div>

      </div>
    </RoleDashboardLayout>
  );
};

export default OwnerProfile;
