import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { BookOpen, ArrowLeft, UserPlus } from "lucide-react";
import toast from 'react-hot-toast';
import LanguageToggle from "../../components/Common/LanguageToggle";
import useTranslation from "../../hooks/useTranslation";

export default function UstazRegister() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    stream: "quran",
    kitabName: "",
    teachingDays: [0, 1, 2, 3, 4, 5, 6],
    studentPhoneOption: 1,
    inviteCode: "",
  });

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const validateForm = () => {
    if (!formData.name.trim()) return "Full name is required";
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email))
      return "Valid email is required";
    if (!formData.inviteCode.trim()) return "Medresa invitation code is required";
    if (formData.password.length < 6)
      return "Password must be at least 6 characters long";
    if (formData.password !== formData.confirmPassword)
      return "Passwords do not match";
    if (formData.stream === "kitab" && !formData.kitabName.trim())
      return "Kitab name is required for Kitab teachers";
    if (formData.teachingDays.length === 0)
      return "Please select at least one teaching day";
    return null;
  };

  // Capitalize first letter of each word for text fields
  const capitalizeWords = (value) =>
    value.replace(/(?:^|\s)\S/g, (char) => char.toUpperCase());

  const TEXT_FIELDS = ["name", "kitabName"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newValue = TEXT_FIELDS.includes(name) ? capitalizeWords(value) : value;
    setFormData({ ...formData, [name]: newValue });
  };

  const DAYS_OF_WEEK = [
    { id: 1, label: "Mon" },
    { id: 2, label: "Tue" },
    { id: 3, label: "Wed" },
    { id: 4, label: "Thu" },
    { id: 5, label: "Fri" },
    { id: 6, label: "Sat" },
    { id: 0, label: "Sun" },
  ];

  const handleDayToggle = (dayId) => {
    setFormData((prev) => {
      const currentDays = prev.teachingDays;
      if (currentDays.includes(dayId)) {
        return { ...prev, teachingDays: currentDays.filter(d => d !== dayId) };
      } else {
        return { ...prev, teachingDays: [...currentDays, dayId].sort() };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);

    try {
      await axiosInstance.post("/auth/register-ustaz", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        stream: formData.stream,
        kitabName: formData.stream === "kitab" ? formData.kitabName.trim() : undefined,
        teachingDays: formData.teachingDays,
        inviteCode: formData.inviteCode.trim(),
      });

      toast.success("Registration Successful! Please wait for Admin approval.");
      setTimeout(() => navigate("/"), 2500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-teal-900 to-cyan-950 dark:from-gray-950 dark:via-slate-900 dark:to-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Floating Language Switcher */}
      <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20 bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl shadow-sm">
        <LanguageToggle />
      </div>

      <div className="w-full max-w-lg">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 dark:border-gray-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-700 to-teal-700 dark:from-emerald-800 dark:to-teal-800 px-10 py-12 text-center text-white">
            <div className="flex justify-center mb-4">
              <img
                src="/medresa_icon.jpg"
                alt="Ali Medresa Logo"
                className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white/30 shadow-2xl"
              />
            </div>
            <h1 className="text-4xl font-bold">{t("Join as Ustaz")}</h1>
            <p className="text-emerald-100 mt-2">{t("Ali Medresa")}</p>
          </div>

          {/* Form Section */}
          <div className="p-10">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-500 hover:underline mb-6"
            >
              <ArrowLeft size={18} /> {t("Back to Login")}
            </Link>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("Full Name")}
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
                  {t("Email Address")}
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
                  {t("Phone Number (Optional)")}
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
                  {t("Teaching Stream")}
                </label>
                <select
                  name="stream"
                  value={formData.stream}
                  onChange={handleChange}
                  className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:bg-gray-800 dark:text-white"
                  required
                >
                  <option value="quran">{t("Quran Teacher")}</option>
                  <option value="kitab">{t("Kitab Teacher")}</option>
                </select>
              </div>

              {formData.stream === "kitab" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("Kitab Name")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="kitabName"
                    value={formData.kitabName}
                    onChange={handleChange}
                    placeholder="e.g. Ajrumiyyah, Tuhfatul Atfaal"
                    className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:bg-gray-800 dark:text-white"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This will be auto-assigned to all students you register.</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("Teaching Days")} <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => handleDayToggle(day.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                        formData.teachingDays.includes(day.id)
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/30"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Select all the days you will be teaching.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("Student Contacts")}
                </label>
                <select
                  name="studentPhoneOption"
                  value={formData.studentPhoneOption}
                  onChange={handleChange}
                  className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="1">{t("Accept 1 Phone Number (Phone Number)")}</option>
                  <option value="2">{t("Accept 2 Phone Numbers (Father & Mother Phone)")}</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t("Decide if student profiles under you require one contact or separate father & mother contacts.")}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("Invitation Code")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="inviteCode"
                  value={formData.inviteCode}
                  onChange={handleChange}
                  className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("Password")}
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
                  {t("Confirm Password")}
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
                {loading ? t("Registering...") : t("Join as Ustaz")}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
