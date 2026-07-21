import { useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { User, Lock, Moon, Sun, Save, Globe, AlertTriangle, CalendarX } from "lucide-react";
import useAuthStore from "../../store/authStore";
import toast from 'react-hot-toast';

export default function UstazSettings() {
  const { user, login, theme, toggleTheme, token, language, setLanguage, updateUser } = useAuthStore();

  const [isEndSemesterModalOpen, setIsEndSemesterModalOpen] = useState(false);
  const [endSemesterLoading, setEndSemesterLoading] = useState(false);

  const confirmEndSemester = async () => {
    setEndSemesterLoading(true);
    try {
      const res = await axiosInstance.post("/ustaz/end-semester");
      toast.success(res.data.message || "Semester ended successfully!");
      if (updateUser) {
        updateUser({ semesterStatus: 'ended' });
      } else {
        login({ ...user, semesterStatus: 'ended' }, token);
      }
      setIsEndSemesterModalOpen(false);
    } catch (err) {
      console.error("End semester error:", err);
      toast.error(err.response?.data?.message || "Failed to end semester");
    } finally {
      setEndSemesterLoading(false);
    }
  };

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    kitabName: user?.kitabName || "",
    teachingDays: user?.teachingDays || [0, 1, 2, 3, 4, 5, 6],
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const DAYS_OF_WEEK = [
    { id: 1, label: "Mon" },
    { id: 2, label: "Tue" },
    { id: 3, label: "Wed" },
    { id: 4, label: "Thu" },
    { id: 5, label: "Fri" },
    { id: 6, label: "Sat" },
    { id: 0, label: "Sun" },
  ];

  const handleDayToggle = (dayId) => {
    setProfileData((prev) => {
      const currentDays = prev.teachingDays;
      if (currentDays.includes(dayId)) {
        if (currentDays.length === 1) return prev; // prevent unselecting all
        return { ...prev, teachingDays: currentDays.filter(d => d !== dayId) };
      } else {
        return { ...prev, teachingDays: [...currentDays, dayId].sort() };
      }
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await axiosInstance.put("/ustaz/settings/profile", profileData);
      // Update local storage and zustand store with the updated user info
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
      const res = await axiosInstance.put("/ustaz/settings/password", {
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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your profile and system preferences.</p>
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
                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-800 dark:text-white outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-800 dark:text-white outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-800 dark:text-white outline-none"
              />
            </div>

            {user?.stream === 'kitab' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kitab Name <span className="text-xs text-gray-400">(auto-assigned to your students)</span>
                </label>
                <input
                  type="text"
                  value={profileData.kitabName}
                  onChange={(e) => setProfileData({ ...profileData, kitabName: e.target.value })}
                  placeholder="e.g. Ajrumiyyah, Tuhfatul Atfaal"
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-800 dark:text-white outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Teaching Days
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => handleDayToggle(day.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                      profileData.teachingDays.includes(day.id)
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/30"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Update your teaching schedule to fix attendance reporting.</p>
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
                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-800 dark:text-white outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-800 dark:text-white outline-none"
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
                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-800 dark:text-white outline-none"
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

      {/* Semester Management Card */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
            <CalendarX size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Semester Settings</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Control class active status and semester end resets</p>
          </div>
        </div>

        {user?.semesterStatus === 'ended' ? (
          <div className="p-5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-center gap-4 text-red-800 dark:text-red-400">
            <AlertTriangle size={28} className="shrink-0" />
            <div>
              <h3 className="font-bold text-base">Semester Currently Ended</h3>
              <p className="text-xs mt-0.5">Your class is locked. Please wait for the admin to archive and reset your class before starting a new semester.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="font-bold text-gray-800 dark:text-white text-base">End Current Semester</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-lg">
                Marking this semester as ended will lock your attendance marking and exam scores. Your data will be preserved until the admin archives and resets your class.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEndSemesterModalOpen(true)}
              className="px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-600/20 transition-all text-sm shrink-0 self-stretch sm:self-auto"
            >
              End Semester
            </button>
          </div>
        )}
      </div>

      {/* End Semester Confirmation Modal */}
      {isEndSemesterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-700 overflow-hidden">
            
            <div className="bg-red-50 dark:bg-red-900/20 pt-8 pb-6 flex justify-center border-b border-red-100 dark:border-red-900/30">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-800/40 rounded-full flex items-center justify-center shadow-inner">
                <AlertTriangle size={40} className="text-red-600 dark:text-red-400" />
              </div>
            </div>

            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                Confirm End Semester?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
                Are you sure you want to end this semester? Your class attendance and exam scores will be locked. You won't be able to change them until the admin resets the semester.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => setIsEndSemesterModalOpen(false)}
                  disabled={endSemesterLoading}
                  className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-2xl font-bold transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmEndSemester}
                  disabled={endSemesterLoading}
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold shadow-lg shadow-red-500/30 transition-all hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {endSemesterLoading ? "Ending..." : "Yes, End Semester"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
