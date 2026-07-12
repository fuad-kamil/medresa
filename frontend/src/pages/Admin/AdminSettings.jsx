import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { User, Lock, Moon, Sun, Save, Globe, Trash2, Loader2, Bot, ShieldOff, ShieldCheck, AlertTriangle, X } from "lucide-react";
import toast from 'react-hot-toast';
import useAuthStore from "../../store/authStore";

// ─── Reusable styled confirmation modal ───────────────────────────────────────
function ConfirmModal({ open, onConfirm, onCancel, title, description, confirmLabel = "Confirm", danger = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Card */}
      <div className="relative z-10 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 max-w-md w-full p-8 animate-fadeIn">
        {/* Icon */}
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${danger ? "bg-red-100 dark:bg-red-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
          <AlertTriangle size={32} className={danger ? "text-red-500" : "text-amber-500"} />
        </div>
        {/* Close */}
        <button
          onClick={onCancel}
          className="absolute top-5 right-5 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 transition"
        >
          <X size={20} />
        </button>

        <h3 className="text-xl font-bold text-gray-800 dark:text-white text-center mb-2">{title}</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm text-center mb-8 leading-relaxed">{description}</p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl font-medium text-white transition ${
              danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-amber-500 hover:bg-amber-600"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Settings Page ────────────────────────────────────────────────────────
export default function AdminSettings() {
  const { user, login, theme, toggleTheme, token, language, setLanguage } = useAuthStore();

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Cleanup PDF State
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [showCleanupModal, setShowCleanupModal] = useState(false);

  // Bot Lock State
  const [botLocked, setBotLocked] = useState(false);
  const [botLockLoading, setBotLockLoading] = useState(false);
  const [botStatusLoading, setBotStatusLoading] = useState(true);
  const [showBotLockModal, setShowBotLockModal] = useState(false);

  // Fetch current bot lock status on mount
  useEffect(() => {
    const fetchBotStatus = async () => {
      try {
        const res = await axiosInstance.get("/admin/bot-status");
        setBotLocked(res.data.locked);
      } catch (err) {
        console.error("Failed to fetch bot status:", err);
      } finally {
        setBotStatusLoading(false);
      }
    };
    fetchBotStatus();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await axiosInstance.put("/admin/settings/profile", profileData);
      login(res.data.user, token);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await axiosInstance.put("/admin/settings/password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success(res.data.message || "Password updated successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Called after modal confirms
  const handleCleanupSubmit = async () => {
    setShowCleanupModal(false);
    setCleanupLoading(true);
    try {
      const res = await axiosInstance.delete("/admin/cleanup-reports");
      toast.success(res.data.message || "Cleanup successful!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cleanup reports.");
    } finally {
      setCleanupLoading(false);
    }
  };

  // Called after bot lock/unlock modal confirms
  const handleBotLockToggle = async () => {
    setShowBotLockModal(false);
    setBotLockLoading(true);
    try {
      const res = await axiosInstance.post("/admin/bot-lock", { locked: !botLocked });
      setBotLocked(res.data.locked);
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update bot status.");
    } finally {
      setBotLockLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Confirmation Modals */}
      <ConfirmModal
        open={showCleanupModal}
        onCancel={() => setShowCleanupModal(false)}
        onConfirm={handleCleanupSubmit}
        danger
        title="Delete All Report PDFs?"
        description="This will permanently delete ALL report card PDFs from Cloudinary. PDFs will be regenerated automatically the next time a parent or admin requests them. Student photos are never deleted."
        confirmLabel="Yes, Delete All"
      />

      <ConfirmModal
        open={showBotLockModal}
        onCancel={() => setShowBotLockModal(false)}
        onConfirm={handleBotLockToggle}
        danger={!botLocked}
        title={botLocked ? "Activate the Bot?" : "Lock the Bot?"}
        description={
          botLocked
            ? "The Telegram bot will start responding to parent messages again immediately."
            : "Parents will not be able to receive report cards via the Telegram bot until you re-activate it."
        }
        confirmLabel={botLocked ? "Yes, Activate" : "Yes, Lock Bot"}
      />

      <div>
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your admin profile and system preferences.</p>
      </div>

      {/* Theme Toggle */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1">Appearance</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Toggle between light and dark mode</p>
        </div>
        <button
          onClick={toggleTheme}
          className="p-4 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center gap-3 font-semibold"
        >
          {theme === "dark" ? <Sun size={24} className="text-amber-500" /> : <Moon size={24} className="text-emerald-600" />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      {/* Language Toggle */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1">Language</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Select system language</p>
        </div>
        <button
          onClick={() => setLanguage(language === "en" ? "am" : "en")}
          className="p-4 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center gap-3 font-semibold w-40 justify-center"
        >
          <Globe size={24} className="text-blue-500" />
          {language === "en" ? "English" : "አማርኛ"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Settings */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <User size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Profile Details</h2>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-800 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-800 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-800 dark:text-white"
              />
            </div>



            <button
              type="submit"
              disabled={profileLoading}
              className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition font-medium text-lg"
            >
              <Save size={20} />
              {profileLoading ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>

        {/* Password Settings */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Lock size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Change Password</h2>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-800 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-800 dark:text-white"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-800 dark:text-white"
                required
                minLength={6}
              />
            </div>



            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition font-medium text-lg"
            >
              <Lock size={20} />
              {passwordLoading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>

      {/* Telegram Bot Control */}
      <div className={`bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border ${botLocked ? "border-red-200 dark:border-red-900/40" : "border-emerald-100 dark:border-emerald-900/30"}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-3 rounded-xl ${botLocked ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"}`}>
            <Bot size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Telegram Bot Control</h2>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">Bot Status</h3>
              {botStatusLoading ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500">
                  <Loader2 size={12} className="animate-spin" /> Loading…
                </span>
              ) : botLocked ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                  <ShieldOff size={12} /> Locked
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck size={12} /> Active
                </span>
              )}
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xl">
              {botLocked
                ? "The Telegram bot is currently locked. Parents cannot receive report cards via Telegram."
                : "The Telegram bot is active. Parents can send their phone number to receive report cards."}
            </p>

          </div>

          <button
            onClick={() => setShowBotLockModal(true)}
            disabled={botLockLoading || botStatusLoading}
            className={`w-full md:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-xl transition font-medium text-lg shrink-0 text-white disabled:opacity-50 ${
              botLocked
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {botLockLoading
              ? <Loader2 size={20} className="animate-spin" />
              : botLocked
              ? <ShieldCheck size={20} />
              : <ShieldOff size={20} />}
            {botLockLoading ? "Updating…" : botLocked ? "Activate Bot" : "Lock Bot"}
          </button>
        </div>
      </div>

      {/* Data Management Settings */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-red-100 dark:border-red-900/30">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
            <Trash2 size={24} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Data Management</h2>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Delete All Report Card PDFs</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 max-w-xl">
              Manually delete <strong>all</strong> report card PDFs stored on Cloudinary. Use this to free up storage space. PDFs will be regenerated automatically next time a parent or admin requests them. Student photos are <strong>never</strong> deleted.
            </p>

          </div>

          <button
            onClick={() => setShowCleanupModal(true)}
            disabled={cleanupLoading}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-xl transition font-medium text-lg shrink-0"
          >
            {cleanupLoading ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
            {cleanupLoading ? "Cleaning..." : "Clean Up PDFs"}
          </button>
        </div>
      </div>
    </div>
  );
}
