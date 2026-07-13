import useAuthStore from "../../store/authStore";
import ThemeToggle from "../Common/ThemeToggle";
import NotificationBell from "../Common/NotificationBell";

export default function UstazNavbar() {
  const { user } = useAuthStore();

  return (
    <nav className="bg-white/80 dark:bg-zinc-950/85 backdrop-blur-md border-b border-slate-100 dark:border-zinc-900 h-20 flex items-center pl-20 pr-6 lg:pl-10 lg:pr-10 fixed top-0 right-0 left-0 lg:left-64 z-40 shadow-sm">
      <div className="flex-1">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
          Ustaz Dashboard
        </h2>
      </div>

      <div className="flex items-center gap-5">
        <ThemeToggle />
        <NotificationBell role="ustaz" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="font-semibold text-sm text-slate-800 dark:text-white">
              {user?.name}
            </p>
            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Ustaz
            </p>
          </div>

          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-emerald-500/10 border border-emerald-400/20">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
        </div>
      </div>
    </nav>
  );
}
