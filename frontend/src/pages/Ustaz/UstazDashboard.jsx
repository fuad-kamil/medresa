import { useState, useEffect } from "react";
import { CalendarCheck, CalendarX, Clock, CheckCircle2, AlertTriangle, X, Users, BookOpen, PlusCircle } from "lucide-react";
import axiosInstance from "../../utils/axiosInstance";
import useAuthStore from "../../store/authStore";
import toast from 'react-hot-toast';
import useTranslation from "../../hooks/useTranslation";
import { SURAHS } from "../../utils/surahs";

export default function UstazDashboard() {
  const { user } = useAuthStore();
  const { t, language } = useTranslation();
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [takenTodayMap, setTakenTodayMap] = useState({});
  const getValidDates = () => {
    const u = useAuthStore.getState().user;
    const teachingDays = u?.teachingDays || [0, 1, 2, 3, 4, 5, 6];
    const teachingDaysSet = new Set(teachingDays);
    const dates = [];
    let curr = new Date();
    curr.setHours(0, 0, 0, 0);

    while (dates.length < 4) {
      if (teachingDaysSet.has(curr.getDay())) {
        const offsetDate = new Date(curr.getTime() - (curr.getTimezoneOffset() * 60000));
        dates.push(offsetDate.toISOString().split('T')[0]);
      }
      curr.setDate(curr.getDate() - 1);
    }
    return dates;
  };

  const validDates = getValidDates();
  const [selectedDate, setSelectedDate] = useState(validDates[0] || new Date().toISOString().split('T')[0]);
  const [allRecords, setAllRecords] = useState([]);

  const isSemesterEnded = user?.semesterStatus === 'ended';
  const isBlocked = isSemesterEnded;

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isEndSemesterModalOpen, setIsEndSemesterModalOpen] = useState(false);

  // Quran Progress modal state
  const [isQuranModalOpen, setIsQuranModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [quranLogs, setQuranLogs] = useState([]);
  const [loggingProgress, setLoggingProgress] = useState(false);
  const [logFormData, setLogFormData] = useState({
    juz: "",
    surah: "",
    verseStart: "",
    verseEnd: "",
    type: "hifz",
    notes: ""
  });

  const fetchQuranLogs = async (studentId) => {
    try {
      const res = await axiosInstance.get(`/ustaz/students/${studentId}/quran-progress`);
      setQuranLogs(res.data);
    } catch (err) {
      console.error("Failed to fetch Quran logs:", err);
    }
  };

  const openQuranProgressModal = (student) => {
    setSelectedStudent(student);
    setQuranLogs([]);
    setLogFormData({
      juz: "",
      surah: "",
      verseStart: "",
      verseEnd: "",
      type: "hifz",
      notes: ""
    });
    fetchQuranLogs(student._id);
    setIsQuranModalOpen(true);
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setLoggingProgress(true);
    try {
      await axiosInstance.post(`/ustaz/students/${selectedStudent._id}/quran-progress`, logFormData);
      toast.success("Quran progress logged successfully!");
      setLogFormData({
        juz: "",
        surah: "",
        verseStart: "",
        verseEnd: "",
        type: "hifz",
        notes: ""
      });
      fetchQuranLogs(selectedStudent._id);
      fetchData();
    } catch (err) {
      console.error("Failed to log progress:", err);
      toast.error(err.response?.data?.message || "Failed to log progress.");
    } finally {
      setLoggingProgress(false);
    }
  };
  const fetchData = async () => {
    try {
      const [studentsRes, weeklyRes] = await Promise.all([
        axiosInstance.get("/ustaz/students"),
        axiosInstance.get("/ustaz/attendance/weekly"),
      ]);

      setStudents(studentsRes.data);
      
      const records = weeklyRes.data;
      setAllRecords(records);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceForDate = async (dateStr, currentStudents) => {
    if (currentStudents.length === 0) return;
    try {
      const res = await axiosInstance.get(`/ustaz/attendance?date=${dateStr}`);
      const records = res.data;
      const hasTakenDate = records.length > 0;
      setIsEditMode(hasTakenDate);

      const takenMap = {};
      records.forEach(r => {
        const studentId = r.student && r.student._id ? r.student._id : r.student;
        takenMap[studentId] = true;
      });
      setTakenTodayMap(takenMap);

      const initial = {};
      if (hasTakenDate) {
        currentStudents.forEach((s) => {
          const record = records.find(r => {
            const studentId = r.student && r.student._id ? r.student._id : r.student;
            return studentId === s._id;
          });
          initial[s._id] = record ? record.status : "present";
        });
      } else {
        currentStudents.forEach((s) => (initial[s._id] = "present"));
      }
      setAttendance(initial);
    } catch (err) {
      console.error("Failed to fetch attendance for date:", err);
      const initial = {};
      currentStudents.forEach((s) => (initial[s._id] = "present"));
      setAttendance(initial);
      setIsEditMode(false);
      setTakenTodayMap({});
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (students.length > 0) {
      fetchAttendanceForDate(selectedDate, students);
    }
  }, [selectedDate, students]);

  const handleSubmitClick = () => {
    setIsConfirmModalOpen(true);
  };

  const confirmSubmitAttendance = async () => {
    setIsConfirmModalOpen(false);
    try {
      if (isEditMode) {
        await axiosInstance.put("/ustaz/attendance", { attendance, date: selectedDate });
        toast.success("Attendance updated successfully!");
      } else {
        await axiosInstance.post("/ustaz/attendance", { attendance, date: selectedDate });
        toast.success("Attendance marked successfully!");
      }
      // Refresh weekly stats
      fetchData();
      // Refresh selected date attendance specifically to update state
      fetchAttendanceForDate(selectedDate, students);
    } catch (err) {
      console.error("Attendance submission error:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to submit attendance");
    }
  };

  const handleResetClick = () => {
    setIsResetModalOpen(true);
  };

  const confirmResetAttendance = async () => {
    setIsResetModalOpen(false);
    try {
      await axiosInstance.delete(`/ustaz/attendance?date=${selectedDate}`);
      toast.success("Attendance reset successfully!");
      setIsEditMode(false); // Instantly change button back to Submit
      
      // Refresh weekly stats and current date
      fetchData();
      fetchAttendanceForDate(selectedDate, students);
    } catch (err) {
      console.error("Attendance reset error:", err);
      toast.error(err.response?.data?.message || "Failed to reset attendance");
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-500">Loading dashboard...</div>;
  }

  return (
    <div>
      {isSemesterEnded && (
        <div className="mb-8 p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-3xl flex items-center gap-4 text-red-800 dark:text-red-400">
          <AlertTriangle size={32} className="shrink-0" />
          <div>
            <h3 className="font-bold text-lg">{t("Semester Ended")}</h3>
            <p className="text-sm mt-1">{t("You have marked this semester as ended. Your class is locked. Please wait for the admin to archive and reset your class.")}</p>
          </div>
        </div>
      )}

      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 dark:text-white">
            {user?.name || "Ustaz"}
            {user?.stream === 'kitab' && user?.kitabName && (
              <span className="ml-3 text-2xl lg:text-3xl font-semibold text-emerald-600 dark:text-emerald-400">
                — {user.kitabName}
              </span>
            )}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-3 text-lg">
            {t("Here is your weekly overview and today's class.")}
          </p>
        </div>
      </div>



      {/* Daily Stats */}
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        {t("Attendance Overview for Selected Date")}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {/* Total Students Card */}
        <div className="bg-white dark:bg-zinc-900/65 backdrop-blur-md p-6 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-premium hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] hover:-translate-y-1 transition duration-300 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 dark:bg-blue-500/5 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Users size={26} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">{t("My Students")}</p>
            <p className="text-3xl font-extrabold mt-1 text-slate-800 dark:text-white">{students.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/65 backdrop-blur-md p-6 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-premium hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] hover:-translate-y-1 transition duration-300 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <CalendarCheck size={26} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">{t("Present")}</p>
            <p className="text-3xl font-extrabold mt-1 text-slate-800 dark:text-white">{Object.values(attendance).filter(v => v === "present").length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/65 backdrop-blur-md p-6 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-premium hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] hover:-translate-y-1 transition duration-300 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 dark:bg-red-500/5 border border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
            <CalendarX size={26} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">{t("Absent")}</p>
            <p className="text-3xl font-extrabold mt-1 text-slate-800 dark:text-white">{Object.values(attendance).filter(v => v === "absent").length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/65 backdrop-blur-md p-6 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-premium hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] hover:-translate-y-1 transition duration-300 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Clock size={26} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">{t("Excused")}</p>
            <p className="text-3xl font-extrabold mt-1 text-slate-800 dark:text-white">{Object.values(attendance).filter(v => v === "excused").length}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-black text-gray-800 dark:text-white flex items-center tracking-tight">
          {isEditMode ? t("Edit Attendance For") : t("Mark Attendance For")}
        </h2>
        
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-xs border border-gray-100 dark:border-gray-700 w-max">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-300 ml-2">{t("Date:")}</label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm rounded-lg px-3 py-2 outline-none font-medium cursor-pointer min-w-[160px]"
            >
              {validDates.map(dateStr => {
                const [y, m, d] = dateStr.split('-');
                const dateObj = new Date(y, m - 1, d);
                const dayName = dateObj.toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US', { weekday: 'long' });
                return (
                  <option key={dateStr} value={dateStr}>
                    {dayName}, {dateStr}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      
      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-premium overflow-hidden mb-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-zinc-800/40 border-b border-slate-200/60 dark:border-zinc-800">
                <th className="p-5 font-black text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400 w-16 text-center">No.</th>
                <th className="p-5 font-black text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400">{t("Student Name")}</th>
                <th className="p-5 font-black text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  {user?.stream === 'kitab' ? t("Phone Number") : t("Parents' Phones")}
                </th>
                <th className="p-5 font-black text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  {user?.stream === 'kitab' ? t("Kitab Name") : t("Surah")}
                </th>
                <th className="p-5 font-black text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400">{t("Attendance Status")}</th>
                {user?.stream === 'quran' && (
                  <th className="p-5 font-black text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400">{t("Quran Progress")}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-400 dark:text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users size={32} className="text-slate-300 dark:text-zinc-600" />
                      <p className="font-bold text-sm">{t("No students assigned to you yet.")}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((student, index) => (
                  <tr key={student._id} className="border-b border-slate-100 dark:border-zinc-800/50 odd:bg-white even:bg-slate-50/50 dark:odd:bg-zinc-900/30 dark:even:bg-zinc-800/20 hover:bg-slate-100/50 dark:hover:bg-zinc-800/40 transition-all duration-200">
                    <td className="p-5 font-extrabold text-slate-400 dark:text-zinc-500 text-center text-base">{index + 1}</td>
                    <td className="p-5 font-medium text-gray-800 dark:text-gray-200">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="font-bold text-slate-900 dark:text-white">{student.fullName}</span>
                        {takenTodayMap[student._id] ? (
                          <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-700 bg-emerald-100/80 dark:text-emerald-300 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
                            {t("Taken")}
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-extrabold tracking-wider text-red-700 bg-red-100/80 dark:text-red-300 dark:bg-red-950/60 px-2 py-0.5 rounded-full border border-red-200/80 dark:border-red-800/60 shadow-2xs">
                            {t("Not Taken")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-5 text-gray-600 dark:text-gray-400">
                      {(() => {
                        const isSinglePhone = (user?.studentPhoneOption || 1) === 1;
                        return isSinglePhone ? (
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{student.fatherPhone || "N/A"}</span>
                        ) : (
                          <div className="flex flex-col text-xs space-y-0.5">
                            <span><strong className="text-gray-800 dark:text-gray-300">F:</strong> {student.fatherPhone || "N/A"}</span>
                            <span><strong className="text-gray-800 dark:text-gray-300">M:</strong> {student.motherPhone || "N/A"}</span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="p-5 text-gray-600 dark:text-gray-400 font-medium text-sm">
                      {student.stream === 'kitab' ? `Kitab: ${student.surah || "N/A"}` : `Surah: ${student.surah || "N/A"}`}
                    </td>
                    <td className="p-5">
                      {/* Equal Width Button Group */}
                      <div className="flex gap-1.5 w-max bg-slate-100/80 dark:bg-zinc-800/80 p-1 rounded-2xl border border-slate-200/50 dark:border-zinc-700/60">
                        <button
                          type="button"
                          onClick={() => !isBlocked && setAttendance({ ...attendance, [student._id]: "present" })}
                          disabled={isBlocked}
                          className={`w-24 py-2 px-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            attendance[student._id] === "present"
                              ? "bg-emerald-600 text-white shadow-md border border-emerald-500 scale-[1.02]"
                              : "bg-transparent text-gray-600 dark:text-zinc-400 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/40 font-semibold"
                          } ${isBlocked ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          P <span className="font-normal opacity-90">{t("Present")}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => !isBlocked && setAttendance({ ...attendance, [student._id]: "absent" })}
                          disabled={isBlocked}
                          className={`w-24 py-2 px-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            attendance[student._id] === "absent"
                              ? "bg-red-600 text-white shadow-md border border-red-500 scale-[1.02]"
                              : "bg-transparent text-gray-600 dark:text-zinc-400 hover:bg-red-100/60 dark:hover:bg-red-950/40 font-semibold"
                          } ${isBlocked ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          A <span className="font-normal opacity-90">{t("Absent")}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => !isBlocked && setAttendance({ ...attendance, [student._id]: "excused" })}
                          disabled={isBlocked}
                          className={`w-24 py-2 px-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            attendance[student._id] === "excused"
                              ? "bg-amber-500 text-white shadow-md border border-amber-400 scale-[1.02]"
                              : "bg-transparent text-gray-600 dark:text-zinc-400 hover:bg-amber-100/60 dark:hover:bg-amber-950/40 font-semibold"
                          } ${isBlocked ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          E <span className="font-normal opacity-90">{t("Excused")}</span>
                        </button>
                      </div>
                    </td>
                    {user?.stream === 'quran' && (
                      <td className="p-5">
                        <button
                          type="button"
                          onClick={() => openQuranProgressModal(student)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-xl transition-all text-xs font-bold border border-emerald-200/60 dark:border-emerald-800/60 cursor-pointer shadow-2xs hover:scale-[1.02]"
                        >
                          <BookOpen size={14} />
                          {t("Log Progress")}
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden grid grid-cols-1 gap-4 mb-10">
        {students.length === 0 ? (
          <div className="text-center py-10 text-slate-400 dark:text-zinc-500 bg-white/70 dark:bg-zinc-900/40 backdrop-blur-sm rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-premium">
            {t("No students assigned to you yet.")}
          </div>
        ) : (
          students.map((student, index) => (
            <div key={student._id} className="bg-white/70 dark:bg-zinc-900/40 backdrop-blur-sm p-5 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-premium flex flex-col gap-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold shrink-0 mt-0.5 shadow-md shadow-emerald-500/10 border border-emerald-400/20">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">{student.fullName}</h3>
                    <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1 font-semibold uppercase tracking-wider">
                      {student.stream === 'kitab' ? `Kitab: ${student.surah || "N/A"}` : `Surah: ${student.surah || "N/A"}`}
                    </p>
                  </div>
                </div>
                {takenTodayMap[student._id] ? (
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    {t("Taken")}
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-bold tracking-wider text-red-600 bg-red-500/10 dark:text-red-400 dark:bg-red-950/40 px-2.5 py-1 rounded-full border border-red-500/20">
                    {t("Not Taken")}
                  </span>
                )}
              </div>
              
              {/* Parent Phones */}
              <div className="bg-gray-50 dark:bg-gray-950/50 rounded-2xl p-3 flex flex-col gap-1.5 border border-gray-100 dark:border-gray-800 text-sm">
                {(() => {
                  const isSinglePhone = (user?.studentPhoneOption || 1) === 1;
                  return isSinglePhone ? (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400">Phone Number</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{student.fatherPhone || "N/A"}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 dark:text-gray-400">Father</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{student.fatherPhone || "N/A"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 dark:text-gray-400">Mother</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{student.motherPhone || "N/A"}</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              {user?.stream === 'quran' && (
                <button
                  onClick={() => openQuranProgressModal(student)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl transition text-sm font-bold border border-emerald-100/40 dark:border-emerald-900/20 cursor-pointer animate-pulse"
                >
                  <BookOpen size={16} />
                  {t("Log Quran Progress")}
                </button>
              )}

              {/* Attendance Toggle Buttons */}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => !isBlocked && setAttendance({ ...attendance, [student._id]: "present" })}
                  disabled={isBlocked}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-1 ${
                    attendance[student._id] === "present"
                      ? "bg-emerald-500 text-white shadow-md ring-2 ring-emerald-300 dark:ring-emerald-700"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                  } ${isBlocked ? "opacity-50 cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800" : ""}`}
                >
                  <span className="text-lg">P</span>
                </button>
                <button
                  onClick={() => !isBlocked && setAttendance({ ...attendance, [student._id]: "absent" })}
                  disabled={isBlocked}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-1 ${
                    attendance[student._id] === "absent"
                      ? "bg-red-500 text-white shadow-md ring-2 ring-red-300 dark:ring-red-700"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/50"
                  } ${isBlocked ? "opacity-50 cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800" : ""}`}
                >
                  <span className="text-lg">A</span>
                </button>
                <button
                  onClick={() => !isBlocked && setAttendance({ ...attendance, [student._id]: "excused" })}
                  disabled={isBlocked}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-1 ${
                    attendance[student._id] === "excused"
                      ? "bg-amber-500 text-white shadow-md ring-2 ring-amber-300 dark:ring-amber-700"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                  } ${isBlocked ? "opacity-50 cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800" : ""}`}
                >
                  <span className="text-lg">E</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {students.length > 0 && (
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <button
            onClick={handleSubmitClick}
            disabled={isBlocked}
            className={`flex-1 font-bold py-5 rounded-2xl shadow-lg transition-all text-xl ${
              isBlocked
                ? "bg-gray-300 dark:bg-gray-800 text-gray-500 dark:text-gray-600 cursor-not-allowed shadow-none"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
            }`}
          >
            {isBlocked ? t("Attendance Locked") : isEditMode ? t("Update Attendance") : t("Submit Attendance")}
          </button>
          {isEditMode && (
            <button
              onClick={handleResetClick}
              disabled={isBlocked}
              className={`flex-1 md:max-w-xs font-bold py-5 bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-lg shadow-red-600/20 transition-all text-xl ${
                isBlocked ? "opacity-50 cursor-not-allowed bg-red-800" : ""
              }`}
            >
              {t("Reset Attendance")}
            </button>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-700 overflow-hidden">
            
            <div className="bg-emerald-50 dark:bg-emerald-900/20 pt-8 pb-6 flex justify-center border-b border-emerald-100 dark:border-emerald-900/30">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-800/40 rounded-full flex items-center justify-center shadow-inner">
                <AlertTriangle size={40} className="text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>

            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                {isEditMode ? "Confirm Update?" : "Confirm Submission?"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
                Are you sure you want to {isEditMode ? "update" : "submit"} attendance for your class?
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-2xl font-bold transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSubmitAttendance}
                  className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-0.5"
                >
                  Yes, {isEditMode ? "Update" : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-700 overflow-hidden">
            
            <div className="bg-red-50 dark:bg-red-900/20 pt-8 pb-6 flex justify-center border-b border-red-100 dark:border-red-900/30">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-800/40 rounded-full flex items-center justify-center shadow-inner">
                <AlertTriangle size={40} className="text-red-600 dark:text-red-400" />
              </div>
            </div>

            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                Confirm Reset?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
                Are you sure you want to reset attendance for this date? This will delete all records for this day and cannot be undone.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setIsResetModalOpen(false)}
                  className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-2xl font-bold transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmResetAttendance}
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold shadow-lg shadow-red-500/30 transition-all hover:-translate-y-0.5"
                >
                  Yes, Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* End Semester Confirmation Modal */}
      {isEndSemesterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-700 overflow-hidden">
            
            <div className="bg-red-50 dark:bg-red-900/20 pt-8 pb-6 flex justify-center border-b border-red-100 dark:border-red-900/30">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-800/40 rounded-full flex items-center justify-center shadow-inner">
                <AlertTriangle size={40} className="text-red-600 dark:text-red-400" />
              </div>
            </div>

            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                {t("Confirm End Semester?")}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
                {t("Are you sure you want to end this semester? Your class attendance and exam scores will be locked. You won't be able to change them until the admin resets the semester.")}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setIsEndSemesterModalOpen(false)}
                  className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-2xl font-bold transition-all shadow-sm"
                >
                  {t("Cancel")}
                </button>
                <button
                  onClick={confirmEndSemester}
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold shadow-lg shadow-red-500/30 transition-all hover:-translate-y-0.5"
                >
                  {t("Yes, End Semester")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quran Progress Log Modal */}
      {isQuranModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-4xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-950/50">
              <div className="flex items-center gap-3">
                <BookOpen className="text-emerald-600 dark:text-emerald-400" size={28} />
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                    {t("Quran Progress")}: <span className="text-emerald-600 dark:text-emerald-400">{selectedStudent.fullName}</span>
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("Log daily recitation progress & view history")}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setIsQuranModalOpen(false); setSelectedStudent(null); }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition text-gray-500 dark:text-gray-400 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Form Col */}
              <div className="lg:col-span-2 space-y-6">
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800 pb-2">
                  {t("Log Daily Recitation")}
                </h3>
                {isBlocked && (
                  <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl text-red-800 dark:text-red-400 text-xs font-semibold">
                    {t("Semester has ended. Progress logging is locked.")}
                  </div>
                )}
                <form onSubmit={handleLogSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
                      {t("Juz (1 - 30)")}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      required
                      disabled={isBlocked}
                      value={logFormData.juz}
                      onChange={(e) => setLogFormData({ ...logFormData, juz: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition disabled:opacity-50"
                      placeholder="e.g. 1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
                      {t("Surah")}
                    </label>
                    <select
                      required
                      disabled={isBlocked}
                      value={logFormData.surah}
                      onChange={(e) => setLogFormData({ ...logFormData, surah: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition cursor-pointer disabled:opacity-50"
                    >
                      <option value="">Select a Surah</option>
                      {SURAHS.map((surah) => (
                        <option key={surah} value={surah}>{surah}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
                        {t("Verse Start")}
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        disabled={isBlocked}
                        value={logFormData.verseStart}
                        onChange={(e) => setLogFormData({ ...logFormData, verseStart: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition disabled:opacity-50"
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
                        {t("Verse End")}
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        disabled={isBlocked}
                        value={logFormData.verseEnd}
                        onChange={(e) => setLogFormData({ ...logFormData, verseEnd: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition disabled:opacity-50"
                        placeholder="10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
                      {t("Type")}
                    </label>
                    <select
                      required
                      disabled={isBlocked}
                      value={logFormData.type}
                      onChange={(e) => setLogFormData({ ...logFormData, type: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition cursor-pointer disabled:opacity-50 font-bold"
                    >
                      <option value="hifz">Memorization (Hifz)</option>
                      <option value="murajaah">Revision (Muraja'ah)</option>
                      <option value="nezer">Nezer (Nazar)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
                      {t("Notes (Optional)")}
                    </label>
                    <textarea
                      rows="2"
                      disabled={isBlocked}
                      value={logFormData.notes}
                      onChange={(e) => setLogFormData({ ...logFormData, notes: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition resize-none disabled:opacity-50 text-sm"
                      placeholder="e.g. Excellent recitation..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loggingProgress || isBlocked}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white rounded-xl font-bold transition shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PlusCircle size={18} />
                    {loggingProgress ? t("Logging...") : t("Log Progress")}
                  </button>
                </form>
              </div>

              {/* History Col */}
              <div className="lg:col-span-3 space-y-6 lg:border-l lg:border-gray-100 lg:dark:border-gray-800 lg:pl-8">
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800 pb-2">
                  {t("Recitation History")}
                </h3>
                <div className="max-h-[380px] overflow-y-auto pr-2 space-y-4">
                  {quranLogs.length === 0 ? (
                    <p className="text-gray-400 dark:text-gray-500 text-center py-20 text-sm italic">
                      {t("No history recorded yet.")}
                    </p>
                  ) : (
                    <div className="relative border-l border-gray-100 dark:border-gray-800 ml-3 pl-6 space-y-6">
                      {quranLogs.map((log) => (
                        <div key={log._id} className="relative">
                          <span className="absolute -left-10 top-1 bg-emerald-500 w-8 h-8 rounded-full border-4 border-white dark:border-gray-900 flex items-center justify-center text-white shadow-sm">
                            <BookOpen size={12} />
                          </span>
                          <div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-md">
                                {log.surah} (Juz {log.juz})
                              </span>
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-bold">
                                {log.type === 'hifz' ? 'Memorization' : log.type === 'murajaah' ? 'Revision' : log.type === 'nezer' ? 'Nezer' : log.type === 'tilawah' ? 'Tilawah' : log.type}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {t("Verses")}: {log.verseStart} - {log.verseEnd}
                            </p>
                            {log.notes && (
                              <p className="text-xs italic bg-gray-50 dark:bg-gray-900/60 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 mt-2 text-gray-600 dark:text-gray-400">
                                {log.notes}
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-400 font-medium">
                              <Clock size={10} />
                              <span>{new Date(log.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex justify-end bg-gray-50 dark:bg-gray-950/30">
              <button
                onClick={() => { setIsQuranModalOpen(false); setSelectedStudent(null); }}
                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-xl font-semibold transition text-sm cursor-pointer"
              >
                {t("Close")}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
