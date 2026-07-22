import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { User, Lock, Moon, Sun, Save, Globe, Trash2, Loader2, Bot, ShieldOff, ShieldCheck, AlertTriangle, X, Pencil, Check, Settings2, Copy } from "lucide-react";
import toast from 'react-hot-toast';
import useAuthStore from "../../store/authStore";

// ─── Reusable styled confirmation modal ───────────────────────────────────────
function ConfirmModal({ open, onConfirm, onCancel, title, description, confirmLabel = "Confirm", danger = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Card */}
      <div className="relative z-10 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 max-w-md w-full p-6 sm:p-8 animate-fadeIn">
        {/* Icon */}
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${danger ? "bg-red-100 dark:bg-red-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
          <AlertTriangle size={32} className={danger ? "text-red-500" : "text-amber-500"} />
        </div>
        {/* Close */}
        <button
          onClick={onCancel}
          className="absolute top-5 right-5 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all hover:scale-105 active:scale-95 focus:ring-2 focus:ring-emerald-500"
          title="Close Modal"
        >
          <X size={20} />
        </button>

        <h3 className="text-xl font-bold text-gray-800 dark:text-white text-center mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm text-center mb-8 leading-relaxed">{description}</p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl font-bold text-white transition-all shadow-md ${
              danger
                ? "bg-red-600 hover:bg-red-700 shadow-red-600/20"
                : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Settings Page ────────────────────────────────────────────────────────
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

  // Online Exam Lock State
  const [examLocked, setExamLocked] = useState(false);
  const [showExamLockModal, setShowExamLockModal] = useState(false);

  useEffect(() => {
    fetchExamLockStatus();
  }, []);

  const fetchExamLockStatus = async () => {
    try {
      const res = await axiosInstance.get("/exams/system-status");
      setExamLocked(res.data.isLocked);
    } catch (err) {}
  };

  const handleExamLockToggle = async () => {
    setShowExamLockModal(false);
    try {
      const res = await axiosInstance.post("/exams/system-lock", { isLocked: !examLocked });
      setExamLocked(res.data.isLocked);
      toast.success(res.data.isLocked ? "Online examination system locked!" : "Online examination system unlocked!");
    } catch (err) {
      toast.error("Failed to update exam system lock status.");
    }
  };

  // Copy / Edit Invite Code state
  const [copied, setCopied] = useState(false);
  const [inviteCode, setInviteCode] = useState("ALI_JOIN_2026");
  const [isEditingInvite, setIsEditingInvite] = useState(false);
  const [newInviteCode, setNewInviteCode] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    toast.success("Invitation code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdateInviteCode = async () => {
    if (!newInviteCode.trim()) {
      toast.error("Invitation code cannot be empty.");
      return;
    }
    setInviteLoading(true);
    try {
      const res = await axiosInstance.put("/admin/settings/invite-code", {
        inviteCode: newInviteCode.trim()
      });
      setInviteCode(res.data.inviteCode);
      setIsEditingInvite(false);
      toast.success("Invitation code updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update invitation code.");
    } finally {
      setInviteLoading(false);
    }
  };

  // Fetch bot status & invite code on mount
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
    const fetchInviteCode = async () => {
      try {
        const res = await axiosInstance.get("/admin/settings/invite-code");
        setInviteCode(res.data.inviteCode);
      } catch (err) {
        console.error("Failed to fetch invite code:", err);
      }
    };
    fetchBotStatus();
    fetchInviteCode();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await axiosInstance.put("/admin/settings/profile", profileData);
      login(res.data.user, token);
      toast.success("Profile details updated successfully!");
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
      toast.success(res.data.message || "Cloud Storage PDFs cleaned up successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cleanup report PDFs.");
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
      toast.success(res.data.message || (res.data.locked ? "Telegram bot locked." : "Telegram bot activated."));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update bot status.");
    } finally {
      setBotLockLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Confirmation Modals */}
      <ConfirmModal
        open={showCleanupModal}
        onCancel={() => setShowCleanupModal(false)}
        onConfirm={handleCleanupSubmit}
        danger
        title="Delete All Report PDFs?"
        description="This will permanently delete ALL report card PDFs from Cloudinary. PDFs will be regenerated automatically the next time a parent or admin requests them. Student photos are never deleted."
        confirmLabel="Yes, Delete All PDFs"
      />

      <ConfirmModal
        open={showBotLockModal}
        onCancel={() => setShowBotLockModal(false)}
        onConfirm={handleBotLockToggle}
        danger={!botLocked}
        title={botLocked ? "Activate the Bot?" : "Lock Telegram Bot?"}
        description={
          botLocked
            ? "The Telegram bot will start responding to parent message queries again."
            : "Parents will not be able to receive report cards via the Telegram bot until unlocked."
        }
        confirmLabel={botLocked ? "Yes, Activate Bot" : "Yes, Lock Bot"}
      />

      <ConfirmModal
        open={showExamLockModal}
        onCancel={() => setShowExamLockModal(false)}
        onConfirm={handleExamLockToggle}
        danger={!examLocked}
        title={examLocked ? "Unlock Online Exam System?" : "Lock Online Exam System?"}
        description={
          examLocked
            ? "Students will be allowed to log in and take active online exams."
            : "Students will be blocked from accessing online exam papers until unlocked."
        }
        confirmLabel={examLocked ? "Yes, Unlock System" : "Yes, Lock Exam System"}
      />

      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-800 dark:text-white mb-2 tracking-tight">Admin Settings</h1>
        <p className="text-gray-600 dark:text-gray-300 font-medium text-sm">
          Manage your administrator profile, teacher invite credentials, and system preferences.
        </p>
      </div>

      {/* Merged Preferences Card (Appearance & Language Stacked Rows) */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Settings2 size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">System Preferences</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Customize visual theme and interface language</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Row 1: Appearance */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-800 dark:text-white text-base">Appearance</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Toggle between light and dark visual themes</p>
            </div>
            <button
              onClick={() => {
                toggleTheme();
                toast.success(`Switched to ${theme === "dark" ? "Light" : "Dark"} mode`);
              }}
              className="px-5 py-3.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-2xl transition-all flex items-center gap-3 font-semibold text-sm cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] focus:ring-2 focus:ring-emerald-500"
              title="Toggle Theme Mode"
            >
              {theme === "dark" ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-emerald-600" />}
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </button>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800/80" />

          {/* Row 2: Language */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-800 dark:text-white text-base">Language</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Select system interface language</p>
            </div>
            <button
              onClick={() => {
                const nextLang = language === "en" ? "am" : "en";
                setLanguage(nextLang);
                toast.success(`Language changed to ${nextLang === "en" ? "English" : "Amharic"}`);
              }}
              className="px-5 py-3.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-2xl transition-all flex items-center gap-3 font-semibold text-sm cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] focus:ring-2 focus:ring-emerald-500 min-w-[140px] justify-center"
              title="Switch Language"
            >
              <Globe size={20} className="text-blue-500" />
              <span>{language === "en" ? "English" : "አማርኛ"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Teacher Invitation Code Card */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-100 dark:border-emerald-900/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1">Teacher Invitation Code</h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm max-w-xl">
            This secret registration code is required by new Ustazs to sign up. Share this code with authorized teachers.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {isEditingInvite ? (
            <div className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="text"
                value={newInviteCode}
                onChange={(e) => setNewInviteCode(e.target.value)}
                className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl font-mono font-bold text-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-center tracking-wider w-full md:w-auto min-w-[160px]"
                placeholder="Enter new code"
                disabled={inviteLoading}
              />
              <button
                onClick={handleUpdateInviteCode}
                disabled={inviteLoading}
                className="p-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer shadow-md focus:ring-2 focus:ring-emerald-500"
                title="Save Invitation Code"
              >
                {inviteLoading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
              </button>
              <button
                onClick={() => setIsEditingInvite(false)}
                disabled={inviteLoading}
                className="p-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer focus:ring-2 focus:ring-gray-400"
                title="Cancel Edit"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <>
              <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-5 py-3.5 rounded-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400 select-all tracking-wider text-center flex-1 md:flex-none min-w-[160px]">
                {inviteCode}
              </div>
              <button
                onClick={() => {
                  setNewInviteCode(inviteCode);
                  setIsEditingInvite(true);
                }}
                className="p-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl transition-all flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 focus:ring-2 focus:ring-emerald-500"
                title="Edit Invitation Code"
              >
                <Pencil size={20} />
              </button>
              <button
                onClick={handleCopyCode}
                className="px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-2xl transition-all font-semibold flex items-center gap-2 shadow-md shadow-emerald-500/20 w-full md:w-auto justify-center cursor-pointer focus:ring-2 focus:ring-emerald-500"
                title="Copy Code to Clipboard"
              >
                <Copy size={18} />
                <span>{copied ? "Copied!" : "Copy Code"}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Profile & Password Grid (Responsive: 1-col on screens <768px, 2-col on >=768px) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Details Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <User size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Profile Details</h2>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Name</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-800 dark:text-white outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-800 dark:text-white outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-800 dark:text-white outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl transition-all font-semibold text-base shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer focus:ring-2 focus:ring-emerald-500"
              title="Save Profile Details"
            >
              {profileLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              <span>{profileLoading ? "Saving Profile..." : "Save Profile"}</span>
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Lock size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Change Password</h2>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-800 dark:text-white outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">New Password</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-800 dark:text-white outline-none"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-800 dark:text-white outline-none"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl transition-all font-semibold text-base shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer focus:ring-2 focus:ring-emerald-500"
              title="Update Account Password"
            >
              {passwordLoading ? <Loader2 className="animate-spin" size={20} /> : <Lock size={20} />}
              <span>{passwordLoading ? "Updating Password..." : "Update Password"}</span>
            </button>
          </form>
        </div>
      </div>

      {/* ─── DANGER ZONE SECTION ───────────────────────────────────────────── */}
      <div className="pt-8 border-t border-red-500/20 dark:border-red-900/30 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-red-600 dark:text-red-400 tracking-tight">Danger Zone</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">
              ⚠️ Danger Zone — these actions affect live system operations and active users.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Card 1: Telegram Bot Control */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-red-200 dark:border-red-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
                  <Bot size={20} />
                </div>
                <h3 className="font-bold text-gray-800 dark:text-white text-lg">Telegram Bot Control</h3>
                {botStatusLoading ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-400">
                    <Loader2 size={12} className="animate-spin" /> Checking status…
                  </span>
                ) : botLocked ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                    <ShieldOff size={12} /> Locked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck size={12} /> Active
                  </span>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm max-w-xl">
                {botLocked
                  ? "The Telegram bot is currently locked. Parents cannot receive report cards via Telegram."
                  : "The Telegram bot is active. Parents can send their phone number to receive report cards."}
              </p>
            </div>

            <button
              onClick={() => setShowBotLockModal(true)}
              disabled={botLockLoading || botStatusLoading}
              className={`w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl transition-all font-semibold text-sm shrink-0 cursor-pointer disabled:opacity-50 focus:ring-2 ${
                botLocked
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 focus:ring-emerald-500"
                  : "bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 focus:ring-gray-400"
              }`}
              title={botLocked ? "Activate Telegram Bot" : "Lock Telegram Bot"}
            >
              {botLockLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : botLocked ? (
                <ShieldCheck size={18} />
              ) : (
                <ShieldOff size={18} />
              )}
              <span>{botLockLoading ? "Updating…" : botLocked ? "Activate Bot" : "Lock Bot"}</span>
            </button>
          </div>

          {/* Card 2: Online Exam System Control */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-red-200 dark:border-red-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
                  <Lock size={20} />
                </div>
                <h3 className="font-bold text-gray-800 dark:text-white text-lg">Online Exam Master Control</h3>
                {examLocked ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                    <ShieldOff size={12} /> System Locked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck size={12} /> Active / Open
                  </span>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm max-w-xl">
                {examLocked
                  ? "The online examination system is locked by Admin. Students cannot take online exams."
                  : "The online examination system is open. Students can log in and take active exams."}
              </p>
            </div>

            <button
              onClick={() => setShowExamLockModal(true)}
              className={`w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl transition-all font-semibold text-sm shrink-0 cursor-pointer focus:ring-2 ${
                examLocked
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 focus:ring-emerald-500"
                  : "bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 focus:ring-gray-400"
              }`}
              title={examLocked ? "Unlock Online Exam System" : "Lock Online Exam System"}
            >
              {examLocked ? <ShieldCheck size={18} /> : <ShieldOff size={18} />}
              <span>{examLocked ? "Unlock Exam System" : "Lock Exam System"}</span>
            </button>
          </div>

          {/* Card 3: Clean Up Storage PDFs */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-red-200 dark:border-red-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
                  <Trash2 size={20} />
                </div>
                <h3 className="font-bold text-gray-800 dark:text-white text-lg">Clean Up Storage PDFs</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm max-w-xl">
                Permanently delete <strong>all</strong> report card PDFs stored on Cloudinary to free up storage space. PDFs are regenerated automatically when requested. Student photos are <strong>never</strong> deleted.
              </p>
            </div>

            <button
              onClick={() => setShowCleanupModal(true)}
              disabled={cleanupLoading}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl transition-all font-semibold text-sm shrink-0 cursor-pointer shadow-md shadow-red-600/20 focus:ring-2 focus:ring-red-500"
              title="Permanently Delete Report Card PDFs"
            >
              {cleanupLoading ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
              <span>{cleanupLoading ? "Cleaning..." : "Clean Up PDFs"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
