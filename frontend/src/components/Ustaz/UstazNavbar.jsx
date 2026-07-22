import useAuthStore from "../../store/authStore";
import ThemeToggle from "../Common/ThemeToggle";
import LanguageToggle from "../Common/LanguageToggle";
import NotificationBell from "../Common/NotificationBell";

export default function UstazNavbar() {
  const { user } = useAuthStore();

  return (
    <nav className="bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-slate-100 dark:border-zinc-900 h-20 flex items-center pl-20 pr-6 lg:pl-10 lg:pr-10 fixed top-0 right-0 left-0 lg:left-64 z-30 shadow-xs">
      <div className="flex-1">
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          Ustaz Dashboard
        </h2>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Unified Control Cluster */}
        <div className="flex items-center gap-2 sm:gap-3 p-1.5 rounded-2xl bg-slate-100/70 dark:bg-zinc-900/70 border border-slate-200/50 dark:border-zinc-800/60 shadow-2xs">
          <LanguageToggle />
          <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800" />
          <ThemeToggle />
          <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800" />
          <NotificationBell role="ustaz" />
        </div>

        <div className="flex items-center gap-3 pl-1 sm:pl-2 border-l border-slate-200/60 dark:border-zinc-800">
          <div className="text-right hidden sm:block">
            <p className="font-bold text-sm text-slate-800 dark:text-white">
              {user?.name}
            </p>
            <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Ustaz
            </p>
          </div>

          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-extrabold text-base shadow-sm shadow-emerald-500/10 border border-emerald-400/20">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
        </div>
      </div>
    </nav>
  );
}
