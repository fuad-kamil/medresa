import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import useAuthStore from "../../store/authStore";
import { 
  Search, 
  Save, 
  GraduationCap, 
  CheckCircle, 
  Download, 
  Settings, 
  Plus, 
  Trash2, 
  X, 
  Edit3,
  Loader2
} from "lucide-react";
import * as XLSX from "xlsx";

export default function Exams() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const [students, setStudents] = useState([]);
  const [ustazs, setUstazs] = useState([]);
  const [exams, setExams] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUstaz, setSelectedUstaz] = useState("all");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [savedSuccessId, setSavedSuccessId] = useState(null);
  
  // Local score states for inline editing (mapped as: scores[studentId][examId])
  const [scores, setScores] = useState({});

  // Manage Exams Panel state
  const [showManagePanel, setShowManagePanel] = useState(false);
  const [newExamName, setNewExamName] = useState("");
  const [newExamMaxScore, setNewExamMaxScore] = useState(100);
  const [editingExamId, setEditingExamId] = useState(null);
  const [editingExamName, setEditingExamName] = useState("");
  const [configActionLoading, setConfigActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch active exams
      const examsRes = await axiosInstance.get("/exams");
      const activeExams = examsRes.data;
      setExams(activeExams);

      // 2. Fetch Ustazs if admin
      if (isAdmin) {
        await fetchUstazs();
      }

      // 3. Fetch Students & map scores
      await fetchStudents(activeExams);
    } catch (err) {
      console.error("Failed to load initial data", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUstazs = async () => {
    try {
      const res = await axiosInstance.get("/admin/ustazs");
      const approvedKitabUstazs = res.data.filter(u => u.isApproved && u.stream === 'kitab');
      setUstazs(approvedKitabUstazs);
    } catch (err) {
      console.error("Failed to fetch Ustazs", err);
    }
  };

  const fetchStudents = async (activeExams) => {
    try {
      const endpoint = isAdmin ? "/admin/students" : "/ustaz/students";
      const res = await axiosInstance.get(endpoint);
      const kitabStudents = res.data.filter(s => s.stream === 'kitab');
      setStudents(kitabStudents);

      // Initialize local scores state by student ID and exam ID
      const initialScores = {};
      kitabStudents.forEach((student) => {
        initialScores[student._id] = {};
        activeExams.forEach((exam) => {
          // Fallback to legacy fields if map key doesn't exist
          let legacyScore = 0;
          if (exam.name === "First Exam") legacyScore = student.firstExam || 0;
          else if (exam.name === "Second Exam") legacyScore = student.secondExam || 0;
          else if (exam.name === "Final Exam") legacyScore = student.finalExam || 0;

          initialScores[student._id][exam._id] = student.examScores?.[exam._id] ?? legacyScore;
        });
      });
      setScores(initialScores);
    } catch (err) {
      console.error("Failed to fetch students for exams", err);
    }
  };

  const handleScoreChange = (studentId, examId, val) => {
    let numericVal = val === "" ? "" : Number(val);
    if (numericVal !== "" && (isNaN(numericVal) || numericVal < 0 || numericVal > 100)) {
      return;
    }

    setScores((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [examId]: numericVal,
      },
    }));
  };

  const handleSaveScores = async (studentId) => {
    setSavingId(studentId);
    try {
      const endpoint = isAdmin 
        ? `/admin/students/${studentId}/scores` 
        : `/ustaz/students/${studentId}/scores`;
        
      const payload = {
        examScores: scores[studentId]
      };

      await axiosInstance.put(endpoint, payload);
      setSavedSuccessId(studentId);
      setTimeout(() => setSavedSuccessId(null), 3000);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to save exam scores");
    } finally {
      setSavingId(null);
    }
  };

  // Manage Exams Configuration
  const handleAddExam = async (e) => {
    e.preventDefault();
    if (!newExamName.trim()) return;
    setConfigActionLoading(true);
    try {
      const res = await axiosInstance.post("/exams", {
        name: newExamName.trim(),
        maxScore: newExamMaxScore
      });
      const newExam = res.data;
      
      const updatedExams = [...exams, newExam];
      setExams(updatedExams);
      setNewExamName("");
      
      // Update scores template for students
      setScores(prev => {
        const copy = { ...prev };
        students.forEach(s => {
          if (!copy[s._id]) copy[s._id] = {};
          copy[s._id][newExam._id] = 0;
        });
        return copy;
      });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to create exam column");
    } finally {
      setConfigActionLoading(false);
    }
  };

  const handleRenameExam = async (examId) => {
    if (!editingExamName.trim()) return;
    setConfigActionLoading(true);
    try {
      await axiosInstance.put(`/exams/${examId}`, {
        name: editingExamName.trim()
      });
      
      setExams(prev => prev.map(e => e._id === examId ? { ...e, name: editingExamName.trim() } : e));
      setEditingExamId(null);
      setEditingExamName("");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to rename exam");
    } finally {
      setConfigActionLoading(false);
    }
  };

  const handleDeleteExam = async (examId, name) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the exam column "${name}"?\n\nWARNING: All student scores for this exam will be permanently deleted.`
    );
    if (!confirmDelete) return;

    setConfigActionLoading(true);
    try {
      await axiosInstance.delete(`/exams/${examId}`);
      
      setExams(prev => prev.filter(e => e._id !== examId));
      
      // Clean up score state
      setScores(prev => {
        const copy = { ...prev };
        Object.keys(copy).forEach(studentId => {
          if (copy[studentId]) {
            delete copy[studentId][examId];
          }
        });
        return copy;
      });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete exam column");
    } finally {
      setConfigActionLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUstaz = selectedUstaz === "all" || student.assignedUstaz?._id === selectedUstaz;
    return matchesSearch && matchesUstaz;
  });

  const downloadExcel = () => {
    const data = filteredStudents.map((student) => {
      const studentScores = scores[student._id] || {};
      let totalScore = 0;

      const row = {
        "Student Name": student.fullName || "N/A",
      };

      exams.forEach((exam) => {
        const score = Number(studentScores[exam._id]) || 0;
        row[exam.name] = score;
        totalScore += score;
      });

      row["Total Score"] = totalScore;

      if (isAdmin) {
        row["Assigned Ustaz"] = student.assignedUstaz?.name || "Not Assigned";
      }

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Exams");

    const max_width = data.reduce((w, r) => Math.max(w, r["Student Name"].length), 15);
    const cols = [
      { wch: max_width },
    ];
    exams.forEach(() => {
      cols.push({ wch: 15 });
    });
    cols.push({ wch: 15 }); // for Total
    if (isAdmin) {
      cols.push({ wch: 20 });
    }
    worksheet["!cols"] = cols;

    XLSX.writeFile(workbook, "Exams_Report.xlsx");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-800 dark:text-white flex items-center gap-3 tracking-tight">
            <GraduationCap size={48} className="text-emerald-600 shrink-0" />
            Exams & Performance
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-3 text-lg">
            Manage, record, and track exam scores for all students.
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {isAdmin && (
              <select
                value={selectedUstaz}
                onChange={(e) => setSelectedUstaz(e.target.value)}
                className="w-full sm:w-auto px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-md cursor-pointer shadow-sm text-gray-700 dark:text-gray-200"
              >
                <option value="all">All Ustazs</option>
                {ustazs.map((ustaz) => (
                  <option key={ustaz._id} value={ustaz._id}>
                    {ustaz.name}
                  </option>
                ))}
              </select>
            )}

            <div className="relative flex-1 w-full sm:w-60">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-5 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-md shadow-sm"
              />
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={downloadExcel}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition font-semibold text-md shadow-md cursor-pointer whitespace-nowrap hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download size={18} />
              Export
            </button>

            {isAdmin && (
              <button
                onClick={() => setShowManagePanel(!showManagePanel)}
                className={`flex items-center justify-center p-3 rounded-2xl border transition shadow-sm cursor-pointer ${
                  showManagePanel 
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-600" 
                    : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
                title="Configure Exam Columns"
              >
                <Settings size={22} className={showManagePanel ? "animate-spin-slow" : ""} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Admin Manage Exams Overlay Panel */}
      {isAdmin && showManagePanel && (
        <div className="mb-10 p-6 bg-gradient-to-r from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/10 dark:to-teal-950/5 border border-emerald-100 dark:border-emerald-900/40 rounded-3xl shadow-md animate-fadeIn">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Settings size={22} className="text-emerald-600" />
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Configure Exam Columns</h2>
            </div>
            <button 
              onClick={() => setShowManagePanel(false)}
              className="p-1.5 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-300 rounded-xl transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Existing columns manager */}
            <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
              <h3 className="text-md font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-4">Active Columns ({exams.length})</h3>
              
              {configActionLoading && (
                <div className="flex justify-center py-4">
                  <Loader2 className="animate-spin text-emerald-600 h-6 w-6" />
                </div>
              )}

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {exams.map((exam) => (
                  <div key={exam._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-800 group">
                    {editingExamId === exam._id ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="text"
                          value={editingExamName}
                          onChange={(e) => setEditingExamName(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <button
                          onClick={() => handleRenameExam(exam._id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingExamId(null)}
                          className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="font-bold text-gray-800 dark:text-gray-200 text-md">{exam.name}</span>
                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => {
                              setEditingExamId(exam._id);
                              setEditingExamName(exam.name);
                            }}
                            className="p-1.5 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 text-gray-500 hover:text-emerald-600 dark:text-gray-400 rounded-lg transition cursor-pointer border border-gray-100 dark:border-gray-700"
                            title="Rename"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteExam(exam._id, exam.name)}
                            className="p-1.5 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-950/20 text-gray-500 hover:text-red-600 dark:text-gray-400 rounded-lg transition cursor-pointer border border-gray-100 dark:border-gray-700"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Add new column form */}
            <form onSubmit={handleAddExam} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
              <div>
                <h3 className="text-md font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-4">Add Exam Column</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Column Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Midterm, Project, Homework..."
                      value={newExamName}
                      onChange={(e) => setNewExamName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-gray-900 transition"
                      required
                    />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={configActionLoading || !newExamName.trim()}
                className="mt-6 flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl font-semibold transition shadow-sm cursor-pointer"
              >
                <Plus size={18} />
                Create Column
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-850 mb-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <th className="p-6 font-semibold text-gray-600 dark:text-gray-300">Student Name</th>
                {isAdmin && (
                  <th className="p-6 font-semibold text-gray-600 dark:text-gray-300">Assigned Ustaz</th>
                )}
                {exams.map((exam) => (
                  <th key={exam._id} className="p-6 font-semibold text-gray-600 dark:text-gray-300 text-center w-32 whitespace-nowrap">
                    {exam.name}
                  </th>
                ))}
                <th className="p-6 font-semibold text-gray-600 dark:text-gray-300 text-center w-28">Total</th>
                <th className="p-6 font-semibold text-gray-600 dark:text-gray-300 text-center w-28">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? exams.length + 3 : exams.length + 2} className="text-center py-20">
                    <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto font-medium"></div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? exams.length + 3 : exams.length + 2} className="text-center py-20 text-gray-500 font-medium">
                    No students found.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const studentScores = scores[student._id] || {};
                  let totalScore = 0;
                  
                  exams.forEach(exam => {
                    totalScore += Number(studentScores[exam._id]) || 0;
                  });

                  return (
                    <tr key={student._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition duration-150">
                      <td className="p-6 font-bold text-gray-800 dark:text-white">
                        {student.fullName}
                      </td>
                      {isAdmin && (
                        <td className="p-6 text-gray-600 dark:text-gray-400 font-medium">
                          {student.assignedUstaz?.name || (
                            <span className="text-gray-400 italic font-normal">Not Assigned</span>
                          )}
                        </td>
                      )}
                      
                      {/* Dynamic Exam Inputs */}
                      {exams.map((exam) => (
                        <td key={exam._id} className="p-6 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={studentScores[exam._id] ?? 0}
                            onChange={(e) => handleScoreChange(student._id, exam._id, e.target.value)}
                            className="w-20 px-3 py-2 text-center bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-gray-900 outline-none transition font-semibold"
                          />
                        </td>
                      ))}

                      {/* Total Score */}
                      <td className="p-6 text-center">
                        <span className="inline-flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold px-4 py-2 rounded-xl text-lg w-20">
                          {totalScore}
                        </span>
                      </td>

                      {/* Action Button */}
                      <td className="p-6 text-center">
                        {savedSuccessId === student._id ? (
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold text-sm shadow-sm animate-pulse">
                            <CheckCircle size={16} /> Saved
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSaveScores(student._id)}
                            disabled={savingId === student._id}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl font-semibold text-sm transition shadow-sm hover:shadow-md cursor-pointer"
                          >
                            <Save size={16} />
                            {savingId === student._id ? "Saving..." : "Save"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
