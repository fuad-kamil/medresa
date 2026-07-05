import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { UserPlus, UserCog, Search, Upload, Download, FileSpreadsheet, Check } from "lucide-react";
import { SURAHS } from "../../utils/surahs";
import WebcamCapture from "../../components/WebcamCapture";
import * as XLSX from "xlsx";

export default function RegisterStudent() {
  const capitalizeWords = (value) =>
    value.replace(/(?:^|\s)\S/g, (char) => char.toUpperCase());

  const [mode, setMode] = useState("register"); // 'register', 'edit', 'bulk'
  const isEditMode = mode === "edit";
  const isBulkMode = mode === "bulk";

  const [formData, setFormData] = useState({
    fullName: "",
    stream: "",
    surah: "",
    fatherPhone: "",
    motherPhone: "",
    address: "",
    assignedUstaz: "",
  });
  const [ustazs, setUstazs] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState({ show: false, message: "" });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [bulkStudents, setBulkStudents] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchUstazs();
    fetchAllStudents();
  }, []);

  const fetchUstazs = async () => {
    try {
      const res = await axiosInstance.get("/admin/ustazs");
      setUstazs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const res = await axiosInstance.get("/admin/students");
      setAllStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStudentSelect = (studentId) => {
    setSelectedStudentId(studentId);
    if (!studentId) {
      setFormData({
        fullName: "",
        stream: "",
        surah: "",
        fatherPhone: "",
        motherPhone: "",
        address: "",
        assignedUstaz: "",
      });
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }

    const student = allStudents.find(s => s._id === studentId);
    if (student) {
      setFormData({
        fullName: student.fullName || "",
        stream: student.stream || "",
        surah: student.surah || "",
        fatherPhone: student.fatherPhone || "",
        motherPhone: student.motherPhone || "",
        address: student.address || "",
        assignedUstaz: student.assignedUstaz?._id || student.assignedUstaz || "",
      });
      setPhotoFile(null);
      setPhotoPreview(student.photo || null);
    }
  };

  const toggleMode = (newMode) => {
    setMode(newMode);
    setSuccess({ show: false, message: "" });
    setSelectedStudentId("");
    setSearchTerm("");
    setFormData({
      fullName: "",
      stream: "",
      surah: "",
      fatherPhone: "",
      motherPhone: "",
      address: "",
      assignedUstaz: "",
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setBulkStudents([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });
      if (photoFile) {
        submitData.append("photo", photoFile);
      }

      if (isEditMode) {
        if (!selectedStudentId) {
          alert("Please select a student to update");
          setLoading(false);
          return;
        }
        await axiosInstance.put(`/admin/students/${selectedStudentId}`, submitData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        setSuccess({ show: true, message: "✅ Student Updated Successfully!" });
        fetchAllStudents();
      } else {
        await axiosInstance.post("/admin/students", submitData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        setSuccess({ show: true, message: "✅ Student Registered Successfully!" });
        fetchAllStudents();
        setFormData({
          fullName: "",
          stream: "",
          surah: "",
          fatherPhone: "",
          motherPhone: "",
          address: "",
          assignedUstaz: "",
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

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { "Full Name": "Ahmad Ali", "Stream": "quran", "Kitab Name / Surah": "Al-Baqarah", "Father Phone": "0911223344", "Mother Phone": "0911223355", "Address": "Addis Ababa" }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "Student_Bulk_Import_Template.xlsx");
  };

  const processFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      const mappedData = data.map(row => ({
        fullName: row["Full Name"] || "",
        stream: row["Stream"] || "",
        surah: row["Kitab Name / Surah"] || "",
        fatherPhone: row["Father Phone"] ? String(row["Father Phone"]) : "",
        motherPhone: row["Mother Phone"] ? String(row["Mother Phone"]) : "",
        address: row["Address"] || ""
      })).filter(s => s.fullName && s.fatherPhone);

      setBulkStudents(mappedData);
    };
    reader.readAsBinaryString(file);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (bulkStudents.length === 0) return;
    setLoading(true);
    try {
      const res = await axiosInstance.post("/admin/students/bulk", bulkStudents);
      setSuccess({ show: true, message: `✅ ${res.data.count} Students Imported Successfully!` });
      fetchAllStudents();
      setBulkStudents([]);
      setTimeout(() => setSuccess({ show: false, message: "" }), 5000);
    } catch (err) {
      alert(err.response?.data?.message || "Bulk import failed");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = allStudents.filter(s => 
    s.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        {isEditMode ? (
          <UserCog size={48} className="mx-auto text-blue-600 mb-4" />
        ) : isBulkMode ? (
          <FileSpreadsheet size={48} className="mx-auto text-purple-600 mb-4" />
        ) : (
          <UserPlus size={48} className="mx-auto text-emerald-600 mb-4" />
        )}
        <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 dark:text-white transition-colors">
          Manage Student
        </h1>
      </div>

      {/* Mode Toggle */}
      <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl mb-10 shadow-inner max-w-2xl mx-auto">
        <button
          onClick={() => toggleMode("register")}
          className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all ${
            mode === "register"
              ? "bg-white dark:bg-gray-900 text-emerald-600 dark:text-emerald-400 shadow-md ring-1 ring-black/5 dark:ring-white/10"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          Register New
        </button>
        <button
          onClick={() => toggleMode("edit")}
          className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all ${
            isEditMode
              ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-md ring-1 ring-black/5 dark:ring-white/10"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          Edit Existing
        </button>
        <button
          onClick={() => toggleMode("bulk")}
          className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all ${
            isBulkMode
              ? "bg-white dark:bg-gray-900 text-purple-600 dark:text-purple-400 shadow-md ring-1 ring-black/5 dark:ring-white/10"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          Bulk Import
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-10 lg:p-14 border border-gray-100 dark:border-gray-800">
        
        {isBulkMode ? (
          <form onSubmit={handleBulkSubmit} className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Import Multiple Students</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-xl mx-auto">
                Download the template below, fill it with your students' data, and upload the saved file to register them all at once.
              </p>
              <button
                type="button"
                onClick={downloadTemplate}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition"
              >
                <Download size={20} />
                Download Excel Template
              </button>
            </div>

            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                isDragging 
                  ? "border-purple-500 bg-purple-100 dark:bg-purple-900/40" 
                  : "border-purple-300 dark:border-purple-800/50 bg-purple-50/50 dark:bg-purple-900/10 hover:border-purple-500 dark:hover:border-purple-600"
              }`}
            >
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                id="bulk-upload"
                className="hidden"
                onChange={handleFileUpload}
              />
              <label htmlFor="bulk-upload" className="cursor-pointer flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Upload size={32} />
                </div>
                <div>
                  <span className="text-lg font-bold text-purple-700 dark:text-purple-400 block mb-1">
                    Click to browse your files
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">
                    Supports .xlsx and .csv files
                  </span>
                </div>
              </label>
            </div>

            {bulkStudents.length > 0 && (
              <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 dark:bg-emerald-800/30 rounded-full text-emerald-600 dark:text-emerald-400 mb-3">
                  <Check size={24} />
                </div>
                <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                  File Parsed Successfully!
                </h3>
                <p className="text-emerald-600 dark:text-emerald-400">
                  Found <strong>{bulkStudents.length}</strong> valid student records ready to import.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || bulkStudents.length === 0}
              className={`w-full py-5 text-xl font-bold text-white rounded-2xl transition-all shadow-lg ${
                loading || bulkStudents.length === 0
                  ? "bg-purple-300 dark:bg-purple-800/50 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700 shadow-purple-500/30"
              }`}
            >
              {loading ? "Importing..." : "Confirm & Import Students"}
            </button>
          </form>
        ) : (
          <>
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
                  <option value="">-- Choose a student --</option>
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
                  <label className="text-lg font-medium mb-3 block text-gray-700 dark:text-gray-300">
                    Student Stream (Quran / Kitab)
                  </label>
                  <select
                    name="stream"
                    value={formData.stream}
                    onChange={(e) => {
                      const newStream = e.target.value;
                      setFormData({
                        ...formData,
                        stream: newStream,
                        surah: newStream === "kitab" ? "" : formData.surah,
                        assignedUstaz: ""
                      });
                    }}
                    className={`w-full px-6 py-4 text-lg rounded-2xl border dark:bg-gray-800 focus:ring-2 outline-none transition-all cursor-pointer ${isEditMode ? 'focus:ring-blue-500 focus:border-blue-500 border-gray-300 dark:border-gray-700' : 'focus:ring-emerald-500 focus:border-emerald-500 border-gray-300 dark:border-gray-700'}`}
                    required
                  >
                    <option value="">-- Select Stream --</option>
                    <option value="quran">Quran Stream</option>
                    <option value="kitab">Kitab Stream</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="text-lg font-medium mb-3 block text-gray-700 dark:text-gray-300">
                    Assign to Ustaz
                  </label>
                  <select
                    name="assignedUstaz"
                    value={formData.assignedUstaz}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selectedUstazObj = ustazs.find(u => u._id === selectedId);
                      setFormData({ 
                        ...formData, 
                        assignedUstaz: selectedId,
                        stream: selectedUstazObj ? selectedUstazObj.stream : formData.stream,
                        surah: (selectedUstazObj && selectedUstazObj.stream === "kitab") ? "" : formData.surah
                      });
                    }}
                    className={`w-full px-6 py-4 text-lg rounded-2xl border dark:bg-gray-800 focus:ring-2 outline-none transition-all cursor-pointer ${isEditMode ? 'focus:ring-blue-500 focus:border-blue-500 border-gray-300 dark:border-gray-700' : 'focus:ring-emerald-500 focus:border-emerald-500 border-gray-300 dark:border-gray-700'}`}
                    required
                  >
                    <option value="">Select Ustaz</option>
                    {ustazs
                      .filter(u => formData.stream === "" || u.stream === formData.stream)
                      .map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.stream === 'kitab' ? 'Kitab' : 'Quran'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  {formData.stream === 'kitab' ? (
                    <>
                      <label className="text-lg font-medium mb-3 block text-gray-700 dark:text-gray-300">
                        Kitab Name
                      </label>
                      <input
                        type="text"
                        name="surah"
                        value={formData.surah}
                        placeholder="Enter Kitab Name (e.g. Ajrumiyyah)"
                        onChange={(e) =>
                          setFormData({ ...formData, surah: capitalizeWords(e.target.value) })
                        }
                        className={`w-full px-6 py-4 text-lg rounded-2xl border dark:bg-gray-800 focus:ring-2 outline-none transition-all ${isEditMode ? 'focus:ring-blue-500 focus:border-blue-500 border-gray-300 dark:border-gray-700' : 'focus:ring-emerald-500 focus:border-emerald-500 border-gray-300 dark:border-gray-700'}`}
                        required
                      />
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
                <div className={formData.stream === 'kitab' ? "col-span-2" : ""}>
                  <label className="text-lg font-medium mb-3 block text-gray-700 dark:text-gray-300">
                    {formData.stream === 'kitab' ? "Phone Number" : "Father Phone"}
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

                {formData.stream !== 'kitab' && (
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
                className={`w-full py-5 text-xl font-bold text-white rounded-2xl transition-all shadow-lg ${
                  isEditMode 
                    ? "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 shadow-blue-500/30" 
                    : "bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 shadow-emerald-500/30"
                }`}
              >
                {loading ? "Processing..." : isEditMode ? "Update Student Details" : "Register New Student"}
              </button>
            </form>
          </>
        )}
      </div>

      {success.show && (
        <div className={`mt-8 p-5 rounded-2xl text-center text-lg font-bold border shadow-sm transition-all ${
          isEditMode 
            ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400" 
            : isBulkMode
            ? "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400"
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
