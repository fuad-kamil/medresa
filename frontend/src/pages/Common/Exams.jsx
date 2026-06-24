import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
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
  Loader2,
  User,
  Users,
  FileText,
  AlertTriangle,
  FileDown
} from "lucide-react";
import * as XLSX from "xlsx";
import { useReactToPrint } from "react-to-print";
import ReportCardTemplate from "../../components/ReportCard/ReportCardTemplate";
import { useRef } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

export default function Exams() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  // Redirect Quran Ustazs as exams are not applicable to them
  if (user && user.role === "ustaz" && user.stream === "quran") {
    return <Navigate to="/ustaz" replace />;
  }

  const [students, setStudents] = useState([]);
  const [ustazs, setUstazs] = useState([]);
  const [exams, setExams] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUstaz, setSelectedUstaz] = useState("");
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [savedSuccessId, setSavedSuccessId] = useState(null);
  const [generatingPdfId, setGeneratingPdfId] = useState(null);
  const reportCardRef = useRef(null);
  const captureRef = useRef(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState(null);
  const [reportCardData, setReportCardData] = useState(null);
  
  // Local score states for inline editing (mapped as: scores[studentId][examId])
  const [scores, setScores] = useState({});

  // Manage Exams Panel state (Ustaz Only)
  const [showManagePanel, setShowManagePanel] = useState(false);
  const [newExamName, setNewExamName] = useState("");
  const [newExamMaxScore, setNewExamMaxScore] = useState(100);
  const [editingExamId, setEditingExamId] = useState(null);
  const [editingExamName, setEditingExamName] = useState("");
  const [configActionLoading, setConfigActionLoading] = useState(false);
  
  // Custom Delete Modal State
  const [deleteModalData, setDeleteModalData] = useState(null);

  useEffect(() => {
    if (isAdmin) {
      fetchUstazs();
    } else {
      loadUstazData();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && selectedUstaz) {
      loadAdminUstazData(selectedUstaz);
    } else if (isAdmin && !selectedUstaz) {
      setExams([]);
      setStudents([]);
      setScores({});
    }
  }, [selectedUstaz, isAdmin]);

  const fetchUstazs = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/admin/ustazs");
      const approvedKitabUstazs = res.data.filter(u => u.isApproved && u.stream === 'kitab');
      setUstazs(approvedKitabUstazs);
    } catch (err) {
      console.error("Failed to fetch Ustazs", err);
    } finally {
      setLoading(false);
    }
  };

  const loadUstazData = async () => {
    setTableLoading(true);
    try {
      const examsRes = await axiosInstance.get("/ustaz/exams");
      const activeExams = examsRes.data;
      setExams(activeExams);

      const studentsRes = await axiosInstance.get("/ustaz/students");
      const kitabStudents = studentsRes.data.filter(s => s.stream === 'kitab');
      setStudents(kitabStudents);

      initializeScores(kitabStudents, activeExams);
    } catch (err) {
      console.error("Failed to load ustaz data", err);
    } finally {
      setTableLoading(false);
      setLoading(false);
    }
  };

  const loadAdminUstazData = async (ustazId) => {
    setTableLoading(true);
    try {
      const examsRes = await axiosInstance.get(`/admin/exams/ustaz/${ustazId}`);
      const activeExams = examsRes.data;
      setExams(activeExams);

      const studentsRes = await axiosInstance.get("/admin/students");
      const ustazStudents = studentsRes.data.filter(s => s.assignedUstaz?._id === ustazId && s.stream === 'kitab');
      setStudents(ustazStudents);

      initializeScores(ustazStudents, activeExams);
    } catch (err) {
      console.error("Failed to load admin ustaz data", err);
    } finally {
      setTableLoading(false);
    }
  };

  const initializeScores = (studentList, examList) => {
    const initialScores = {};
    studentList.forEach((student) => {
      initialScores[student._id] = {};
      examList.forEach((exam) => {
        let legacyScore = 0;
        if (exam.name === "First Exam") legacyScore = student.firstExam || 0;
        else if (exam.name === "Second Exam") legacyScore = student.secondExam || 0;
        else if (exam.name === "Final Exam") legacyScore = student.finalExam || 0;

        initialScores[student._id][exam._id] = student.examScores?.[exam._id] ?? legacyScore;
      });
    });
    setScores(initialScores);
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

  // Manage Exams Configuration (Ustaz Only)
  const handleAddExam = async (e) => {
    e.preventDefault();
    if (!newExamName.trim()) return;
    setConfigActionLoading(true);
    try {
      const res = await axiosInstance.post("/ustaz/exams", {
        name: newExamName.trim(),
        maxScore: newExamMaxScore
      });
      const newExam = res.data;
      
      const updatedExams = [...exams, newExam];
      setExams(updatedExams);
      setNewExamName("");
      
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
      await axiosInstance.put(`/ustaz/exams/${examId}`, {
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

  const confirmDeleteExam = async () => {
    if (!deleteModalData) return;
    
    setConfigActionLoading(true);
    const { id } = deleteModalData;
    
    try {
      const endpoint = isAdmin 
        ? `/admin/exams/${id}` 
        : `/ustaz/exams/${id}`;
        
      await axiosInstance.delete(endpoint);
      
      setExams(prev => prev.filter(e => e._id !== id));
      
      setScores(prev => {
        const copy = { ...prev };
        Object.keys(copy).forEach(studentId => {
          if (copy[studentId]) {
            delete copy[studentId][id];
          }
        });
        return copy;
      });
      
      setDeleteModalData(null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete exam column");
    } finally {
      setConfigActionLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    return student.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Calculate ranks based on total scores of all students in the group
  const calculateTotalScore = (studentId) => {
    const studentScores = scores[studentId] || {};
    let totalScore = 0;
    exams.forEach(exam => {
      totalScore += Number(studentScores[exam._id]) || 0;
    });
    return totalScore;
  };

  const studentsWithRanks = [...students].map(s => ({
    ...s,
    computedTotal: calculateTotalScore(s._id)
  })).sort((a, b) => b.computedTotal - a.computedTotal);
  
  const getStudentRank = (studentId) => {
    const index = studentsWithRanks.findIndex(s => s._id === studentId);
    return index >= 0 ? index + 1 : null;
  };

  const handlePrint = useReactToPrint({
    contentRef: reportCardRef,
    documentTitle: reportCardData ? `ReportCard_${reportCardData.fullName.replace(/\s+/g, '_')}` : 'Report_Card',
    onAfterPrint: () => setGeneratingPdfId(null),
    onPrintError: () => {
      alert("Failed to generate PDF. Please try again.");
      setGeneratingPdfId(null);
    }
  });

  const generatePDF = (student) => {
    setGeneratingPdfId(student._id);
    setReportCardData(student);
    setTimeout(() => {
      handlePrint();
    }, 100);
  };

  const downloadPDF = (student) => {
    setDownloadingPdfId(student._id);
    setReportCardData(student);
    setTimeout(async () => {
      try {
        if (!captureRef.current) return;
        const dataUrl = await toPng(captureRef.current, {
          quality: 1,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
        });
        const img = new Image();
        img.src = dataUrl;
        await new Promise(resolve => { img.onload = resolve; });
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pdfW = pdf.internal.pageSize.getWidth();
        const pdfH = (img.height * pdfW) / img.width;
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfW, pdfH);
        pdf.save(`ReportCard_${student.fullName.replace(/\s+/g, '_')}.pdf`);
      } catch (err) {
        console.error('PDF download error:', err);
        alert('Failed to download PDF. Please try again.');
      } finally {
        setDownloadingPdfId(null);
      }
    }, 200);
  };

  const downloadExcel = () => {
    if (filteredStudents.length === 0) {
        alert("No student data available to export.");
        return;
    }

    const data = filteredStudents.map((student) => {
      const studentScores = scores[student._id] || {};
      let totalScore = 0;

      const row = {
        "Student Name": student.fullName || "N/A",
      };

      exams.forEach((exam) => {
        const score = Number(studentScores[exam._id]) || 0;
        const columnHeader = `${exam.name} (Max: ${exam.maxScore || 100})`;
        row[columnHeader] = score;
        totalScore += score;
      });

      row["Total Score"] = totalScore;
      return row;
    });

    let ustazName = user?.name;
    if (isAdmin) {
        const selectedUstazObj = ustazs.find(u => u._id === selectedUstaz);
        ustazName = selectedUstazObj ? selectedUstazObj.name : "Admin View";
    }

    const worksheet = XLSX.utils.aoa_to_sheet([
      ["ALI MEDRESA - EXAM PERFORMANCE REPORT"],
      [`Ustaz: ${ustazName || "N/A"}`],
      ["Class Stream: Kitab"],
      [`Generated On: ${new Date().toLocaleDateString()}`],
      [] // Spacer row
    ]);
    XLSX.utils.sheet_add_json(worksheet, data, { origin: 5 });

    const totalCols = exams.length + 2; // Student Name + Exams + Total
    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }
    ];

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
    worksheet["!cols"] = cols;

    XLSX.writeFile(workbook, `Exams_Report_${ustazName.replace(/\s+/g, '_')}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full font-medium"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-800 dark:text-white flex items-center gap-3 tracking-tight">
            <GraduationCap size={48} className="text-emerald-600 shrink-0" />
            Exams & Performance
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-3 text-lg">
            {isAdmin ? "Select an Ustaz to view and manage their group's exam scores." : "Manage your custom exam columns and record student scores."}
          </p>
        </div>
      </div>

      {/* Admin Dropdown Section */}
      {isAdmin && (
        <div className="mb-8 p-6 bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-emerald-100 dark:border-gray-800 flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <Users size={32} />
            </div>
            <div className="flex-1 w-full">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Select Kitab Ustaz</h2>
                <select
                    value={selectedUstaz}
                    onChange={(e) => setSelectedUstaz(e.target.value)}
                    className="w-full md:w-2/3 px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-lg cursor-pointer shadow-sm text-gray-700 dark:text-gray-200"
                >
                    <option value="">-- Choose an Ustaz --</option>
                    {ustazs.map((ustaz) => (
                    <option key={ustaz._id} value={ustaz._id}>
                        {ustaz.name} {ustaz.kitabName ? `(${ustaz.kitabName})` : ''}
                    </option>
                    ))}
                </select>
            </div>
        </div>
      )}

      {/* Empty State for Admin */}
      {isAdmin && !selectedUstaz ? (
         <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 text-center animate-in fade-in zoom-in duration-500">
             <div className="w-32 h-32 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-6">
                 <User size={64} className="text-emerald-400 dark:text-emerald-500" />
             </div>
             <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">No Ustaz Selected</h3>
             <p className="text-gray-500 dark:text-gray-400 max-w-md">
                 Please select a Kitab Ustaz from the dropdown above to view their custom exam columns and student performance.
             </p>
         </div>
      ) : (
          /* Main Content Area (For Ustaz or Admin with selected Ustaz) */
          <>
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-between items-center mb-6">
                <div className="relative flex-1 w-full sm:max-w-md">
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

                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={downloadExcel}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition font-semibold text-md shadow-md cursor-pointer whitespace-nowrap hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Download size={18} />
                        Export
                    </button>

                    {!isAdmin && (
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

            {/* Ustaz Manage Exams Overlay Panel */}
            {!isAdmin && showManagePanel && (
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
                    <h3 className="text-md font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-4">Your Active Columns ({exams.length})</h3>
                    
                    {configActionLoading && (
                        <div className="flex justify-center py-4">
                        <Loader2 className="animate-spin text-emerald-600 h-6 w-6" />
                        </div>
                    )}

                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {exams.length === 0 && !configActionLoading && (
                            <p className="text-gray-500 text-sm text-center py-4">No custom exams created yet.</p>
                        )}
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
                                    onClick={() => setDeleteModalData({ id: exam._id, name: exam.name })}
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
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Max Score</label>
                            <input
                            type="number"
                            min="1"
                            value={newExamMaxScore}
                            onChange={(e) => setNewExamMaxScore(e.target.value)}
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
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-850">
                <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                        <th className="p-6 font-semibold text-gray-600 dark:text-gray-300">Student Name</th>
                        {exams.map((exam) => (
                        <th key={exam._id} className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-center min-w-[120px]">
                            <div className="flex flex-col items-center justify-center gap-0.5">
                                <span className="whitespace-nowrap">{exam.name}</span>
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal normal-case whitespace-nowrap">(Max: {exam.maxScore || 100})</span>
                            </div>
                        </th>
                        ))}
                        <th className="p-6 font-semibold text-gray-600 dark:text-gray-300 text-center w-28">Total</th>
                        <th className="p-6 font-semibold text-gray-600 dark:text-gray-300 text-center w-28">Rank</th>
                        <th className="p-6 font-semibold text-gray-600 dark:text-gray-300 text-center w-40">Action</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-800">
                    {tableLoading ? (
                        <tr>
                        <td colSpan={exams.length + 3} className="text-center py-20">
                            <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto font-medium"></div>
                        </td>
                        </tr>
                    ) : filteredStudents.length === 0 ? (
                        <tr>
                        <td colSpan={exams.length + 3} className="text-center py-20 text-gray-500 font-medium">
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

                            {/* Rank */}
                            <td className="p-6 text-center font-bold text-gray-700 dark:text-gray-300">
                                #{getStudentRank(student._id)}
                            </td>

                            {/* Action Button */}
                            <td className="p-6 text-center">
                                <div className="flex gap-2 justify-center">
                                    <button
                                        onClick={() => generatePDF(student)}
                                        disabled={generatingPdfId === student._id}
                                        title="Print Report Card"
                                        className="inline-flex items-center justify-center p-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 disabled:opacity-50 text-emerald-600 dark:text-emerald-400 rounded-xl transition shadow-sm cursor-pointer"
                                    >
                                        {generatingPdfId === student._id ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                                    </button>
                                    <button
                                        onClick={() => downloadPDF(student)}
                                        disabled={downloadingPdfId === student._id}
                                        title="Download Report Card as PDF"
                                        className="inline-flex items-center justify-center p-2.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:hover:bg-emerald-800/60 disabled:opacity-50 text-emerald-700 dark:text-emerald-400 rounded-xl transition shadow-sm cursor-pointer"
                                    >
                                        {downloadingPdfId === student._id ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
                                    </button>
                                    
                                    {savedSuccessId === student._id ? (
                                    <span className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold text-sm shadow-sm animate-pulse w-[88px]">
                                        <CheckCircle size={16} /> Saved
                                    </span>
                                    ) : (
                                    <button
                                        onClick={() => handleSaveScores(student._id)}
                                        disabled={savingId === student._id}
                                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl font-semibold text-sm transition shadow-sm hover:shadow-md cursor-pointer w-[88px]"
                                    >
                                        <Save size={16} />
                                        {savingId === student._id ? "..." : "Save"}
                                    </button>
                                    )}
                                </div>
                            </td>
                            </tr>
                        );
                        })
                    )}
                    </tbody>
                </table>
                </div>
            </div>
          </>
      )}

      {/* Hidden Report Card Template */}
      <ReportCardTemplate 
        ref={reportCardRef}
        captureRef={captureRef}
        student={reportCardData}
        exams={exams}
        scores={scores}
        rank={reportCardData ? getStudentRank(reportCardData._id) : null}
        totalStudents={students.length}
        ustazName={isAdmin ? (ustazs.find(u => u._id === selectedUstaz)?.name) : user?.name}
        kitabName={isAdmin ? (ustazs.find(u => u._id === selectedUstaz)?.kitabName) : user?.kitabName}
      />
      {/* Delete Confirmation Modal */}
      {deleteModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={40} className="text-red-500" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Delete Exam Column?</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Are you sure you want to delete the <span className="font-bold text-gray-700 dark:text-gray-300">"{deleteModalData.name}"</span> column?
              </p>
              
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 mb-8 text-left flex gap-3">
                <AlertTriangle size={24} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-400 font-medium leading-relaxed">
                  <span className="font-bold block mb-1">Warning:</span>
                  All student scores associated with this exam will be permanently deleted and cannot be recovered.
                </p>
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setDeleteModalData(null)}
                  disabled={configActionLoading}
                  className="flex-1 py-3.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteExam}
                  disabled={configActionLoading}
                  className="flex-1 py-3.5 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold rounded-xl transition flex justify-center items-center gap-2 cursor-pointer shadow-md shadow-red-600/20"
                >
                  {configActionLoading ? <Loader2 size={20} className="animate-spin" /> : "Yes, Delete It"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
