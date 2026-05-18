import { useNavigate, Link } from "react-router-dom";
import { Moon, Sun, BookOpen } from "lucide-react";
import useAuthStore from "../../store/authStore";
import { useLogin } from "../../hooks/useLogin";

export default function Login() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useAuthStore();
  const {
    email,
    setEmail,
    password,
    setPassword,
    role,
    setRole,
    loading,
    error,
    formErrors,
    handleLogin,
  } = useLogin();

  const onSubmit = async (e) => {
    const result = await handleLogin(e);
    if (result.success) {
      if (result.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/ustaz");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-teal-900 to-cyan-950 dark:from-gray-950 dark:via-slate-900 dark:to-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 rounded-2xl bg-white/10 hover:bg-white/20 dark:bg-gray-800/50 text-white transition z-20"
      >
        {theme === "dark" ? <Sun size={24} /> : <Moon size={24} />}
      </button>

      <div className="w-full max-w-lg">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 dark:border-gray-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-700 to-teal-700 dark:from-emerald-800 dark:to-teal-800 px-10 py-12 text-center">
            <div className="flex justify-center mb-4">
              <img
                src="/medresa_icon.jpg"
                alt="Ali Medresa Logo"
                className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white/30 shadow-2xl"
              />
            </div>
            <h1 className="text-4xl font-bold text-white">Ali Medresa</h1>
            <p className="text-emerald-100 mt-2">Quranic Education System</p>
          </div>

          {/* Form Area */}
          <div className="p-10">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white text-center mb-8">
              Welcome Back
            </h2>

            {error && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-5 py-4 rounded-2xl text-center">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-5 py-4 border rounded-2xl focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white text-base ${
                    formErrors.email
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  required
                />
                {formErrors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-5 py-4 border rounded-2xl focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white text-base ${
                    formErrors.password
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  required
                />
                {formErrors.password && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.password}
                  </p>
                )}
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Login As
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole("admin")}
                    className={`py-4 rounded-2xl font-medium transition-all ${role === "admin" ? "bg-emerald-700 text-white shadow-md" : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("ustaz")}
                    className={`py-4 rounded-2xl font-medium transition-all ${role === "ustaz" ? "bg-emerald-700 text-white shadow-md" : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
                  >
                    Ustaz
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-4 rounded-2xl font-semibold text-lg transition disabled:opacity-70 mt-2"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            {/* Register Link */}
            {role === "ustaz" && (
              <div className="text-center mt-6">
                <p className="text-gray-600 dark:text-gray-400">
                  Don't have an account?{" "}
                  <Link
                    to="/ustaz-register"
                    className="text-emerald-600 dark:text-emerald-500 font-medium hover:underline"
                  >
                    Register as Ustaz
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
