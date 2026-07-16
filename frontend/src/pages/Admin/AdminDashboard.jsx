import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { Users, Calendar, ChevronDown, ChevronUp, User, CheckCircle, Trash2, ArrowRightLeft, History, X, AlertTriangle, RotateCcw, UserPlus, Archive } from "lucide-react";
import toast from 'react-hot-toast';
import useAuthStore from "../../store/authStore";
import useTranslation from "../../hooks/useTranslation";

export default function AdminDashboard() {
  const { token, language } = useAuthStore();
  const { t } = useTranslation();
  const [students, setStudents] = useState([]);
  const [ustazs, setUstazs] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [ustazAttendanceStatus, setUstazAttendanceStatus] = useState({});
  const [expandedUstazId, setExpandedUstazId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  // History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [selectedStudentName, setSelectedStudentName] = useState("");
  const [selectedHistoryStudentId, setSelectedHistoryStudentId] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferStudentId, setTransferStudentId] = useState(null);
  const [newUstazId, setNewUstazId] = useState("");

  // Delete Student Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  // Delete Ustaz Modal State
  const [isDeleteUstazModalOpen, setIsDeleteUstazModalOpen] = useState(false);
  const [ustazToDelete, setUstazToDelete] = useState(null);

  // Create Ustaz Modal State
  const [isCreateUstazModalOpen, setIsCreateUstazModalOpen] = useState(false);
  const [newUstazData, setNewUstazData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    stream: "quran",
    kitabName: "",
    teachingDays: [0, 1, 2, 3, 4, 5, 6],
    studentPhoneOption: 1,
  });
  const [createUstazLoading, setCreateUstazLoading] = useState(false);

  // Semester Reset Modal State
  const [isSemesterResetModalOpen, setIsSemesterResetModalOpen] = useState(false);
  const [ustazToReset, setUstazToReset] = useState(null);
  const [resettingSemester, setResettingSemester] = useState(false);

  // Semester Archives States
  const [isArchivesModalOpen, setIsArchivesModalOpen] = useState(false);
  const [archives, setArchives] = useState([]);
  const [loadingArchives, setLoadingArchives] = useState(false);
  const [selectedArchive, setSelectedArchive] = useState(null);
  const [inviteCode, setInviteCode] = useState("ALI_JOIN_2026");

  const fetchArchives = async () => {
    setLoadingArchives(true);
    try {
      const res = await axiosInstance.get("/admin/semester-archives");
      setArchives(res.data);
    } catch (err) {
      console.error("Failed to fetch archives:", err);
      toast.error("Failed to fetch archives.");
    } finally {
      setLoadingArchives(false);
    }
  };

  useEffect(() => {
    if (isArchivesModalOpen) {
      fetchArchives();
    }
  }, [isArchivesModalOpen]);

  useEffect(() => {
    const fetchInviteCode = async () => {
      try {
        const res = await axiosInstance.get("/admin/settings/invite-code");
        setInviteCode(res.data.inviteCode);
      } catch (err) {
        console.error("Failed to fetch invite code:", err);
      }
    };
    fetchInviteCode();
  }, []);

  const downloadArchiveCSV = (archive) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Student Name,Stream,Quran Surah,Present Count,Absent Count,Excused Count,Exam Grades\n";
    
    archive.studentsSnapshot.forEach((student) => {
      let examGrades = [];
      if (student.examScores) {
        Object.entries(student.examScores).forEach(([examId, score]) => {
          const matchedExam = archive.examsSnapshot?.find(e => e.examId === examId);
          const examLabel = matchedExam ? `${matchedExam.name} (${score}/${matchedExam.maxScore})` : `Score: ${score}`;
          examGrades.push(examLabel);
        });
      }
      const gradesStr = examGrades.join(" | ");
      
      const nameEscaped = `"${student.fullName.replace(/"/g, '""')}"`;
      const streamEscaped = `"${student.stream || ""}"`;
      const surahEscaped = `"${student.surah || "N/A"}"`;
      const gradesEscaped = `"${gradesStr.replace(/"/g, '""')}"`;
      
      csvContent += `${nameEscaped},${streamEscaped},${surahEscaped},${student.presentCount || 0},${student.absentCount || 0},${student.excusedCount || 0},${gradesEscaped}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `semester_archive_${archive.ustazName}_${new Date(archive.endedAt).toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchData = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      // Use allSettled so a single failing request doesn't kill the whole dashboard
      const [studentsRes, ustazsRes, attendanceRes, attStatusRes] = await Promise.allSettled([
        axiosInstance.get("/admin/students"),
        axiosInstance.get("/admin/ustazs"),
        axiosInstance.get("/admin/attendance/today"),
        axiosInstance.get("/admin/ustazs/attendance-status"),
      ]);

      if (studentsRes.status === 'fulfilled')   setStudents(studentsRes.value.data);
      if (ustazsRes.status === 'fulfilled')     setUstazs(ustazsRes.value.data);
      if (attendanceRes.status === 'fulfilled') setTodayAttendance(attendanceRes.value.data);
      if (attStatusRes.status === 'fulfilled')  setUstazAttendanceStatus(attStatusRes.value.data);

      // Show error banner only if ALL requests failed (server is completely unreachable)
      const allFailed = [studentsRes, ustazsRes, attendanceRes, attStatusRes]
        .every(r => r.status === 'rejected');
      if (allFailed) setFetchError(true);

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const toggleUstaz = (id) => {
    setExpandedUstazId(expandedUstazId === id ? null : id);
  };

  const handleApproveUstaz = async (ustazId, e) => {
    e.stopPropagation();
    try {
      await axiosInstance.patch(`/admin/ustaz/approve/${ustazId}`);
      toast.success("Ustaz approved successfully!");
    } catch (error) {
      console.error("Failed to approve ustaz:", error);
      toast.error("Failed to approve Ustaz.");
    }
  };

  const handleDeleteStudentClick = (student, e) => {
    e.stopPropagation();
    setStudentToDelete(student);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    
    try {
      await axiosInstance.delete(`/admin/students/${studentToDelete._id}`);
      setStudents(students.filter(s => s._id !== studentToDelete._id));
      setIsDeleteModalOpen(false);
      setStudentToDelete(null);
      toast.success("Student deleted successfully!");
    } catch (error) {
      console.error("Failed to delete student:", error);
      toast.error("Failed to delete student.");
    }
  };

  const handleDeleteUstazClick = (ustaz, e) => {
    e.stopPropagation();
    setUstazToDelete(ustaz);
    setIsDeleteUstazModalOpen(true);
  };

  const confirmDeleteUstaz = async () => {
    if (!ustazToDelete) return;
    
    try {
      await axiosInstance.delete(`/admin/ustaz/${ustazToDelete._id}`);
      setUstazs(ustazs.filter(u => u._id !== ustazToDelete._id));
      setIsDeleteUstazModalOpen(false);
      setUstazToDelete(null);
      toast.success("Ustaz deleted successfully!");
    } catch (error) {
      console.error("Failed to delete ustaz:", error);
      toast.error("Failed to delete Ustaz.");
    }
  };

  const handleCreateUstaz = async (e) => {
    e.preventDefault();
    if (!newUstazData.name.trim()) return toast.error("Full name is required");
    if (!newUstazData.email.trim()) return toast.error("Email is required");
    if (newUstazData.password.length < 6) return toast.error("Password must be at least 6 characters");
    if (newUstazData.stream === "kitab" && !newUstazData.kitabName.trim()) return toast.error("Kitab name is required for Kitab stream");
    if (newUstazData.teachingDays.length === 0) return toast.error("Please select at least one teaching day");

    setCreateUstazLoading(true);
    try {
      await axiosInstance.post("/admin/ustazs", {
        name: newUstazData.name.trim(),
        email: newUstazData.email.trim(),
        password: newUstazData.password,
        phone: newUstazData.phone.trim(),
        stream: newUstazData.stream,
        kitabName: newUstazData.stream === "kitab" ? newUstazData.kitabName.trim() : undefined,
        teachingDays: newUstazData.teachingDays,
        studentPhoneOption: newUstazData.studentPhoneOption,
      });

      toast.success("Ustaz created successfully!");
      setIsCreateUstazModalOpen(false);
      
      // Reset form
      setNewUstazData({
        name: "",
        email: "",
        password: "",
        phone: "",
        stream: "quran",
        kitabName: "",
        teachingDays: [0, 1, 2, 3, 4, 5, 6],
        studentPhoneOption: 1,
      });

      fetchData();
    } catch (err) {
      console.error("Failed to create Ustaz:", err);
      toast.error(err.response?.data?.message || "Failed to create Ustaz.");
    } finally {
      setCreateUstazLoading(false);
    }
  };

  const handleDayToggleInModal = (dayId) => {
    setNewUstazData((prev) => {
      const currentDays = prev.teachingDays;
      if (currentDays.includes(dayId)) {
        return { ...prev, teachingDays: currentDays.filter(d => d !== dayId) };
      } else {
        return { ...prev, teachingDays: [...currentDays, dayId].sort() };
      }
    });
  };

  const openTransferModal = (studentId, e) => {
    e.stopPropagation();
    setTransferStudentId(studentId);
    setNewUstazId("");
    setIsTransferModalOpen(true);
  };

  const handleTransferStudent = async () => {
    if (!newUstazId) {
      toast.error("Please select an Ustaz to transfer to.");
      return;
    }
    
    try {
      const res = await axiosInstance.patch(`/admin/students/${transferStudentId}/transfer`, { assignedUstaz: newUstazId });
      
      // Update local state
      setStudents(students.map(s => s._id === transferStudentId ? { ...s, assignedUstaz: res.data.student.assignedUstaz } : s));
      setIsTransferModalOpen(false);
      toast.success("Student transferred successfully!");
    } catch (error) {
      console.error("Failed to transfer student:", error);
      toast.error("Failed to transfer student.");
    }
  };

  const openHistoryModal = async (student) => {
    setSelectedStudentName(student.fullName);
    setSelectedHistoryStudentId(student._id);
    setIsHistoryModalOpen(true);
    setLoadingHistory(true);
    setHistoryData([]);

    try {
      const res = await axiosInstance.get(`/admin/students/${student._id}/attendance`);
      setHistoryData(res.data);
    } catch (error) {
      console.error("Failed to fetch student history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const confirmResetAttendance = async () => {
    try {
      await axiosInstance.delete(`/admin/students/${selectedHistoryStudentId}/attendance`);
      setHistoryData([]);
      
      // Update the main students list to show 0 for counts
      setStudents(students.map(s => {
        if (s._id === selectedHistoryStudentId) {
          return { ...s, presentCount: 0, absentCount: 0, excusedCount: 0 };
        }
        return s;
      }));

      setIsResetModalOpen(false);
      toast.success("Attendance history reset successfully!");
    } catch (error) {
      console.error("Failed to reset attendance history:", error);
      toast.error("Failed to reset attendance history.");
    }
  };

  const handleResetSemesterClick = (ustaz, e) => {
    e.stopPropagation();
    setUstazToReset(ustaz);
    setIsSemesterResetModalOpen(true);
  };

  const confirmResetSemester = async () => {
    if (!ustazToReset) return;
    setResettingSemester(true);
    try {
      await axiosInstance.post(`/admin/ustaz/${ustazToReset._id}/reset-semester`);
      toast.success(`Semester archived and reset for ${ustazToReset.name}!`);
      setIsSemesterResetModalOpen(false);
      setUstazToReset(null);
      fetchData();
    } catch (err) {
      console.error("Failed to reset semester:", err);
      toast.error(err.response?.data?.message || "Failed to reset semester.");
    } finally {
      setResettingSemester(false);
    }
  };

  const getStudentAttendanceStatus = (studentId) => {
    const record = todayAttendance.find((att) => att.student === studentId);
    return record ? record.status : "not marked";
  };

  const totalStudents = students.length;
  let attendancePercentage = 0;
  if (totalStudents > 0) {
    const presentCount = todayAttendance.filter((att) => att.status === "present").length;
    attendancePercentage = Math.round((presentCount / totalStudents) * 100);
  }

  if (loading) return (
    <div className="text-center py-20">
      <div className="inline-block w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-gray-500 dark:text-gray-400">Loading dashboard…</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">If this takes long, the server may be waking up (up to 60s)</p>
    </div>
  );

  const approvedUstazs = ustazs.filter(u => u.isApproved);
  const quranUstazsCount = ustazs.filter(u => u.stream === 'quran' || !u.stream).length;
  const kitabUstazsCount = ustazs.filter(u => u.stream === 'kitab').length;

  return (
    <div>
      {/* Server waking up banner */}
      {fetchError && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="font-bold text-amber-800 dark:text-amber-300">⚠️ Could not connect to the server</p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">The server may still be starting up. Wait a few seconds then retry.</p>
          </div>
          <button
            onClick={fetchData}
            className="shrink-0 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition text-sm"
          >
            Retry
          </button>
        </div>
      )}
      <div className="mb-10">
        <h1 className="text-4xl lg:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-400 pb-2">
          {t("Assalamu Alaikum")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-3 text-lg">
          {t("Welcome to your dashboard")}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white dark:bg-zinc-900/65 backdrop-blur-md p-6 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-premium hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] hover:-translate-y-1 transition duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">{t("Total Students")}</p>
              <p className="text-4xl font-extrabold mt-4 text-slate-800 dark:text-white">{totalStudents}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner">
              <Users size={22} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/65 backdrop-blur-md p-6 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-premium hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] hover:-translate-y-1 transition duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">{t("Total Ustazs")}</p>
              <p className="text-4xl font-extrabold mt-4 text-slate-800 dark:text-white">{ustazs.length}</p>
              <div className="flex items-center gap-2 mt-3 text-xs font-semibold text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800/40 px-2 py-1 rounded-lg w-max border border-slate-100 dark:border-zinc-800/60">
                <span>Quran: <strong className="text-emerald-600 dark:text-emerald-400">{quranUstazsCount}</strong></span>
                <span className="text-slate-300 dark:text-zinc-700">|</span>
                <span>Kitab: <strong className="text-blue-600 dark:text-blue-400">{kitabUstazsCount}</strong></span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-500/5 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner">
              <User size={22} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/65 backdrop-blur-md p-6 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-premium hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] hover:-translate-y-1 transition duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">{t("Today's Attendance")}</p>
              <p className="text-4xl font-extrabold mt-4 text-slate-800 dark:text-white">{attendancePercentage}%</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
              <Calendar size={22} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {t("Ustazs & Students Overview")}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
            {t("Teacher Join Code")}: <code className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold border border-emerald-100 dark:border-emerald-900/40 select-all" title="Click to select code">{inviteCode}</code>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsArchivesModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-800 dark:text-white font-bold rounded-2xl border border-gray-200 dark:border-gray-700 transition text-sm w-full sm:w-auto shrink-0 cursor-pointer"
          >
            <History size={16} /> {t("Semester Archives")}
          </button>
          <button
            onClick={() => setIsCreateUstazModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-premium hover:shadow-[0_8px_20px_-6px_rgba(16,185,129,0.4)] transition text-sm w-full sm:w-auto shrink-0"
          >
            <UserPlus size={16} /> {t("Add New Ustaz")}
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        {ustazs.map((ustaz) => {
          const ustazStudents = students.filter((s) => s.assignedUstaz && s.assignedUstaz._id === ustaz._id);
          const isExpanded = expandedUstazId === ustaz._id;

          return (
            <div key={ustaz._id} className="bg-white/70 dark:bg-zinc-900/40 backdrop-blur-sm rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-premium overflow-hidden transition-all duration-300">
              <div
                onClick={() => toggleUstaz(ustaz._id)}
                className="w-full px-5 sm:px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition cursor-pointer"
              >
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-800/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center font-bold shrink-0">
                    <User size={20} />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-bold text-gray-800 dark:text-white text-lg flex items-center gap-2 truncate">
                      {ustaz.name}
                      {ustaz.isApproved && <CheckCircle size={16} className="text-emerald-500 shrink-0" title="Approved" />}
                      {ustaz.semesterStatus === 'ended' && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 shrink-0">
                          {t("Semester Ended")}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {ustazStudents.length} {t("Students Assigned")}
                    </p>
                    {/* Attendance status pills */}
                    {ustazAttendanceStatus[ustaz._id] && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {ustazAttendanceStatus[ustaz._id].map((day, i) => (
                          <span
                            key={i}
                            title={day.date}
                            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold transition-all
                              ${ day.taken
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                              }
                              ${ day.isToday ? 'ring-2 ring-offset-1 ring-current' : '' }
                            `}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${ day.taken ? 'bg-emerald-500' : 'bg-red-400' }`} />
                            {new Date(day.date).toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US', { weekday: 'short' })}
                            {day.isToday ? (language === 'am' ? ' (ዛሬ)' : ' (Today)') : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Show chevron on right side of name on mobile instead of wrapping it all the way below */}
                  <div className="sm:hidden flex items-center text-gray-400 shrink-0 ml-auto">
                     {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 text-gray-400" onClick={(e) => e.stopPropagation()}>
                  {!ustaz.isApproved && (
                    <button
                      onClick={(e) => handleApproveUstaz(ustaz._id, e)}
                      className="text-xs font-bold px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-full transition-colors shadow-sm"
                    >
                      APPROVE
                    </button>
                  )}
                  
                  {/* Archive & Reset Semester Button */}
                  {ustaz.semesterStatus === 'ended' && (
                    <button
                      onClick={(e) => handleResetSemesterClick(ustaz, e)}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors shadow-sm"
                      title="Archive & Reset Semester"
                    >
                      <Archive size={14} /> {t("Archive & Reset")}
                    </button>
                  )}

                  {/* Delete Ustaz Button */}
                  <button
                    onClick={(e) => handleDeleteUstazClick(ustaz, e)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
                    title="Delete Ustaz"
                  >
                    <Trash2 size={18} />
                  </button>

                  <div className="hidden sm:block">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 p-6">
                  {ustazStudents.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                      No students assigned to this Ustaz yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {ustazStudents.map((student) => {
                        const status = getStudentAttendanceStatus(student._id);
                        let statusColor = "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
                        if (status === "present") statusColor = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
                        if (status === "absent") statusColor = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
                        if (status === "excused") statusColor = "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";

                        return (
                          <div key={student._id} className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-shadow group">
                            
                            <div className="flex items-center gap-4 cursor-pointer w-full sm:w-auto" onClick={() => openHistoryModal(student)}>
                              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg text-emerald-600 dark:text-emerald-500 shrink-0">
                                <History size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-800 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors truncate">
                                  {student.fullName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Click to view history</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800">
                              <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${statusColor}`}>
                                {status}
                              </span>
                              
                              <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity pl-2 sm:border-l border-gray-100 dark:border-gray-700">
                                <button
                                  onClick={(e) => openTransferModal(student._id, e)}
                                  className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                  title="Transfer Student"
                                >
                                  <ArrowRightLeft size={16} />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteStudentClick(student, e)}
                                  className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                  title="Delete Student"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Attendance History: {selectedStudentName}</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsResetModalOpen(true)}
                  className="px-4 py-2 bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                >
                  <RotateCcw size={16} /> Reset History
                </button>
                <button onClick={() => setIsHistoryModalOpen(false)} className="text-gray-500 hover:text-gray-800 dark:hover:text-white transition">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {loadingHistory ? (
                <div className="text-center py-10 text-gray-500">Fetching history...</div>
              ) : historyData.length === 0 ? (
                <div className="text-center py-10 text-gray-500">No attendance records found.</div>
              ) : (
                <div className="space-y-3">
                  {historyData.map((record) => {
                    let statusColor = "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
                    if (record.status === "present") statusColor = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
                    if (record.status === "absent") statusColor = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
                    if (record.status === "excused") statusColor = "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";

                    return (
                      <div key={record._id} className="flex justify-between items-center p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50">
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white">
                            {new Date(record.date).toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Recorded by: {record.ustaz?.name || "Unknown"}</p>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${statusColor}`}>
                          {record.status}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-700 p-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Transfer Student</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Select the new Ustaz to assign this student to:</p>
            
            <select
              value={newUstazId}
              onChange={(e) => setNewUstazId(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 mb-8"
            >
              <option value="">Select an Ustaz...</option>
              {approvedUstazs.map(u => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>

            <div className="flex gap-4">
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-xl font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleTransferStudent}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-lg transition"
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-700 overflow-hidden transform transition-all">
            
            {/* Header Icon Area */}
            <div className="bg-red-50 dark:bg-red-900/20 pt-8 pb-6 flex justify-center border-b border-red-100 dark:border-red-900/30">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-800/40 rounded-full flex items-center justify-center shadow-inner">
                <AlertTriangle size={40} className="text-red-500 dark:text-red-400" />
              </div>
            </div>

            {/* Content Area */}
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                Delete Student?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Are you absolutely sure you want to permanently delete{" "}
                <strong className="text-gray-800 dark:text-gray-200">{studentToDelete?.fullName}</strong>?
              </p>
              <p className="text-sm text-red-500 dark:text-red-400 font-medium mb-8">
                This action cannot be undone and will erase all their attendance history.
              </p>
              
              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-2xl font-bold transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteStudent}
                  className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold shadow-lg shadow-red-500/30 transition-all hover:-translate-y-0.5"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Ustaz Confirmation Modal */}
      {isDeleteUstazModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-700 overflow-hidden transform transition-all">
            
            {/* Header Icon Area */}
            <div className="bg-red-50 dark:bg-red-900/20 pt-8 pb-6 flex justify-center border-b border-red-100 dark:border-red-900/30">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-800/40 rounded-full flex items-center justify-center shadow-inner">
                <AlertTriangle size={40} className="text-red-500 dark:text-red-400" />
              </div>
            </div>

            {/* Content Area */}
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                Delete Ustaz?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Are you absolutely sure you want to permanently delete{" "}
                <strong className="text-gray-800 dark:text-gray-200">{ustazToDelete?.name}</strong>?
              </p>
              <p className="text-sm text-red-500 dark:text-red-400 font-medium mb-8">
                This action cannot be undone. Assigned students will become unassigned.
              </p>
              
              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setIsDeleteUstazModalOpen(false)}
                  className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-2xl font-bold transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteUstaz}
                  className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold shadow-lg shadow-red-500/30 transition-all hover:-translate-y-0.5"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Attendance Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-700 overflow-hidden transform transition-all">
            
            {/* Header Icon Area */}
            <div className="bg-amber-50 dark:bg-amber-900/20 pt-8 pb-6 flex justify-center border-b border-amber-100 dark:border-amber-900/30">
              <div className="w-20 h-20 bg-amber-100 dark:bg-amber-800/40 rounded-full flex items-center justify-center shadow-inner">
                <RotateCcw size={40} className="text-amber-500 dark:text-amber-400" />
              </div>
            </div>

            {/* Content Area */}
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                Reset Attendance?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Are you sure you want to reset all attendance records for{" "}
                <strong className="text-gray-800 dark:text-gray-200">{selectedStudentName}</strong>?
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-500 font-medium mb-8">
                This action cannot be undone and is usually done at the start of a new semester.
              </p>
              
              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setIsResetModalOpen(false)}
                  className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-2xl font-bold transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmResetAttendance}
                  className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold shadow-lg shadow-amber-500/30 transition-all hover:-translate-y-0.5"
                >
                  Yes, Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Ustaz Modal */}
      {isCreateUstazModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg border border-gray-100 dark:border-gray-700 overflow-hidden my-8">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Add New Ustaz</h2>
              <button
                onClick={() => setIsCreateUstazModalOpen(false)}
                className="text-gray-500 hover:text-gray-800 dark:hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateUstaz} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newUstazData.name}
                  onChange={(e) => setNewUstazData({ ...newUstazData, name: e.target.value })}
                  placeholder="e.g. Ustaz Ahmed"
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newUstazData.email}
                  onChange={(e) => setNewUstazData({ ...newUstazData, email: e.target.value })}
                  placeholder="e.g. ahmed@medresa.com"
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={newUstazData.phone}
                  onChange={(e) => setNewUstazData({ ...newUstazData, phone: e.target.value })}
                  placeholder="e.g. +251..."
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Teaching Stream
                </label>
                <select
                  value={newUstazData.stream}
                  onChange={(e) => setNewUstazData({ ...newUstazData, stream: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="quran">Quran Teacher</option>
                  <option value="kitab">Kitab Teacher</option>
                </select>
              </div>

              {newUstazData.stream === "kitab" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Kitab Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newUstazData.kitabName}
                    onChange={(e) => setNewUstazData({ ...newUstazData, kitabName: e.target.value })}
                    placeholder="e.g. Ajrumiyyah"
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Teaching Days
                </label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {[
                    { id: 1, label: "Mon" },
                    { id: 2, label: "Tue" },
                    { id: 3, label: "Wed" },
                    { id: 4, label: "Thu" },
                    { id: 5, label: "Fri" },
                    { id: 6, label: "Sat" },
                    { id: 0, label: "Sun" },
                  ].map((day) => (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => handleDayToggleInModal(day.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        newUstazData.teachingDays.includes(day.id)
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Student Phone Option
                </label>
                <select
                  value={newUstazData.studentPhoneOption}
                  onChange={(e) => setNewUstazData({ ...newUstazData, studentPhoneOption: Number(e.target.value) })}
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="1">1 Phone Number (Phone Number)</option>
                  <option value="2">2 Phone Numbers (Father & Mother Phone)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Password (Min 6 chars)
                </label>
                <input
                  type="password"
                  required
                  value={newUstazData.password}
                  onChange={(e) => setNewUstazData({ ...newUstazData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsCreateUstazModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUstazLoading}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-75 text-white rounded-xl font-semibold transition shadow-md"
                >
                  {createUstazLoading ? "Creating..." : "Save Ustaz"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Semester Reset Confirmation Modal */}
      {isSemesterResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-700 overflow-hidden">
            
            <div className="bg-blue-50 dark:bg-blue-900/20 pt-8 pb-6 flex justify-center border-b border-blue-100 dark:border-blue-900/30">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-800/40 rounded-full flex items-center justify-center shadow-inner">
                <Archive size={40} className="text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                {t("Archive & Reset Semester?")}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-lg">
                {t("This will archive all attendance and exam data for")} <strong>{ustazToReset?.name}</strong> {t("and then clear it so they can start a new semester.")}
              </p>
              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-400 text-sm mb-6">
                <AlertTriangle size={16} className="inline mr-1" />
                {t("This action cannot be undone. All current attendance records and exam scores will be wiped after archiving.")}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => { setIsSemesterResetModalOpen(false); setUstazToReset(null); }}
                  disabled={resettingSemester}
                  className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-2xl font-bold transition-all shadow-sm"
                >
                  {t("Cancel")}
                </button>
                <button
                  onClick={confirmResetSemester}
                  disabled={resettingSemester}
                  className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-75 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5"
                >
                  {resettingSemester ? t("Archiving...") : t("Yes, Archive & Reset")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Semester Archives Modal */}
      {isArchivesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col border border-gray-100 dark:border-gray-700 overflow-hidden">
            
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Archive className="text-blue-600 dark:text-blue-400" />
                  {t("Archived Semester Records")}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  View and export historical class data from ended semesters
                </p>
              </div>
              <button 
                onClick={() => { setIsArchivesModalOpen(false); setSelectedArchive(null); }} 
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content body */}
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30 dark:bg-gray-955/20">
              {selectedArchive ? (
                // Archive Detail View
                <div>
                  <button
                    onClick={() => setSelectedArchive(null)}
                    className="mb-6 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    ← Back to Archives List
                  </button>

                  <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-lg font-black text-gray-800 dark:text-white">{selectedArchive.ustazName}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Ended on: {new Date(selectedArchive.endedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <button
                      onClick={() => downloadArchiveCSV(selectedArchive)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-500/10 cursor-pointer"
                    >
                      Export to CSV (Excel)
                    </button>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wider">Students Performance Snapshot</h4>
                    {selectedArchive.studentsSnapshot.map((student) => (
                      <div key={student.studentId} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3 mb-3">
                          <div>
                            <span className="font-black text-gray-800 dark:text-white text-md">{student.fullName}</span>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 ml-2">
                              {student.stream}
                            </span>
                          </div>
                          {student.stream === 'quran' && student.surah && (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                              Last Surah: {student.surah}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Attendance summary */}
                          <div>
                            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Attendance Status</span>
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-xl text-center border border-emerald-100/50 dark:border-emerald-900/10">
                                <span className="block text-lg font-black text-emerald-600 dark:text-emerald-400">{student.presentCount || 0}</span>
                                <span className="text-[9px] uppercase font-bold text-emerald-500">Present</span>
                              </div>
                              <div className="bg-red-50/50 dark:bg-red-950/20 p-2.5 rounded-xl text-center border border-red-100/50 dark:border-red-900/10">
                                <span className="block text-lg font-black text-red-600 dark:text-red-400">{student.absentCount || 0}</span>
                                <span className="text-[9px] uppercase font-bold text-red-500">Absent</span>
                              </div>
                              <div className="bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-xl text-center border border-amber-100/50 dark:border-amber-900/10">
                                <span className="block text-lg font-black text-amber-600 dark:text-amber-400">{student.excusedCount || 0}</span>
                                <span className="text-[9px] uppercase font-bold text-amber-500">Excused</span>
                              </div>
                            </div>
                          </div>

                          {/* Exam scores */}
                          <div>
                            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Exam Grades</span>
                            <div className="space-y-2 mt-2">
                              {student.examScores && Object.keys(student.examScores).length > 0 ? (
                                Object.entries(student.examScores).map(([examId, score]) => {
                                  const matchedExam = selectedArchive.examsSnapshot?.find(e => e.examId === examId);
                                  const examName = matchedExam ? matchedExam.name : "Archived Exam";
                                  const maxScore = matchedExam ? matchedExam.maxScore : 100;
                                  
                                  return (
                                    <div key={examId} className="flex justify-between items-center p-2.5 bg-gray-50 dark:bg-gray-805/40 rounded-xl border border-gray-100 dark:border-gray-800 text-xs">
                                      <span className="font-semibold text-gray-600 dark:text-gray-400">{examName}</span>
                                      <span className="font-black text-gray-800 dark:text-white">{score} / {maxScore}</span>
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="text-xs text-gray-400 dark:text-gray-500 italic mt-3">No exam scores recorded.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Archive List View
                <div>
                  {loadingArchives ? (
                    <div className="flex justify-center items-center py-20">
                      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                    </div>
                  ) : archives.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                      <History className="mx-auto text-gray-300 dark:text-gray-700 mb-4" size={48} />
                      <p className="text-gray-500 dark:text-gray-400 italic">No semester archives found.</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Semester archives will appear here once an Admin resets an Ustaz's ended class.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {archives.map((archive) => (
                        <div key={archive._id} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="font-black text-gray-800 dark:text-white text-lg">{archive.ustazName}</h3>
                              <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                {archive.studentsSnapshot?.length || 0} Students
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              Ended on: {new Date(archive.endedAt).toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          </div>
                          
                          <div className="flex gap-2 mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <button
                              onClick={() => setSelectedArchive(archive)}
                              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => downloadArchiveCSV(archive)}
                              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer"
                              title="Export CSV"
                            >
                              CSV
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex justify-end">
              <button
                onClick={() => { setIsArchivesModalOpen(false); setSelectedArchive(null); }}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-xl font-bold transition text-sm cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
