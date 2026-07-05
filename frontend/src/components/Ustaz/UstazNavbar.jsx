import useAuthStore from "../../store/authStore";
import ThemeToggle from "../Common/ThemeToggle";
import NotificationBell from "../Common/NotificationBell";

export default function UstazNavbar() {
  const { user } = useAuthStore();

  return (
    <nav className="bg-white dark:bg-gray-900 border-b dark:border-gray-700 h-16 flex items-center pl-16 pr-6 lg:px-8 fixed top-0 right-0 left-0 lg:left-64 z-10 shadow-sm">
      <div className="flex-1">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Ustaz Dashboard
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <NotificationBell role="ustaz" />

        <div className="text-right">
          <p className="font-semibold text-sm text-gray-800 dark:text-white">
            {user?.name}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            Ustaz
          </p>
        </div>

        <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-semibold">
          {user?.name?.charAt(0).toUpperCase() || "U"}
        </div>
      </div>
    </nav>
  );
}
