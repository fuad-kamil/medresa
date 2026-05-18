import { useEffect } from "react";
import AdminSidebar from "../Admin/AdminSidebar";
import AdminNavbar from "../Admin/AdminNavbar";
import Footer from "../Common/Footer";
import useAuthStore from "../../store/authStore";

export default function AdminLayout({ children }) {
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
      <AdminSidebar />
      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        <AdminNavbar />

        <main className="flex-1 pt-24 lg:pt-28 px-6 lg:px-10 pb-10">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
}
