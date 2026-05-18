import useAuthStore from "../../store/authStore";
import ThemeToggle from "../Common/ThemeToggle";

export default function AdminNavbar() {
  const { user } = useAuthStore();

  return (
    <nav className="bg-white dark:bg-gray-900 border-b dark:border-gray-700 h-20 pl-20 pr-6 lg:px-10 fixed top-0 right-0 left-0 lg:left-72 z-40 shadow-sm flex items-center">
      <div className="flex-1">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white tracking-tight">
          Admin Portal
        </h1>
      </div>

      <div className="flex items-center gap-5">
        <ThemeToggle />

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="font-semibold text-gray-800 dark:text-white">
              {user?.name}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              Administrator
            </p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl ring-2 ring-white dark:ring-gray-800">
            {user?.name?.charAt(0) || "A"}
          </div>
        </div>
      </div>
    </nav>
  );
}
