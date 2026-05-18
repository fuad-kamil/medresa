import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { BookOpen, ArrowLeft, UserPlus } from "lucide-react";

export default function UstazRegister() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const validateForm = () => {
    if (!formData.name.trim()) return "Full name is required";
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email))
      return "Valid email is required";
    if (formData.password.length < 6)
      return "Password must be at least 6 characters long";
    if (formData.password !== formData.confirmPassword)
      return "Passwords do not match";
    return null;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      await axiosInstance.post("/auth/register-ustaz", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
      });

      setSuccess(true);
      setTimeout(() => navigate("/"), 2500);
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Success Screen
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 to-teal-900 dark:from-gray-950 dark:to-black flex items-center justify-center p-6">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-10 max-w-md text-center">
          <div className="w-20 h-20 mx-auto bg-emerald-100 dark:bg-emerald-900 rounded-2xl flex items-center justify-center mb-6">
            <UserPlus size={40} className="text-emerald-600" />
          </div>
          <h2 className="text-3xl font-bold text-emerald-700 dark:text-emerald-500">
            Registration Successful!
          </h2>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Your account has been created successfully.
            <br />
            Please wait for Admin approval.
          </p>
          <p className="text-sm text-gray-500 mt-6">
            Redirecting to login page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-teal-900 to-cyan-950 dark:from-gray-950 dark:via-slate-900 dark:to-black flex items-center justify-center p-6 relative overflow-hidden">
      <div className="w-full max-w-lg">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 dark:border-gray-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-700 to-teal-700 dark:from-emerald-800 dark:to-teal-800 px-10 py-12 text-center text-white">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                <BookOpen size={42} className="text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold">Join as Ustaz</h1>
            <p className="text-emerald-100 mt-2">Ali Medresa</p>
          </div>

          {/* Form Section */}
          <div className="p-10">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-500 hover:underline mb-6"
            >
              <ArrowLeft size={18} /> Back to Login
            </Link>

            {error && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-2xl text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white py-4 rounded-2xl font-semibold text-lg transition disabled:opacity-70 mt-4"
              >
                {loading ? "Creating Account..." : "Register as Ustaz"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
