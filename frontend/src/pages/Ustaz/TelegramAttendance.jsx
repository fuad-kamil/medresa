import { useState, useEffect } from "react";
import { Check, X, AlertTriangle, LogOut, Calendar, Mail, Lock, Globe, RefreshCw } from "lucide-react";
import axiosInstance from "../../utils/axiosInstance";
import useAuthStore from "../../store/authStore";
import useTranslation from "../../hooks/useTranslation";
import toast from 'react-hot-toast';

export default function TelegramAttendance() {
  const { t, language } = useTranslation();
  const { user, login, logout, setLanguage } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [validDates, setValidDates] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // ─── 1. Telegram WebApp Integration & Theme Sync ───────────────────────────
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();

      // Sync theme color
      const isDark = tg.colorScheme === 'dark';
      document.documentElement.classList.toggle('dark', isDark);

      // Handle theme change events
      const onThemeChange = () => {
        const isDarkNow = tg.colorScheme === 'dark';
        document.documentElement.classList.toggle('dark', isDarkNow);
      };
      tg.onEvent('themeChanged', onThemeChange);

      return () => {
        tg.offEvent('themeChanged', onThemeChange);
      };
    }
  }, []);

  // ─── 2. Auto-Link Telegram Account on Login ────────────────────────────────
  useEffect(() => {
    if (user && !user.telegramChatId) {
      const tgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
      if (tgId) {
        axiosInstance.put('/ustaz/settings/profile', { telegramChatId: tgId.toString() })
          .then((res) => {
            const updatedUser = { ...user, telegramChatId: tgId.toString() };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            useAuthStore.setState({ user: updatedUser });
            console.log("Telegram account linked successfully!");
          })
          .catch(err => console.error("Failed to auto-link telegram:", err));
      }
    }
  }, [user]);

  // ─── 3. Load valid dates based on teaching days ────────────────────────────
  useEffect(() => {
    if (!user) return;
    const teachingDays = user.teachingDays || [0, 1, 2, 3, 4, 5, 6];
    const teachingDaysSet = new Set(teachingDays);
    const days = [];
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    while (days.length < 4) {
      if (teachingDaysSet.has(cursor.getDay())) {
        const offsetDate = new Date(cursor.getTime() - (cursor.getTimezoneOffset() * 60000));
        days.push(offsetDate.toISOString().split('T')[0]);
      }
      cursor.setDate(cursor.getDate() - 1);
    }
    
    setValidDates(days);
    if (!days.includes(selectedDate) && days.length > 0) {
      setSelectedDate(days[0]);
    }
  }, [user]);

  // ─── 4. Load Students assigned to Ustaz ────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    setDataLoading(true);
    axiosInstance
      .get("/ustaz/students")
      .then((res) => {
        setStudents(res.data);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load students");
      })
      .finally(() => setDataLoading(false));
  }, [user]);

  // ─── 5. Load Existing Attendance for selected date ────────────────────────
  useEffect(() => {
    if (!user || students.length === 0) return;

    axiosInstance
      .get(`/ustaz/attendance?date=${selectedDate}`)
      .then((res) => {
        const existingRecords = res.data;
        if (existingRecords && existingRecords.length > 0) {
          const loadedAttendance = {};
          students.forEach((s) => {
            loadedAttendance[s._id] = "present";
          });
          existingRecords.forEach((record) => {
            const studentId = typeof record.student === 'object' ? record.student._id : record.student;
            loadedAttendance[studentId] = record.status;
          });
          setAttendance(loadedAttendance);
          setIsUpdateMode(true);
        } else {
          const initial = {};
          students.forEach((s) => (initial[s._id] = "present"));
          setAttendance(initial);
          setIsUpdateMode(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch existing attendance:", err);
        const initial = {};
        students.forEach((s) => (initial[s._id] = "present"));
        setAttendance(initial);
        setIsUpdateMode(false);
      });
  }, [selectedDate, students, user]);

  // ─── 6. Handle Login Submission ────────────────────────────────────────────
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoginLoading(true);

    try {
      const res = await axiosInstance.post("/auth/login", { email, password });
      const { user: userData, token } = res.data;

      if (userData.role !== "ustaz" && userData.role !== "admin") {
        toast.error("Access denied. Teachers only.");
        return;
      }

      login(userData, token);
      toast.success("Welcome back!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoginLoading(false);
    }
  };

  // ─── 7. Status Toggles & Device Haptic triggers ───────────────────────────
  const handleStatusChange = (studentId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));

    // Trigger soft keyboard click haptic in Telegram
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred("medium");
    }
  };

  // ─── 8. Mark / Update Attendance ──────────────────────────────────────────
  const markAttendance = async () => {
    setSubmitLoading(true);
    try {
      if (isUpdateMode) {
        await axiosInstance.put("/ustaz/attendance", { attendance, date: selectedDate });
        toast.success(t("Attendance updated successfully!"));
      } else {
        await axiosInstance.post("/ustaz/attendance", { attendance, date: selectedDate });
        toast.success(t("Attendance marked successfully!"));
        setIsUpdateMode(true);
      }

      // Trigger success haptic notification
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit attendance");
    } finally {
      setSubmitLoading(false);
    }
  };

  // ─── 9. Stats Counter ──────────────────────────────────────────────────────
  const getStats = () => {
    let present = 0, absent = 0, excused = 0;
    Object.values(attendance).forEach(status => {
      if (status === "present") present++;
      else if (status === "absent") absent++;
      else if (status === "excused") excused++;
    });
    return { present, absent, excused };
  };

  const { present, absent, excused } = getStats();

  // ─── Render Unauthenticated State (Sleek Glass Login) ──────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col justify-between p-6 transition-colors duration-300 font-sans">
        {/* Header Options */}
        <div className="flex justify-between items-center w-full mb-8">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-lg">
            <img src="/medresa_icon.jpg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
            <span>Ali Medresa</span>
          </div>
          
          {/* Language Switch */}
          <button 
            onClick={() => setLanguage(language === "en" ? "am" : "en")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-sm font-semibold shadow-sm text-gray-700 dark:text-gray-300"
          >
            <Globe size={14} />
            <span>{language === "en" ? "አማርኛ" : "English"}</span>
          </button>
        </div>

        {/* Login Form Card */}
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 shadow-premium">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
              {t("Sign In")}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              {language === "en" 
                ? "Link your Ustaz account to take student attendance." 
                : "የተማሪዎችን ክትትል ለመውሰድ የኡስታዝ መለያዎን ያገናኙ።"}
            </p>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider ml-1">
                  {t("Email Address")}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:text-white transition-all text-sm"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider ml-1">
                  {t("Password")}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:text-white transition-all text-sm"
                    required
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full mt-6 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all text-sm flex justify-center items-center gap-2"
              >
                {loginLoading ? (
                  <RefreshCw className="animate-spin" size={18} />
                ) : (
                  t("Sign In")
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 mt-8">
          Ali Medresa © {new Date().getFullYear()}
        </div>
      </div>
    );
  }

  // ─── Render Authenticated State (Attendance Sheet) ────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col justify-between transition-colors duration-300 font-sans pb-32">
      {/* Top Navbar */}
      <div className="sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800/80 px-4 py-3.5 flex justify-between items-center z-30">
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Ustaz Attendance</span>
          <span className="font-extrabold text-gray-800 dark:text-white text-base leading-none">{user.name}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button 
            onClick={() => setLanguage(language === "en" ? "am" : "en")}
            className="p-2 rounded-xl bg-gray-50 dark:bg-zinc-950 border border-gray-150 dark:border-zinc-850 text-gray-600 dark:text-gray-400"
            title="Language"
          >
            <Globe size={18} />
          </button>
          
          {/* Logout */}
          <button 
            onClick={logout}
            className="p-2 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/35 text-red-600 dark:text-red-400"
            title="Log Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 py-5 flex-1 max-w-md mx-auto w-full">
        {/* Date Selector Row */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/60 rounded-3xl p-4 mb-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
              <Calendar size={20} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">{t("Date:")}</span>
              <span className="font-extrabold text-gray-850 dark:text-gray-200 text-sm">
                {new Date(selectedDate).toLocaleDateString(language === "en" ? 'en-US' : 'am-ET', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>

          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 text-gray-800 dark:text-gray-200 text-sm font-semibold rounded-2xl px-3 py-2.5 outline-none cursor-pointer"
          >
            {validDates.map((date) => {
              const [y, m, d] = date.split('-');
              const dateObj = new Date(y, m - 1, d);
              const label = dateObj.toLocaleDateString(language === "en" ? 'en-US' : 'am-ET', { weekday: 'short', month: 'short', day: 'numeric' });
              return (
                <option key={date} value={date}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>

        {/* Loading Spinner */}
        {dataLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
            <RefreshCw className="animate-spin text-emerald-500" size={32} />
            <span className="text-sm font-medium">Loading assigned students...</span>
          </div>
        ) : students.length === 0 ? (
          // Empty State
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl p-8 text-center text-gray-500 my-6 shadow-sm">
            <p className="font-semibold text-lg mb-1">No Students Found</p>
            <p className="text-sm text-gray-400">{t("No students assigned to you yet.")}</p>
          </div>
        ) : (
          // Students Card List
          <div className="space-y-4">
            {students.map((student, idx) => (
              <div 
                key={student._id} 
                className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-3xl p-4 shadow-sm transition-all"
              >
                {/* Student Info header */}
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-xs font-bold text-gray-450 dark:text-gray-500 uppercase tracking-wider block">Student {idx + 1}</span>
                    <h3 className="font-extrabold text-gray-850 dark:text-white text-base leading-snug">{student.fullName}</h3>
                    {student.surah && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 inline-flex items-center gap-1 font-medium bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-900 px-2 py-0.5 rounded-lg">
                        📖 {student.surah}
                      </span>
                    )}
                  </div>
                </div>

                {/* Tactile Buttons Switcher */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {/* Present */}
                  <button
                    onClick={() => handleStatusChange(student._id, "present")}
                    className={`py-3 px-3 rounded-2xl font-extrabold text-xs border flex items-center justify-center gap-1 transition-all ${
                      attendance[student._id] === "present"
                        ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 scale-[1.02] shadow-sm shadow-emerald-500/5"
                        : "bg-gray-50/50 dark:bg-zinc-950/50 border-gray-200/60 dark:border-zinc-850/60 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    <Check size={14} strokeWidth={3} />
                    <span>{t("Present")}</span>
                  </button>

                  {/* Absent */}
                  <button
                    onClick={() => handleStatusChange(student._id, "absent")}
                    className={`py-3 px-3 rounded-2xl font-extrabold text-xs border flex items-center justify-center gap-1 transition-all ${
                      attendance[student._id] === "absent"
                        ? "bg-red-500/10 border-red-500/50 text-red-600 dark:text-red-400 scale-[1.02] shadow-sm shadow-red-500/5"
                        : "bg-gray-50/50 dark:bg-zinc-950/50 border-gray-200/60 dark:border-zinc-850/60 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    <X size={14} strokeWidth={3} />
                    <span>{t("Absent")}</span>
                  </button>

                  {/* Excused */}
                  <button
                    onClick={() => handleStatusChange(student._id, "excused")}
                    className={`py-3 px-3 rounded-2xl font-extrabold text-xs border flex items-center justify-center gap-1 transition-all ${
                      attendance[student._id] === "excused"
                        ? "bg-amber-500/10 border-amber-500/50 text-amber-600 dark:text-amber-400 scale-[1.02] shadow-sm shadow-amber-500/5"
                        : "bg-gray-50/50 dark:bg-zinc-950/50 border-gray-200/60 dark:border-zinc-850/60 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    <AlertTriangle size={14} strokeWidth={3} />
                    <span>{t("Excused")}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 dark:bg-zinc-900/95 border-t border-gray-100 dark:border-zinc-800/80 p-4 pb-6 backdrop-blur-lg z-20">
        <div className="max-w-md mx-auto w-full">
          {/* Quick Info Stats */}
          <div className="flex justify-between items-center mb-3.5 text-xs font-bold uppercase tracking-wider text-gray-500 px-1">
            <span>Summary:</span>
            <div className="flex items-center gap-3">
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">🟢 {present}</span>
              <span className="text-red-600 dark:text-red-400 font-extrabold">🔴 {absent}</span>
              <span className="text-amber-600 dark:text-amber-500 font-extrabold">🟡 {excused}</span>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={markAttendance}
            disabled={submitLoading || students.length === 0}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all text-sm flex justify-center items-center gap-2"
          >
            {submitLoading ? (
              <RefreshCw className="animate-spin" size={18} />
            ) : (
              isUpdateMode ? t("Update Attendance") : t("Submit Attendance")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
