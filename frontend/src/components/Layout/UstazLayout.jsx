import { useEffect } from "react";
import UstazSidebar from "../Ustaz/UstazSidebar";
import UstazNavbar from "../Ustaz/UstazNavbar";
import Footer from "../Common/Footer";
import useAuthStore from "../../store/authStore";

export default function UstazLayout({ children }) {
  const { theme } = useAuthStore();

  // Apply dark mode on every page
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <UstazSidebar />
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <UstazNavbar />

        <main className="flex-1 pt-24 lg:pt-28 px-6 lg:px-10 pb-10">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
}
