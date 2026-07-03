import useAuthStore from "../store/authStore";
import { translations } from "../utils/translations";

export default function useTranslation() {
  const language = useAuthStore((state) => state.language) || "en";

  const t = (key) => {
    // Return translation if exists, otherwise return the key itself
    if (translations[language] && translations[language][key]) {
      return translations[language][key];
    }
    // Fallback to English if key exists in English
    if (translations["en"] && translations["en"][key]) {
      return translations["en"][key];
    }
    return key;
  };

  return { t, language };
}
