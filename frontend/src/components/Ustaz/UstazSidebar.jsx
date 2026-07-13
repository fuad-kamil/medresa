import { Link, useLocation } from "react-router-dom";
import { LogOut, LayoutDashboard, AlertCircle, Menu, X, CalendarX, Settings, UserPlus, GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import useAuthStore from "../../store/authStore";
import useTranslation from "../../hooks/useTranslation";

export default function UstazSidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { t, language } = useTranslation();
  const [yesterdayAbsentees, setYesterdayAbsentees] = useState([]);
  const [weeklyAbsentees, setWeeklyAbsentees] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) setIsOpen(true);
    };
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  useEffect(() => {
    const fetchAbsentees = async () => {
      try {
        const response = await axiosInstance.get("/ustaz/attendance/weekly");
        const absentRecords = response.data.filter((r) => r.status === "absent");

        // Group by student
        const grouped = {};
        absentRecords.forEach((record) => {
          const studentName = record.student?.fullName || "Unknown Student";
          if (!grouped[studentName]) {
            grouped[studentName] = [];
          }
          // Format date to local string e.g. "Mon, May 15"
          const dateStr = new Date(record.date).toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US', {
            weekday: "short",
            month: "short",
            day: "numeric",
          });
          grouped[studentName].push(dateStr);
        });

        // Filter for yesterday / previous class date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDate = new Date(today);

        if (user?.stream === 'kitab') {
          const day = today.getDay(); // 0 = Sun, 1 = Mon, ..., 4 = Thu, 5 = Fri, 6 = Sat
          let daysToSubtract = 1; // Default (Friday->Thursday, Saturday->Friday, Sunday->Saturday)
          if (day === 1) daysToSubtract = 2; // Monday -> Saturday
          else if (day === 2) daysToSubtract = 3; // Tuesday -> Saturday
          else if (day === 3) daysToSubtract = 4; // Wednesday -> Saturday
          else if (day === 4) daysToSubtract = 5; // Thursday -> Saturday
          targetDate.setDate(today.getDate() - daysToSubtract);
        } else {
          // Quran stream: check 1 day ago (yesterday)
          targetDate.setDate(today.getDate() - 1);
        }

        const yesterdayRecords = absentRecords.filter((r) => {
          const rDate = new Date(r.date);
          rDate.setHours(0, 0, 0, 0);
          return rDate.getTime() === targetDate.getTime();
        });

        const yestGrouped = {};
        yesterdayRecords.forEach((record) => {
          const studentName = record.student?.fullName || "Unknown Student";
          yestGrouped[studentName] = true;
        });

        setYesterdayAbsentees(Object.keys(yestGrouped));
        setWeeklyAbsentees(grouped);
      } catch (error) {
        console.error("Failed to fetch absentees:", error);
      }
    };

    fetchAbsentees();
  }, []);

  const closeSidebar = () => {
    if (isMobile) setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-3 left-4 z-50 p-2.5 bg-emerald-700 text-white rounded-xl shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 z-50 w-64 h-full bg-zinc-950 border-r border-zinc-900 text-zinc-100 flex flex-col justify-between transition-transform duration-300 shadow-[20px_0_40px_-20px_rgba(0,0,0,0.3)] ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-zinc-900">
            <div className="flex items-center gap-3">
              <img
                src="/medresa_icon.jpg"
                alt="Ali Medresa Logo"
                className="w-11 h-11 rounded-xl object-cover ring-2 ring-emerald-500/20 shadow-lg"
              />
              <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">{t("Ali Medresa")}</h1>
                <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">{t("Ustaz Portal")}</p>
              </div>
            </div>
          </div>

          <nav className="p-4 space-y-1 overflow-y-auto no-scrollbar">
            <Link
              to="/ustaz"
              onClick={closeSidebar}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[15px] font-medium transition-all duration-200 group ${
                location.pathname === "/ustaz"
                  ? "bg-emerald-600 text-white shadow-[0_4px_20px_rgba(16,185,129,0.25)]"
                  : "hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100"
              }`}
            >
              <LayoutDashboard size={18} className={location.pathname === "/ustaz" ? "text-white" : "text-zinc-500 group-hover:text-emerald-400"} />
              <span>{t("Dashboard")}</span>
            </Link>

            <Link
              to="/ustaz/manage-students"
              onClick={closeSidebar}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[15px] font-medium transition-all duration-200 group ${
                location.pathname === "/ustaz/manage-students"
                  ? "bg-emerald-600 text-white shadow-[0_4px_20px_rgba(16,185,129,0.25)]"
                  : "hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100"
              }`}
            >
              <UserPlus size={18} className={location.pathname === "/ustaz/manage-students" ? "text-white" : "text-zinc-500 group-hover:text-emerald-400"} />
              <span>{t("Manage Students")}</span>
            </Link>

            {user?.stream === 'kitab' && (
              <Link
                to="/ustaz/exams"
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[15px] font-medium transition-all duration-200 group ${
                  location.pathname === "/ustaz/exams"
                    ? "bg-emerald-600 text-white shadow-[0_4px_20px_rgba(16,185,129,0.25)]"
                    : "hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100"
                }`}
              >
                <GraduationCap size={18} className={location.pathname === "/ustaz/exams" ? "text-white" : "text-zinc-500 group-hover:text-emerald-400"} />
                <span>{t("Exams")}</span>
              </Link>
            )}

            {/* Yesterday's Absentees Section */}
            <div className="mt-6 mb-2 px-2 flex items-center gap-2 text-zinc-500 font-bold text-xs uppercase tracking-wider">
              <AlertCircle size={14} className="text-zinc-600" />
              <span>{user?.stream === 'kitab' ? t("Previous Class Absentees") : t("Yesterday's Absentees")}</span>
            </div>
            
            {yesterdayAbsentees.length === 0 ? (
              <div className="px-4 py-2.5 text-xs text-zinc-500 italic bg-zinc-950/30 rounded-xl">
                {t("No absentees")} {user?.stream === 'kitab' ? t("last class") : t("yesterday")}!
              </div>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto no-scrollbar">
                {yesterdayAbsentees.map((name, idx) => (
                  <div key={idx} className="bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-900">
                    <p className="font-medium text-zinc-300 text-xs">{name}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 space-y-1">
              <Link
                to="/ustaz/weekly-absentees"
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[15px] font-medium transition-all duration-200 group ${
                  location.pathname === "/ustaz/weekly-absentees"
                    ? "bg-emerald-600 text-white shadow-[0_4px_20px_rgba(16,185,129,0.25)]"
                    : "hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100"
                }`}
              >
                <CalendarX size={18} className={location.pathname === "/ustaz/weekly-absentees" ? "text-white" : "text-zinc-500 group-hover:text-emerald-400"} />
                <span>{t("Weekly Absentees")}</span>
              </Link>

              <Link
                to="/ustaz/settings"
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[15px] font-medium transition-all duration-200 group ${
                  location.pathname === "/ustaz/settings"
                    ? "bg-emerald-600 text-white shadow-[0_4px_20px_rgba(16,185,129,0.25)]"
                    : "hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100"
                }`}
              >
                <Settings size={18} className={location.pathname === "/ustaz/settings" ? "text-white" : "text-zinc-500 group-hover:text-emerald-400"} />
                <span>{t("Settings")}</span>
              </Link>
            </div>
          </nav>
        </div>

        <div className="p-4 border-t border-zinc-900">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-[15px] font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all duration-200 cursor-pointer"
          >
            <LogOut size={18} /> 
            <span>{t("Logout")}</span>
          </button>
        </div>
      </div>
    </>
  );
}
