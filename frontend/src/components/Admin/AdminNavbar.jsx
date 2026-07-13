import useAuthStore from "../../store/authStore";
import ThemeToggle from "../Common/ThemeToggle";
import NotificationBell from "../Common/NotificationBell";

export default function AdminNavbar() {
  const { user } = useAuthStore();
  return (
    <nav className="bg-white/80 dark:bg-zinc-950/85 backdrop-blur-md border-b border-slate-100 dark:border-zinc-900 h-20 pl-20 pr-6 lg:px-10 fixed top-0 right-0 left-0 lg:left-72 z-40 shadow-sm flex items-center">
      <div className="flex-1">
        <h1 className="text-xl lg:text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
          Admin Portal
        </h1>
      </div>

      <div className="flex items-center gap-5">
        <ThemeToggle />
        <NotificationBell role="admin" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="font-semibold text-sm text-slate-800 dark:text-white">
              {user?.name}
            </p>
            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Administrator
            </p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-emerald-500/10 border border-emerald-400/20">
            {user?.name?.charAt(0) || "A"}
          </div>
        </div>
      </div>
    </nav>
  );
}
