import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { updateUser, logout } from "../../redux/slices/authSlice";
import authService from "../../services/authService";
import toast from "react-hot-toast";
import {
  RiArrowLeftLine,
  RiMailLine,
  RiPhoneLine,
  RiMapPin2Line,
  RiEditLine,
  RiCheckLine,
  RiLoader4Line,
  RiLogoutBoxLine,
  RiLockLine,
  RiImageAddLine,
} from "react-icons/ri";

document.title = "Admin Profile — RoomBridge";

const CITIES = [
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

const AdminProfile = () => {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    city: user?.city || "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });
  const [pwErrors, setPwErrors] = useState({});
  const [savingPw, setSavingPw] = useState(false);
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
    if (!pwForm.newPassword || pwForm.newPassword.length < 8) {
      e.newPassword = "Min 8 characters";
    }
    if (pwForm.newPassword !== pwForm.confirm) {
      e.confirm = "Passwords do not match";
    }
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
        newPassword: pwForm.newPassword,
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
    try {
      await authService.logout();
    } catch {
      // Ignore logout API errors and clear client state anyway.
    }
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-white border-b border-border px-6 py-4 flex items-center gap-4">
        <Link
          to="/admin/dashboard"
          className="p-2 rounded-lg hover:bg-background text-text-secondary hover:text-primary transition-colors"
        >
          <RiArrowLeftLine className="text-xl" />
        </Link>
        <div>
          <h1 className="font-bold text-primary">My Profile</h1>
          <p className="text-text-secondary text-xs">
            Manage your account details (email cannot be changed)
          </p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-card border border-border shadow-card p-6">
          <div className="flex items-start gap-5">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-background flex items-center justify-center border-2 border-border">
                {uploadingPhoto ? (
                  <RiLoader4Line className="animate-spin text-3xl text-primary" />
                ) : user?.profilePhoto?.url ? (
                  <img
                    src={user.profilePhoto.url}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-primary">
                    {user?.name?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <label
                className="absolute -bottom-2 -right-2 w-7 h-7 bg-primary rounded-full flex items-center
                                 justify-center cursor-pointer hover:bg-secondary transition-colors shadow-card"
              >
                <RiImageAddLine className="text-white text-sm" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </label>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-primary">{user?.name}</h2>
                  <p className="text-text-secondary text-sm capitalize">{user?.role}</p>
                </div>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 text-sm text-secondary border border-secondary/30
                                     px-3 py-1.5 rounded-btn hover:bg-secondary hover:text-white transition-colors"
                  >
                    <RiEditLine /> Edit
                  </button>
                )}
              </div>
              <div className="mt-3 space-y-1.5 text-sm text-text-secondary">
                <p className="flex items-center gap-2">
                  <RiMailLine className="text-secondary" /> {user?.email}
                </p>
                {user?.phone && (
                  <p className="flex items-center gap-2">
                    <RiPhoneLine className="text-secondary" /> {user.phone}
                  </p>
                )}
                {user?.city && (
                  <p className="flex items-center gap-2">
                    <RiMapPin2Line className="text-secondary" /> {user.city}
                  </p>
                )}
              </div>
            </div>
          </div>

          {editing && (
            <form
              onSubmit={handleSaveProfile}
              className="mt-6 pt-6 border-t border-border space-y-4"
            >
              <div>
                <label className="label">Full Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="input"
                  placeholder="Your name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Phone</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="input"
                    placeholder="03xxxxxxxxx"
                  />
                </div>
                <div>
                  <label className="label">City</label>
                  <select
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="">Select city</option>
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="btn-secondary flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="btn-primary flex-1 justify-center gap-2"
                >
                  {savingProfile ? (
                    <RiLoader4Line className="animate-spin" />
                  ) : (
                    <RiCheckLine />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="bg-white rounded-card border border-border shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <RiLockLine className="text-secondary text-lg" />
              <h3 className="font-semibold text-primary">Change Password</h3>
            </div>
            <button
              onClick={() => setShowPwSection((s) => !s)}
              className="text-xs text-secondary hover:text-primary font-medium transition-colors"
            >
              {showPwSection ? "Cancel" : "Change"}
            </button>
          </div>

          {showPwSection && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="label">Current Password</label>
                <input
                  type="password"
                  value={pwForm.currentPassword}
                  onChange={(e) =>
                    setPwForm((f) => ({
                      ...f,
                      currentPassword: e.target.value,
                    }))
                  }
                  className={`input ${pwErrors.currentPassword ? "input-error" : ""}`}
                />
                {pwErrors.currentPassword && (
                  <p className="error-msg">{pwErrors.currentPassword}</p>
                )}
              </div>
              <div>
                <label className="label">New Password</label>
                <input
                  type="password"
                  value={pwForm.newPassword}
                  onChange={(e) =>
                    setPwForm((f) => ({ ...f, newPassword: e.target.value }))
                  }
                  className={`input ${pwErrors.newPassword ? "input-error" : ""}`}
                />
                {pwErrors.newPassword && (
                  <p className="error-msg">{pwErrors.newPassword}</p>
                )}
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input
                  type="password"
                  value={pwForm.confirm}
                  onChange={(e) =>
                    setPwForm((f) => ({ ...f, confirm: e.target.value }))
                  }
                  className={`input ${pwErrors.confirm ? "input-error" : ""}`}
                />
                {pwErrors.confirm && (
                  <p className="error-msg">{pwErrors.confirm}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={savingPw}
                className="btn-primary w-full justify-center gap-2"
              >
                {savingPw ? (
                  <RiLoader4Line className="animate-spin" />
                ) : (
                  <RiLockLine />
                )}
                Update Password
              </button>
            </form>
          )}
        </div>

        <div className="bg-white rounded-card border border-border shadow-card p-6">
          <h3 className="font-semibold text-primary mb-4">Account</h3>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-error border border-error/30
                             px-4 py-2 rounded-btn hover:bg-error hover:text-white transition-colors"
          >
            <RiLogoutBoxLine /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
