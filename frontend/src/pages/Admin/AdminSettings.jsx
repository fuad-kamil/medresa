import { useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { User, Lock, Moon, Sun, Save, Globe, Trash2, Loader2 } from "lucide-react";
import useAuthStore from "../../store/authStore";

export default function AdminSettings() {
  const { user, login, theme, toggleTheme, token, language, setLanguage } = useAuthStore();

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ text: "", type: "" });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg("");
    try {
      const res = await axiosInstance.put("/admin/settings/profile", profileData);
      // Update local storage and zustand store with the updated user info
      login(res.data.user, token);
      setProfileMsg("Profile updated successfully!");
      setTimeout(() => setProfileMsg(""), 3000);
    } catch (error) {
      setProfileMsg(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMsg({ text: "New passwords do not match.", type: "error" });
      return;
    }
    setPasswordLoading(true);
    setPasswordMsg({ text: "", type: "" });
    try {
      const res = await axiosInstance.put("/admin/settings/password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordMsg({ text: res.data.message || "Password updated successfully!", type: "success" });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPasswordMsg({ text: "", type: "" }), 3000);
    } catch (error) {
      setPasswordMsg({ text: error.response?.data?.message || "Failed to update password.", type: "error" });
    } finally {
      setPasswordLoading(false);
    }
  };

  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupMsg, setCleanupMsg] = useState({ text: "", type: "" });

  const handleCleanupSubmit = async () => {
    if (!window.confirm("Are you sure you want to delete ALL report card PDFs from Cloudinary? This action cannot be undone. PDFs will be regenerated on demand next time.")) {
        return;
    }
    setCleanupLoading(true);
    setCleanupMsg({ text: "", type: "" });
    try {
      const res = await axiosInstance.delete("/admin/cleanup-reports");
      setCleanupMsg({ text: res.data.message || "Cleanup successful!", type: "success" });
      setTimeout(() => setCleanupMsg({ text: "", type: "" }), 5000);
    } catch (error) {
      setCleanupMsg({ text: error.response?.data?.message || "Failed to cleanup reports.", type: "error" });
    } finally {
      setCleanupLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
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

            {profileMsg && (
              <div className={`p-3 rounded-lg text-sm font-medium ${profileMsg.includes('success') ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {profileMsg}
              </div>
            )}

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

            {passwordMsg.text && (
              <div className={`p-3 rounded-lg text-sm font-medium ${passwordMsg.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {passwordMsg.text}
              </div>
            )}

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
                {cleanupMsg.text && (
                <div className={`mt-3 p-3 rounded-lg text-sm font-medium ${cleanupMsg.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {cleanupMsg.text}
                </div>
                )}
            </div>
            
            <button
                onClick={handleCleanupSubmit}
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
