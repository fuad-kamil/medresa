import { Link, useLocation } from "react-router-dom";
import { LogOut, LayoutDashboard, AlertCircle, Menu, X, CalendarX, Settings, UserPlus, GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import useAuthStore from "../../store/authStore";

export default function UstazSidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
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
          const dateStr = new Date(record.date).toLocaleDateString("en-US", {
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
        className={`fixed top-0 left-0 z-50 w-64 h-full bg-emerald-900 text-white flex flex-col transition-transform duration-300 shadow-2xl ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="p-6 border-b border-emerald-800">
          <div className="flex items-center gap-3">
            <img
              src="/medresa_icon.jpg"
              alt="Ali Medresa Logo"
              className="w-11 h-11 rounded-xl object-cover ring-2 ring-white/20"
            />
            <div>
              <h1 className="text-xl font-bold">Ali Medresa</h1>
              <p className="text-emerald-300 text-sm">Ustaz Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto no-scrollbar">
          <Link
            to="/ustaz"
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-6 ${
              location.pathname === "/ustaz" ? "bg-emerald-700" : "hover:bg-emerald-800"
            }`}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </Link>

          <Link
            to="/ustaz/manage-students"
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-6 ${
              location.pathname === "/ustaz/manage-students" ? "bg-emerald-700" : "hover:bg-emerald-800"
            }`}
          >
            <UserPlus size={20} />
            Manage Students
          </Link>

          {user?.stream === 'kitab' && (
            <Link
              to="/ustaz/exams"
              onClick={closeSidebar}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-6 ${
                location.pathname === "/ustaz/exams" ? "bg-emerald-700" : "hover:bg-emerald-800"
              }`}
            >
              <GraduationCap size={20} />
              Exams
            </Link>
          )}

          {/* Yesterday's Absentees Section */}
          <div className="mt-4 mb-2 px-2 flex items-center gap-2 text-emerald-300 font-semibold text-sm uppercase tracking-wider">
            <AlertCircle size={16} />
            {user?.stream === 'kitab' ? "Previous Class Absentees" : "Yesterday's Absentees"}
          </div>
          
          {yesterdayAbsentees.length === 0 ? (
            <div className="px-4 py-3 text-sm text-emerald-400/70 italic bg-emerald-950/30 rounded-xl mb-6">
              No absentees {user?.stream === 'kitab' ? "last class" : "yesterday"}!
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {yesterdayAbsentees.map((name, idx) => (
                <div key={idx} className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-800/50">
                  <p className="font-medium text-emerald-100 text-sm">{name}</p>
                </div>
              ))}
            </div>
          )}

          <Link
            to="/ustaz/weekly-absentees"
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-6 ${
              location.pathname === "/ustaz/weekly-absentees" ? "bg-emerald-700" : "hover:bg-emerald-800"
            }`}
          >
            <CalendarX size={20} />
            Weekly Absentees
          </Link>

          <Link
            to="/ustaz/settings"
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-6 ${
              location.pathname === "/ustaz/settings" ? "bg-emerald-700" : "hover:bg-emerald-800"
            }`}
          >
            <Settings size={20} />
            Settings
          </Link>
        </nav>

        <div className="p-4 border-t border-emerald-800">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-300 hover:bg-red-950/30 rounded-xl transition"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>
    </>
  );
}
