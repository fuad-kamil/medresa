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
  FileDown,
  Send
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
  const [fetchError, setFetchError] = useState(false);
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
  const [autoSyncedMap, setAutoSyncedMap] = useState({});

  // Manage Exams Panel state (Ustaz Only)
  const [showManagePanel, setShowManagePanel] = useState(false);
  const [newExamName, setNewExamName] = useState("");
  const [newExamMaxScore, setNewExamMaxScore] = useState(100);
  const [editingExamId, setEditingExamId] = useState(null);
  const [editingExamName, setEditingExamName] = useState("");
  const [configActionLoading, setConfigActionLoading] = useState(false);

  // Telegram PDF Report states (Admin Only)
  const [sendingReportId, setSendingReportId] = useState(null);
  const [sentReportId, setSentReportId] = useState(null);
  const [sendingAllReports, setSendingAllReports] = useState(false);
  const [sendAllProgress, setSendAllProgress] = useState(null);
  
  // Toast Notification
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };
  
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
      setAutoSyncedMap({});
    }
  }, [selectedUstaz, isAdmin]);

  const fetchAutoSyncedQuizzes = async (uId) => {
    try {
      const EXAM_API_URL = import.meta.env.VITE_EXAM_API_URL || 'http://localhost:5001/api';
      const targetUstazId = uId || user?._id || user?.id || 'ustaz_default';
      const resQuizzes = await fetch(`${EXAM_API_URL}/quizzes/ustaz/${targetUstazId}`);
      if (!resQuizzes.ok) return { syncedMap: {}, onlineScoresMap: {} };

      const quizzesData = await resQuizzes.json();
      const syncedMap = {};
      const onlineScoresMap = {};

      await Promise.all(quizzesData.map(async (quiz) => {
        try {
          const resSub = await fetch(`${EXAM_API_URL}/quizzes/${quiz._id}/submissions`);
          if (resSub.ok) {
            const subs = await resSub.json();
            if (Array.isArray(subs)) {
              subs.forEach((s) => {
                if (s.studentId) {
                  const targetMax = quiz.maxScore || 100;
                  const calculatedScore = (s.correctAnswers !== undefined && s.totalQuestions > 0)
                    ? Math.round((s.correctAnswers / s.totalQuestions) * targetMax)
                    : s.score;

                  if (quiz.examColumnId) {
                    syncedMap[`${s.studentId}_${quiz.examColumnId}`] = true;
                    onlineScoresMap[`${s.studentId}_${quiz.examColumnId}`] = calculatedScore;
                  }
                  if (quiz.examColumnName) {
                    syncedMap[`${s.studentId}_${quiz.examColumnName}`] = true;
                    onlineScoresMap[`${s.studentId}_${quiz.examColumnName}`] = calculatedScore;
                  }
                }
              });
            }
          }
        } catch (subErr) {
          console.warn('Failed to fetch quiz submissions:', subErr);
        }
      }));

      return { syncedMap, onlineScoresMap };
    } catch (err) {
      console.warn('Failed to fetch online quizzes for sync lock:', err);
      return { syncedMap: {}, onlineScoresMap: {} };
    }
  };

  const fetchUstazs = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const res = await axiosInstance.get("/admin/ustazs");
      const approvedKitabUstazs = res.data.filter(u => u.isApproved && u.stream === 'kitab');
      setUstazs(approvedKitabUstazs);
    } catch (err) {
      console.error("Failed to fetch Ustazs", err);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  const loadUstazData = async () => {
    setTableLoading(true);
    setFetchError(false);
    try {
      const examsRes = await axiosInstance.get("/ustaz/exams");
      const activeExams = examsRes.data;
      setExams(activeExams);

      const studentsRes = await axiosInstance.get("/ustaz/students");
      const kitabStudents = studentsRes.data.filter(s => s.stream === 'kitab');
      setStudents(kitabStudents);

      initializeScores(kitabStudents, activeExams);

      // Fetch auto-synced online quizzes to lock & update online exam score cells
      const { syncedMap, onlineScoresMap } = await fetchAutoSyncedQuizzes(user?._id || user?.id);
      setAutoSyncedMap(syncedMap);

      if (Object.keys(onlineScoresMap).length > 0) {
        setScores((prevScores) => {
          const updated = { ...prevScores };
          Object.keys(onlineScoresMap).forEach((key) => {
            const [stId, exId] = key.split('_');
            if (stId && exId && updated[stId]) {
              updated[stId][exId] = onlineScoresMap[key];
            }
          });
          return updated;
        });
      }
    } catch (err) {
      console.error("Failed to load ustaz data", err);
      setFetchError(true);
    } finally {
      setTableLoading(false);
      setLoading(false);
    }
  };

  const loadAdminUstazData = async (ustazId) => {
    setTableLoading(true);
    setFetchError(false);
    try {
      const examsRes = await axiosInstance.get(`/admin/exams/ustaz/${ustazId}`);
      const activeExams = examsRes.data;
      setExams(activeExams);

      const studentsRes = await axiosInstance.get("/admin/students");
      const ustazStudents = studentsRes.data.filter(s => s.assignedUstaz?._id === ustazId && s.stream === 'kitab');
      setStudents(ustazStudents);

      initializeScores(ustazStudents, activeExams);

      const { syncedMap, onlineScoresMap } = await fetchAutoSyncedQuizzes(ustazId);
      setAutoSyncedMap(syncedMap);

      if (Object.keys(onlineScoresMap).length > 0) {
        setScores((prevScores) => {
          const updated = { ...prevScores };
          Object.keys(onlineScoresMap).forEach((key) => {
            const [stId, exId] = key.split('_');
            if (stId && exId && updated[stId]) {
              updated[stId][exId] = onlineScoresMap[key];
            }
          });
          return updated;
        });
      }
    } catch (err) {
      console.error("Failed to load admin ustaz data", err);
      setFetchError(true);
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

        const savedScore = student.examScores?.[exam._id] 
          ?? student.examScores?.[String(exam._id)] 
          ?? student.examScores?.[exam.name];
        initialScores[student._id][exam._id] = savedScore !== undefined ? savedScore : legacyScore;
      });
    });
    setScores(initialScores);
  };

  const handleScoreChange = (studentId, examId, val) => {
    const exam = exams.find(e => e._id === examId);
    const isAutoSynced = Boolean(
      autoSyncedMap[`${studentId}_${examId}`] || 
      (exam?.name && autoSyncedMap[`${studentId}_${exam.name}`])
    );
    if (isAutoSynced) return; // Locked: score comes directly from online exam submission

    let numericVal = val === "" ? "" : Number(val);
    const maxAllowed = exam?.maxScore || 100;
    if (numericVal !== "" && (isNaN(numericVal) || numericVal < 0 || numericVal > maxAllowed)) {
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
      toast.success("Exam scores saved successfully!");
      setTimeout(() => setSavedSuccessId(null), 3000);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save exam scores");
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
      toast.error(err.response?.data?.message || "Failed to create exam column");
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
      toast.error(err.response?.data?.message || "Failed to rename exam");
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
      toast.error(err.response?.data?.message || "Failed to delete exam column");
    } finally {
      setConfigActionLoading(false);
    }
  };

  // Telegram PDF functions
  const sendReportToTelegram = async (studentId) => {
    setSendingReportId(studentId);
    try {
      const res = await axiosInstance.post(`/admin/students/${studentId}/send-report`);
      setSentReportId(studentId);
      setTimeout(() => setSentReportId(null), 3000);
      showToast(res.data.message || 'Report card generated successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to generate report card.', 'error');
    } finally {
      setSendingReportId(null);
    }
  };

  const sendAllReportsToTelegram = async () => {
    if (!selectedUstaz) return;
    setSendingAllReports(true);
    setSendAllProgress('Starting...');
    try {
      const res = await axiosInstance.post(`/admin/send-all-reports`, { ustazId: selectedUstaz });
      showToast(`Done! ${res.data.successCount} generated, ${res.data.failCount} failed.`, res.data.failCount === 0 ? 'success' : 'warning');
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to send all reports.', 'error');
    } finally {
      setSendingAllReports(false);
      setSendAllProgress(null);
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
      toast.error("Failed to generate PDF. Please try again.");
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
        // A4 at 96dpi = 794 x 1123px. We capture at pixelRatio:2 for sharpness.
        const dataUrl = await toPng(captureRef.current, {
          quality: 1,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          width: 794,
          height: captureRef.current.scrollHeight,
        });
        const img = new Image();
        img.src = dataUrl;
        await new Promise(resolve => { img.onload = resolve; });

        // A4 in mm
        const A4_W = 210;
        const A4_H = 297;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        
        // Scale image to fit full A4 width
        const imgHeightInMm = (img.height / img.width) * A4_W;

        if (imgHeightInMm <= A4_H) {
          // Fits on one page — centre vertically
          const yOffset = (A4_H - imgHeightInMm) / 2;
          pdf.addImage(dataUrl, 'PNG', 0, yOffset, A4_W, imgHeightInMm);
        } else {
          // Taller than one page — scale down to fit height
          const scaledW = (A4_H / imgHeightInMm) * A4_W;
          const xOffset = (A4_W - scaledW) / 2;
          pdf.addImage(dataUrl, 'PNG', xOffset, 0, scaledW, A4_H);
        }

        pdf.save(`ReportCard_${student.fullName.replace(/\s+/g, '_')}.pdf`);
      } catch (err) {
        console.error('PDF download error:', err);
        toast.error('Failed to download PDF. Please try again.');
      } finally {
        setDownloadingPdfId(null);
      }
    }, 300);
  };

  const downloadExcel = () => {
    if (filteredStudents.length === 0) {
        toast.error("No student data available to export.");
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
      <div className="flex flex-col justify-center items-center h-64 gap-4">
        <div className="animate-spin w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full font-medium"></div>
        <p className="text-gray-500 dark:text-gray-400">Loading exams data…</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">If this takes long, the server may be waking up (up to 60s)</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white font-semibold text-sm max-w-sm animate-in slide-in-from-top-2 fade-in duration-300 ${
          toast.type === 'success' ? 'bg-emerald-600' :
          toast.type === 'warning' ? 'bg-amber-500' : 'bg-red-600'
        }`}>
          <span className="text-lg">{toast.type === 'success' ? '✅' : toast.type === 'warning' ? '⚠️' : '❌'}</span>
          {toast.message}
        </div>
      )}
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

      {fetchError && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="font-bold text-amber-800 dark:text-amber-300">⚠️ Could not connect to the server</p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">The server may still be starting up. Wait a few seconds then retry.</p>
          </div>
          <button
            onClick={isAdmin ? (selectedUstaz ? () => loadAdminUstazData(selectedUstaz) : fetchUstazs) : loadUstazData}
            className="shrink-0 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition text-sm"
          >
            Retry Connection
          </button>
        </div>
      )}

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
                        onClick={() => {
                          const examUrl = import.meta.env.VITE_EXAM_FRONTEND_URL || 'https://medresa-ckrx.vercel.app';
                          const token = localStorage.getItem('token') || '';
                          const userStr = JSON.stringify(user || {});
                          window.open(`${examUrl}?token=${encodeURIComponent(token)}&user=${encodeURIComponent(userStr)}`, '_blank');
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl transition font-semibold text-md shadow-md cursor-pointer whitespace-nowrap hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <GraduationCap size={18} />
                        Online Quiz Builder
                      </button>
                    )}

                    {isAdmin && selectedUstaz && (
                        <button
                            onClick={sendAllReportsToTelegram}
                            disabled={sendingAllReports}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl transition font-semibold text-md shadow-md cursor-pointer whitespace-nowrap hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {sendingAllReports ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            {sendAllProgress || "Send All to Telegram"}
                        </button>
                    )}

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

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-4">
              {tableLoading ? (
                  <div className="flex justify-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-850 shadow-sm">
                      <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full font-medium"></div>
                  </div>
              ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-850 text-gray-500 font-medium shadow-sm">
                      No students found.
                  </div>
              ) : (
                  filteredStudents.map((student) => {
                      const studentScores = scores[student._id] || {};
                      let totalScore = 0;
                      exams.forEach(exam => {
                          totalScore += Number(studentScores[exam._id]) || 0;
                      });
                      
                      return (
                          <div key={student._id} className="bg-white dark:bg-gray-900 rounded-3xl shadow-md border border-gray-100 dark:border-gray-800 p-5 flex flex-col gap-4 transition-all duration-200 hover:shadow-lg">
                              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
                                  <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                                      <User size={18} className="text-emerald-500" />
                                      {student.fullName}
                                  </h3>
                                  <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider">Rank</span>
                                      <span className="text-emerald-700 dark:text-emerald-400 font-black text-sm">#{getStudentRank(student._id)}</span>
                                  </div>
                              </div>
                              
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                  {exams.map((exam) => {
                                      const isAutoSynced = Boolean(
                                          autoSyncedMap[`${student._id}_${exam._id}`] || 
                                          (exam.name && autoSyncedMap[`${student._id}_${exam.name}`]) ||
                                          student.autoSyncedExams?.includes(String(exam._id)) ||
                                          (exam.name && student.autoSyncedExams?.includes(exam.name))
                                      );
                                      return (
                                          <div key={exam._id} className={`p-3 rounded-2xl border flex flex-col justify-between transition-all ${isAutoSynced ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/30' : 'bg-gray-50 dark:bg-gray-950/50 border-gray-100 dark:border-gray-800'}`}>
                                              <label className="flex items-center justify-between text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide truncate" title={exam.name}>
                                                  <span>{exam.name} <span className="font-normal normal-case opacity-70 block mt-0.5">Max: {exam.maxScore || 100}</span></span>
                                              </label>
                                              <input
                                                  type="number"
                                                  min="0"
                                                  max={exam.maxScore || 100}
                                                  disabled={isAutoSynced}
                                                  readOnly={isAutoSynced}
                                                  value={studentScores[exam._id] ?? 0}
                                                  onChange={(e) => handleScoreChange(student._id, exam._id, e.target.value)}
                                                  className={`w-full px-3 py-2.5 text-center border rounded-xl outline-none transition font-bold shadow-sm ${isAutoSynced ? 'bg-gray-100/90 dark:bg-gray-800/80 text-emerald-600 dark:text-emerald-400 cursor-not-allowed border-dashed border-emerald-300/60 dark:border-emerald-700/60 font-black shadow-inner opacity-90' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500'}`}
                                              />
                                          </div>
                                      );
                                  })}
                              </div>
                              
                              <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                                  <span className="font-bold text-emerald-800 dark:text-emerald-400">Total Score</span>
                                  <span className="font-black text-2xl text-emerald-600 dark:text-emerald-400">{totalScore}</span>
                              </div>
                              
                              <div className="flex gap-2 justify-end mt-1 pt-3 border-t border-gray-100 dark:border-gray-800">
                                  <button
                                      onClick={() => generatePDF(student)}
                                      disabled={generatingPdfId === student._id}
                                      className="p-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-emerald-600 dark:text-emerald-400 rounded-xl transition cursor-pointer shadow-sm"
                                  >
                                      {generatingPdfId === student._id ? <Loader2 size={20} className="animate-spin" /> : <FileText size={20} />}
                                  </button>
                                  <button
                                      onClick={() => downloadPDF(student)}
                                      disabled={downloadingPdfId === student._id}
                                      className="p-3.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:hover:bg-emerald-800/60 text-emerald-700 dark:text-emerald-400 rounded-xl transition cursor-pointer shadow-sm"
                                  >
                                      {downloadingPdfId === student._id ? <Loader2 size={20} className="animate-spin" /> : <FileDown size={20} />}
                                  </button>
                                  {savedSuccessId === student._id ? (
                                      <span className="flex items-center justify-center gap-1.5 flex-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold text-sm shadow-sm animate-pulse">
                                          <CheckCircle size={18} /> Saved
                                      </span>
                                  ) : (
                                      <button
                                          onClick={() => handleSaveScores(student._id)}
                                          disabled={savingId === student._id}
                                          className="flex items-center justify-center gap-2 flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-bold text-sm transition shadow-md shadow-emerald-600/20 cursor-pointer"
                                      >
                                          {savingId === student._id ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                          {savingId === student._id ? "Saving..." : "Save Scores"}
                                      </button>
                                  )}
                                  
                                  {isAdmin && (
                                    <button
                                        onClick={() => sendReportToTelegram(student._id)}
                                        disabled={sendingReportId === student._id}
                                        title="Send to Telegram"
                                        className="p-3.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-800/60 text-blue-700 dark:text-blue-400 rounded-xl transition cursor-pointer shadow-sm"
                                    >
                                        {sendingReportId === student._id ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                                    </button>
                                  )}
                              </div>
                          </div>
                      );
                  })
              )}
            </div>

            {/* Ultra-Modern Desktop Table View */}
            <div className="hidden md:block bg-white dark:bg-gray-900/90 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800/80 backdrop-blur-md">
                <div className="w-full">
                <table className="w-full text-left border-collapse table-auto">
                    <thead>
                    <tr className="bg-gray-50/90 dark:bg-gray-950/80 border-b border-gray-100 dark:border-gray-800 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <th className="py-3.5 px-3 pl-5 text-center w-12 font-extrabold text-gray-700 dark:text-gray-300">No.</th>
                        <th className="py-3.5 px-4 font-extrabold text-gray-700 dark:text-gray-300">Student Name</th>
                        {exams.map((exam) => (
                        <th key={exam._id} className="py-3 px-2 text-center">
                            <div className="flex flex-col items-center justify-center gap-0.5">
                                <span className="text-gray-900 dark:text-gray-100 font-extrabold text-xs normal-case whitespace-nowrap">{exam.name}</span>
                                <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-black px-1.5 py-0.2 rounded-full text-[9px] border border-emerald-200/50 dark:border-emerald-800/40">
                                    Max: {exam.maxScore || 100}
                                </span>
                            </div>
                        </th>
                        ))}
                        <th className="py-3 px-2 text-center w-16">Total</th>
                        <th className="py-3 px-2 text-center w-14">Rank</th>
                        <th className="py-3.5 px-4 pr-6 text-center w-36">Action</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                    {tableLoading ? (
                        <tr>
                        <td colSpan={exams.length + 4} className="text-center py-20">
                            <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto font-medium"></div>
                        </td>
                        </tr>
                    ) : filteredStudents.length === 0 ? (
                        <tr>
                        <td colSpan={exams.length + 4} className="text-center py-20 text-gray-500 font-medium">
                            No students found.
                        </td>
                        </tr>
                    ) : (
                        filteredStudents.map((student, idx) => {
                        const studentScores = scores[student._id] || {};
                        let totalScore = 0;
                        
                        exams.forEach(exam => {
                            totalScore += Number(studentScores[exam._id]) || 0;
                        });

                        const rankNum = getStudentRank(student._id);

                        return (
                            <tr key={student._id} className="hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10 transition-colors duration-150 group">
                            {/* No. Column */}
                            <td className="py-3 px-3 pl-5 text-center text-xs font-extrabold text-gray-400 dark:text-gray-500">
                                {idx + 1}
                            </td>

                            {/* Student Name */}
                            <td className="py-3 px-4">
                                <span className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm whitespace-nowrap group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                    {student.fullName}
                                </span>
                            </td>
                            
                            {/* Dynamic Compact Exam Inputs */}
                            {exams.map((exam) => {
                                const isAutoSynced = Boolean(
                                    autoSyncedMap[`${student._id}_${exam._id}`] || 
                                    (exam.name && autoSyncedMap[`${student._id}_${exam.name}`]) ||
                                    student.autoSyncedExams?.includes(String(exam._id)) ||
                                    (exam.name && student.autoSyncedExams?.includes(exam.name))
                                );
                                return (
                                    <td key={exam._id} className="py-2.5 px-1.5 text-center">
                                        <input
                                            type="number"
                                            min="0"
                                            max={exam.maxScore || 100}
                                            disabled={isAutoSynced}
                                            readOnly={isAutoSynced}
                                            value={studentScores[exam._id] ?? 0}
                                            onChange={(e) => handleScoreChange(student._id, exam._id, e.target.value)}
                                            className={`w-14 sm:w-16 px-2 py-1.5 text-center border rounded-xl outline-none transition font-extrabold text-xs ${isAutoSynced ? 'bg-gray-100 dark:bg-gray-800/80 text-emerald-600 dark:text-emerald-400 cursor-not-allowed border-dashed border-emerald-300 dark:border-emerald-800 opacity-90 shadow-inner' : 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-gray-900 text-gray-800 dark:text-white hover:border-emerald-400'}`}
                                            title={isAutoSynced ? "Auto-graded online exam score (Read-only)" : ""}
                                        />
                                    </td>
                                );
                            })}

                            {/* Total Score */}
                            <td className="py-2.5 px-2 text-center">
                                <span className="inline-flex items-center justify-center bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 text-emerald-700 dark:text-emerald-400 font-black px-2.5 py-1 rounded-xl text-xs border border-emerald-200/50 dark:border-emerald-800/40 shadow-sm">
                                    {totalScore}
                                </span>
                            </td>

                            {/* Rank */}
                            <td className="py-2.5 px-2 text-center">
                                <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-lg text-[11px] font-black border ${rankNum === 1 ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/50' : rankNum === 2 ? 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700' : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40'}`}>
                                    #{rankNum}
                                </span>
                            </td>

                            {/* Exciting Action Buttons Toolbar */}
                            <td className="py-2.5 px-4 pr-6 text-center">
                                <div className="flex gap-1.5 justify-center items-center">
                                    <button
                                        onClick={() => generatePDF(student)}
                                        disabled={generatingPdfId === student._id}
                                        title="Print Report Card"
                                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 rounded-xl transition hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
                                    >
                                        {generatingPdfId === student._id ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
                                    </button>
                                    <button
                                        onClick={() => downloadPDF(student)}
                                        disabled={downloadingPdfId === student._id}
                                        title="Download Report Card as PDF"
                                        className="p-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-400 rounded-xl transition hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
                                    >
                                        {downloadingPdfId === student._id ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
                                    </button>
                                    
                                    {isAdmin && (
                                      <button
                                          onClick={() => sendReportToTelegram(student._id)}
                                          disabled={sendingReportId === student._id}
                                          title="Send Report to Telegram"
                                          className="p-1.5 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-400 rounded-xl transition hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
                                      >
                                          {sendingReportId === student._id ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                                      </button>
                                    )}

                                    {savedSuccessId === student._id ? (
                                    <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold text-xs shadow-sm animate-pulse">
                                        <CheckCircle size={13} /> Saved
                                    </span>
                                    ) : (
                                    <button
                                        onClick={() => handleSaveScores(student._id)}
                                        disabled={savingId === student._id}
                                        className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-extrabold text-xs transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
                                    >
                                        <Save size={13} />
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
