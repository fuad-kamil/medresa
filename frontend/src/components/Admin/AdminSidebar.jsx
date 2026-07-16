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
import useTranslation from "../../hooks/useTranslation";

export default function AdminSidebar() {
  const location = useLocation();
  const { logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { t } = useTranslation();

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
        className={`fixed top-0 left-0 z-50 w-72 h-full bg-zinc-950 border-r border-zinc-900 text-zinc-100 transition-all duration-300 shadow-[20px_0_40px_-20px_rgba(0,0,0,0.3)] ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 overflow-y-auto flex flex-col justify-between`}
      >
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-zinc-900">
            <div className="flex items-center gap-3.5">
              <img
                src="/medresa_icon.jpg"
                alt="Ali Medresa Logo"
                className="w-11 h-11 rounded-2xl object-cover ring-2 ring-emerald-500/20 shadow-lg"
              />
              <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">{t("Ali Medresa")}</h1>
                <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">{t("Admin Portal")}</p>
              </div>
            </div>
          </div>

          {/* Menu */}
          <nav className="mt-8 px-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeSidebar}
                  className={`flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-[15px] font-medium transition-all duration-200 group ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-[0_4px_20px_rgba(16,185,129,0.25)]"
                      : "hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100"
                  }`}
                >
                  <Icon size={20} className={isActive ? "text-white" : "text-zinc-500 group-hover:text-emerald-400 transition-colors"} />
                  <span>{t(item.name)}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="px-4 pb-8 space-y-1 border-t border-zinc-900 pt-4">
          <Link
            to="/admin/settings"
            onClick={closeSidebar}
            className={`flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-[15px] font-medium transition-all duration-200 group ${
              location.pathname === "/admin/settings"
                ? "bg-emerald-600 text-white shadow-[0_4px_20px_rgba(16,185,129,0.25)]"
                : "hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100"
            }`}
          >
            <Settings size={20} className={location.pathname === "/admin/settings" ? "text-white" : "text-zinc-500 group-hover:text-emerald-400 transition-colors"} />
            <span>{t("Settings")}</span>
          </Link>

          <button
            onClick={logout}
            className="flex items-center gap-3.5 w-full px-4.5 py-3 text-[15px] font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all duration-200 cursor-pointer"
          >
            <LogOut size={20} />
            <span>{t("Logout")}</span>
          </button>
        </div>
      </div>
    </>
  );
}
