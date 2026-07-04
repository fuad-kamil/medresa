import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  UserMinus,
  Settings,
  LogOut,
  Menu,
  X,
  GraduationCap,
  CalendarX,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import { useState, useEffect } from "react";

export default function AdminSidebar() {
  const location = useLocation();
  const { logout } = useAuthStore();
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

  const menuItems = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
    {
      name: "Register Student",
      path: "/admin/register-student",
      icon: UserPlus,
    },
    { name: "All Students", path: "/admin/students", icon: Users },
    { name: "Unassigned Students", path: "/admin/unassigned-students", icon: UserMinus },
    { name: "Weekly Absentees", path: "/admin/weekly-absentees", icon: CalendarX },
    { name: "Exams", path: "/admin/exams", icon: GraduationCap },
  ];

  const closeSidebar = () => {
    if (isMobile) setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-emerald-700 text-white rounded-2xl shadow-lg"
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
        className={`fixed top-0 left-0 z-50 w-72 h-full bg-gradient-to-b from-emerald-900 to-teal-900 text-white transition-all duration-300 shadow-2xl ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 overflow-y-auto`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-emerald-700/50">
          <div className="flex items-center gap-3">
            <img
              src="/medresa_icon.jpg"
              alt="Ali Medresa Logo"
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/20"
            />
            <div>
              <h1 className="text-2xl font-bold">Ali Medresa</h1>
              <p className="text-emerald-300 text-sm">Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="mt-8 px-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={`flex items-center gap-4 px-5 py-4 mb-2 rounded-2xl text-[17px] transition-all ${
                  isActive
                    ? "bg-white text-emerald-900 font-semibold shadow"
                    : "hover:bg-emerald-800/50 text-emerald-100"
                }`}
              >
                <Icon size={24} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-8 w-full px-4">
          <Link
            to="/admin/settings"
            onClick={closeSidebar}
            className="flex items-center gap-4 px-5 py-4 mb-2 rounded-2xl text-[17px] text-emerald-100 hover:bg-emerald-800/50"
          >
            <Settings size={24} />
            <span>Settings</span>
          </Link>

          <button
            onClick={logout}
            className="flex items-center gap-4 w-full px-5 py-4 text-red-300 hover:bg-red-900/30 rounded-2xl transition"
          >
            <LogOut size={24} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}
