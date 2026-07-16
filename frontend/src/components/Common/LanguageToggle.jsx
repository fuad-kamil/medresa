import { Globe } from "lucide-react";
import useAuthStore from "../../store/authStore";

export default function LanguageToggle() {
  const { language, setLanguage } = useAuthStore();

  return (
    <button
      onClick={() => setLanguage(language === "en" ? "am" : "en")}
      className="p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center gap-1.5 font-bold text-xs text-slate-700 dark:text-gray-300"
      title={language === "en" ? "Switch to Amharic" : "ወደ እንግሊዝኛ ቀይር"}
    >
      <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      <span className="uppercase">{language === "en" ? "EN" : "አማ"}</span>
    </button>
  );
}
