import { useNavigate, Link } from "react-router-dom";
import { Moon, Sun, Mail, Lock, UserCog, BookOpen } from "lucide-react";
import useAuthStore from "../../store/authStore";
import { useLogin } from "../../hooks/useLogin";

export default function Login() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useAuthStore();
    email,
    setEmail,
    password,
    setPassword,
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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-slate-50 dark:bg-gray-950 transition-colors duration-500 font-sans">
      {/* Animated Background Elements */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-emerald-300 dark:bg-emerald-600 rounded-full mix-blend-multiply filter blur-3xl opacity-40 dark:opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-teal-300 dark:bg-teal-600 rounded-full mix-blend-multiply filter blur-3xl opacity-40 dark:opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-cyan-300 dark:bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-40 dark:opacity-20 animate-blob animation-delay-4000"></div>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 sm:top-6 right-4 sm:right-6 p-3 rounded-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border border-gray-200 dark:border-gray-700 hover:scale-105 hover:bg-white dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 transition-all z-20 shadow-sm"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-indigo-600" />}
      </button>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] overflow-hidden border border-white/60 dark:border-gray-700/50">
          {/* Header */}
          <div className="px-6 sm:px-8 pt-10 pb-6 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <img
                  src="/medresa_icon.jpg"
                  alt="Ali Medresa Logo"
                  className="relative w-24 h-24 rounded-3xl object-cover ring-2 ring-white/80 dark:ring-gray-800/80 shadow-xl transform transition hover:scale-105 duration-300"
                />
              </div>
            </div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 tracking-tight">
              Ali Medresa
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium uppercase tracking-widest">
              Quranic Education
            </p>
          </div>

          {/* Form Area */}
          <div className="px-6 sm:px-8 pb-10">
            {error && (
              <div className="mb-6 bg-red-50/90 dark:bg-red-900/20 backdrop-blur-sm border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl text-sm text-center flex items-center justify-center gap-2 animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400 shrink-0"></div>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1 flex items-center gap-2">
                  <Mail size={16} className="text-emerald-500" /> Email Address
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-4 pr-4 py-3.5 bg-gray-50/50 dark:bg-gray-800/50 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:text-white transition-all duration-300 group-hover:border-emerald-300 dark:group-hover:border-emerald-700 ${
                      formErrors.email
                        ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                        : "border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-500"
                    }`}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                {formErrors.email && (
                  <p className="text-red-500 text-xs ml-1 font-medium">{formErrors.email}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1 flex items-center gap-2">
                  <Lock size={16} className="text-emerald-500" /> Password
                </label>
                <div className="relative group">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-4 pr-4 py-3.5 bg-gray-50/50 dark:bg-gray-800/50 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:text-white transition-all duration-300 group-hover:border-emerald-300 dark:group-hover:border-emerald-700 ${
                      formErrors.password
                        ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                        : "border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-500"
                    }`}
                    placeholder="Enter your password"
                    required
                  />
                </div>
                {formErrors.password && (
                  <p className="text-red-500 text-xs ml-1 font-medium">{formErrors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:focus:ring-offset-gray-900 shadow-lg shadow-emerald-500/30 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:hover:translate-y-0 mt-6"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Authenticating...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Register Link */}
            <div className="text-center mt-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                New here?{" "}
                <Link
                  to="/ustaz-register"
                  className="font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors underline decoration-2 underline-offset-4 decoration-emerald-500/30 hover:decoration-emerald-500"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Custom Styles for Blob Animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}} />
    </div>
  );
}
