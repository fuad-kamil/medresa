import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { UserPlus, UserCog, Search } from "lucide-react";
import { SURAHS } from "../../utils/surahs";
import useAuthStore from "../../store/authStore";
import WebcamCapture from "../../components/WebcamCapture";

export default function UstazManageStudent() {
  const { user } = useAuthStore();

  // Capitalize first letter of each word
  const capitalizeWords = (value) =>
    value.replace(/(?:^|\s)\S/g, (char) => char.toUpperCase());

  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    surah: "",
    fatherPhone: "",
    motherPhone: "",
    address: "",
  });
  const [myStudents, setMyStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState({ show: false, message: "" });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);

  useEffect(() => {
    fetchMyStudents();
  }, []);

  const fetchMyStudents = async () => {
    try {
      const res = await axiosInstance.get("/ustaz/students");
      setMyStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStudentSelect = (studentId) => {
    setSelectedStudentId(studentId);
    if (!studentId) {
      setFormData({
        fullName: "",
        surah: "",
        fatherPhone: "",
        motherPhone: "",
        address: "",
      });
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }

    const student = myStudents.find(s => s._id === studentId);
    if (student) {
      setFormData({
        fullName: student.fullName || "",
        surah: student.surah || "",
        fatherPhone: student.fatherPhone || "",
        motherPhone: student.motherPhone || "",
        address: student.address || "",
      });
      setPhotoFile(null);
      setPhotoPreview(student.photo || null);
    }
  };

  const toggleMode = (mode) => {
    setIsEditMode(mode);
    setSuccess({ show: false, message: "" });
    setSelectedStudentId("");
    setSearchTerm("");
    setFormData({
      fullName: "",
      surah: "",
      fatherPhone: "",
      motherPhone: "",
      address: "",
    });
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });
      submitData.append("stream", user?.stream || 'quran');
      if (photoFile) {
        submitData.append("photo", photoFile);
      }

      if (isEditMode) {
        if (!selectedStudentId) {
          alert("Please select a student to update");
          setLoading(false);
          return;
        }
        await axiosInstance.put(`/ustaz/students/${selectedStudentId}`, submitData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        setSuccess({ show: true, message: "✅ Student Updated Successfully!" });
        // Refresh student list
        fetchMyStudents();
      } else {
        // For kitab stream in register mode, auto-fill surah from the ustaz's kitabName
        const surahValue = user?.stream === 'kitab' ? (user?.kitabName || formData.surah) : formData.surah;
        submitData.set("surah", surahValue); // overwrite surah if needed

        await axiosInstance.post("/ustaz/students", submitData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        setSuccess({ show: true, message: "✅ Student Registered Successfully!" });
        fetchMyStudents(); // Refresh list so new student appears in edit mode
        setFormData({
          fullName: "",
          surah: "",
          fatherPhone: "",
          motherPhone: "",
          address: "",
        });
        setPhotoFile(null);
        setPhotoPreview(null);
      }
      
      setTimeout(() => setSuccess({ show: false, message: "" }), 4000);
    } catch (err) {
      alert(err.response?.data?.message || (isEditMode ? "Update failed" : "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = myStudents.filter(s => 
    s.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        {isEditMode ? (
          <UserCog size={48} className="mx-auto text-blue-600 mb-4" />
        ) : (
          <UserPlus size={48} className="mx-auto text-emerald-600 mb-4" />
        )}
        <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 dark:text-white transition-colors">
          Manage My Class
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-3 text-lg">
          Add new students directly to your class or edit their existing information.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl mb-10 shadow-inner max-w-md mx-auto">
        <button
          onClick={() => toggleMode(false)}
          className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all ${
            !isEditMode
              ? "bg-white dark:bg-gray-900 text-emerald-600 dark:text-emerald-400 shadow-md ring-1 ring-black/5 dark:ring-white/10"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          Register New
        </button>
        <button
          onClick={() => toggleMode(true)}
          className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all ${
            isEditMode
              ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-md ring-1 ring-black/5 dark:ring-white/10"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          Edit Existing
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-10 lg:p-14 border border-gray-100 dark:border-gray-800">
        
        {isEditMode && (
          <div className="mb-10 p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
            <label className="text-lg font-semibold mb-4 block text-blue-900 dark:text-blue-300">
              Select Student to Edit
            </label>
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 dark:text-blue-500/50" size={20} />
              <input
                type="text"
                placeholder="Search by name to filter the dropdown list below..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-3.5 text-md rounded-xl border border-blue-200 dark:border-blue-800/50 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-blue-300 dark:placeholder-blue-800"
              />
            </div>
            <select
              value={selectedStudentId}
              onChange={(e) => handleStudentSelect(e.target.value)}
              className="w-full px-5 py-4 text-lg rounded-xl border border-blue-200 dark:border-blue-800/50 bg-white dark:bg-gray-950 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer"
            >
              <option value="">-- Choose a student from your class --</option>
              {filteredStudents.map(s => (
                <option key={s._id} value={s._id}>{s.fullName}</option>
              ))}
            </select>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="text-lg font-medium mb-3 block text-gray-700 dark:text-gray-300">
                Student Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: capitalizeWords(e.target.value) })
                }
                className={`w-full px-6 py-4 text-lg rounded-2xl border dark:bg-gray-800 focus:ring-2 outline-none transition-all ${isEditMode ? 'focus:ring-blue-500 focus:border-blue-500 border-gray-300 dark:border-gray-700' : 'focus:ring-emerald-500 focus:border-emerald-500 border-gray-300 dark:border-gray-700'}`}
                required
              />
            </div>
            <div>
              {user?.stream === 'kitab' ? (
                <>
                  <label className="text-lg font-medium mb-3 block text-gray-700 dark:text-gray-300">
                    Kitab Name
                  </label>
                  {!isEditMode ? (
                    // Register mode: auto-filled from ustaz profile, read-only
                    <div className={`w-full px-6 py-4 text-lg rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 flex items-center gap-3`}>
                      <span className="text-emerald-600 dark:text-emerald-400 text-sm font-bold uppercase tracking-wider">Auto</span>
                      <span>{user?.kitabName || <span className="italic text-sm text-red-400">No kitab set — update in Settings</span>}</span>
                    </div>
                  ) : (
                    // Edit mode: editable
                    <input
                      type="text"
                      name="surah"
                      value={formData.surah}
                      placeholder="Enter Kitab Name (e.g. Ajrumiyyah)"
                      onChange={(e) =>
                        setFormData({ ...formData, surah: capitalizeWords(e.target.value) })
                      }
                      className={`w-full px-6 py-4 text-lg rounded-2xl border dark:bg-gray-800 focus:ring-2 outline-none transition-all focus:ring-blue-500 focus:border-blue-500 border-gray-300 dark:border-gray-700`}
                      required
                    />
                  )}
                </>
              ) : (
                <>
                  <label className="text-lg font-medium mb-3 block text-gray-700 dark:text-gray-300">
                    Current Surah
                  </label>
                  <select
                    name="surah"
                    value={formData.surah}
                    onChange={(e) =>
                      setFormData({ ...formData, surah: e.target.value })
                    }
                    className={`w-full px-6 py-4 text-lg rounded-2xl border dark:bg-gray-800 focus:ring-2 outline-none transition-all cursor-pointer ${isEditMode ? 'focus:ring-blue-500 focus:border-blue-500 border-gray-300 dark:border-gray-700' : 'focus:ring-emerald-500 focus:border-emerald-500 border-gray-300 dark:border-gray-700'}`}
                    required
                  >
                    <option value="">Select a Surah</option>
                    {SURAHS.map((surah) => (
                      <option key={surah} value={surah}>{surah}</option>
                    ))}
                  </select>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className={user?.stream === 'kitab' ? "col-span-2" : ""}>
              <label className="text-lg font-medium mb-3 block text-gray-700 dark:text-gray-300">
                {user?.stream === 'kitab' ? "Phone Number" : "Father Phone"}
              </label>
              <input
                type="tel"
                name="fatherPhone"
                value={formData.fatherPhone}
                onChange={(e) =>
                  setFormData({ ...formData, fatherPhone: e.target.value })
                }
                className={`w-full px-6 py-4 text-lg rounded-2xl border dark:bg-gray-800 focus:ring-2 outline-none transition-all ${isEditMode ? 'focus:ring-blue-500 focus:border-blue-500 border-gray-300 dark:border-gray-700' : 'focus:ring-emerald-500 focus:border-emerald-500 border-gray-300 dark:border-gray-700'}`}
                required
              />
            </div>

            {user?.stream !== 'kitab' && (
              <div>
                <label className="text-lg font-medium mb-3 block text-gray-700 dark:text-gray-300">
                  Mother Phone
                </label>
                <input
                  type="tel"
                  name="motherPhone"
                  value={formData.motherPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, motherPhone: e.target.value })
                  }
                  className={`w-full px-6 py-4 text-lg rounded-2xl border dark:bg-gray-800 focus:ring-2 outline-none transition-all ${isEditMode ? 'focus:ring-blue-500 focus:border-blue-500 border-gray-300 dark:border-gray-700' : 'focus:ring-emerald-500 focus:border-emerald-500 border-gray-300 dark:border-gray-700'}`}
                  required
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="col-span-1 md:col-span-2">
              <label className="text-lg font-medium mb-3 block text-gray-700 dark:text-gray-300">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: capitalizeWords(e.target.value) })
                }
                placeholder="Enter Student Address"
                className={`w-full px-6 py-4 text-lg rounded-2xl border dark:bg-gray-800 focus:ring-2 outline-none transition-all ${isEditMode ? 'focus:ring-blue-500 focus:border-blue-500 border-gray-300 dark:border-gray-700' : 'focus:ring-emerald-500 focus:border-emerald-500 border-gray-300 dark:border-gray-700'}`}
                required
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="text-lg font-medium mb-3 block text-gray-700 dark:text-gray-300">
                Student Photo (Optional)
              </label>
              <div className="flex flex-col gap-4">
                {photoPreview && (
                  <div className="flex items-center gap-4">
                    <img src={photoPreview} alt="Preview" className="w-24 h-24 object-cover rounded-xl shadow-md border border-gray-200 dark:border-gray-700" />
                    <button
                      type="button"
                      onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                      className="text-sm font-bold text-red-500 hover:text-red-700 transition"
                    >
                      ✕ Remove
                    </button>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* File Picker */}
                  <label className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-lg rounded-2xl border-2 border-dashed cursor-pointer transition-all hover:shadow-md ${isEditMode ? 'border-blue-300 hover:border-blue-500 dark:border-blue-800 dark:hover:border-blue-600' : 'border-emerald-300 hover:border-emerald-500 dark:border-emerald-800 dark:hover:border-emerald-600'} dark:bg-gray-800`}>
                    <span className="text-2xl">📁</span>
                    <span className="font-semibold text-gray-600 dark:text-gray-300">Choose from Files</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setPhotoFile(file);
                          setPhotoPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                  {/* Camera / Webcam Capture */}
                  <button
                    type="button"
                    onClick={() => setIsWebcamOpen(true)}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-lg rounded-2xl border-2 border-dashed cursor-pointer transition-all hover:shadow-md ${isEditMode ? 'border-blue-300 hover:border-blue-500 dark:border-blue-800 dark:hover:border-blue-600' : 'border-emerald-300 hover:border-emerald-500 dark:border-emerald-800 dark:hover:border-emerald-600'} dark:bg-gray-800`}
                  >
                    <span className="text-2xl">📷</span>
                    <span className="font-semibold text-gray-600 dark:text-gray-300">Use Camera</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || (isEditMode && !selectedStudentId)}
            className={`w-full py-5 text-xl font-bold text-white rounded-2xl transition-all shadow-lg mt-4 ${
              isEditMode 
                ? "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 shadow-blue-500/30" 
                : "bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 shadow-emerald-500/30"
            }`}
          >
            {loading ? "Processing..." : isEditMode ? "Update Student Details" : "Register New Student"}
          </button>
        </form>
      </div>

      {success.show && (
        <div className={`mt-8 p-5 rounded-2xl text-center text-lg font-bold border shadow-sm transition-all ${
          isEditMode 
            ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400" 
            : "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400"
        }`}>
          {success.message}
        </div>
      )}

      <WebcamCapture
        isOpen={isWebcamOpen}
        onClose={() => setIsWebcamOpen(false)}
        onCapture={(file, preview) => {
          setPhotoFile(file);
          setPhotoPreview(preview);
        }}
      />
    </div>
  );
}
