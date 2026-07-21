import useTranslation from "../../hooks/useTranslation";

function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800/80 py-4 sm:py-6 px-4 sm:px-8 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left text-xs sm:text-sm text-gray-500 dark:text-gray-400">
        <div className="font-medium">
          © {currentYear} <span className="text-emerald-600 dark:text-emerald-400 font-bold">Ali Medresa</span>
        </div>
        <div className="text-[11px] sm:text-xs text-gray-400 dark:text-gray-500 font-medium">
          {t("Islamic Education Management System")}
        </div>
      </div>
    </footer>
  );
}

export default Footer;