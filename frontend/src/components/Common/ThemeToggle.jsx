import { Sun, Moon } from "lucide-react";
import useAuthStore from "../../store/authStore";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useAuthStore();

  return (
    <button
      onClick={toggleTheme}
      className="p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 text-yellow-400" />
      ) : (
        <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      )}
    </button>
  );
}
