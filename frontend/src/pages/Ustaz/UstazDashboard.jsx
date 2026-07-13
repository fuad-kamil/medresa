import { useState, useEffect } from "react";
import { CalendarCheck, CalendarX, Clock, CheckCircle2, AlertTriangle, X, Users } from "lucide-react";
import axiosInstance from "../../utils/axiosInstance";
import useAuthStore from "../../store/authStore";
import toast from 'react-hot-toast';

export default function UstazDashboard() {
  const { user, language } = useAuthStore();
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

  // The user can only select valid dates, so it's never blocked.
  const isBlocked = false;

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
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
      <div className="mb-8">
        <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 dark:text-white">
          {user?.name || "Ustaz"}
          {user?.stream === 'kitab' && user?.kitabName && (
            <span className="ml-3 text-2xl lg:text-3xl font-semibold text-emerald-600 dark:text-emerald-400">
              — {user.kitabName}
            </span>
          )}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-3 text-lg">
          Here is your weekly overview and today's class.
        </p>
      </div>



      {/* Daily Stats */}
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        Attendance Overview for Selected Date
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {/* Total Students Card */}
        <div className="bg-white dark:bg-zinc-900/65 backdrop-blur-md p-6 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-premium hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] hover:-translate-y-1 transition duration-300 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 dark:bg-blue-500/5 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Users size={26} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">My Students</p>
            <p className="text-3xl font-extrabold mt-1 text-slate-800 dark:text-white">{students.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/65 backdrop-blur-md p-6 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-premium hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] hover:-translate-y-1 transition duration-300 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <CalendarCheck size={26} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Present</p>
            <p className="text-3xl font-extrabold mt-1 text-slate-800 dark:text-white">{Object.values(attendance).filter(v => v === "present").length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/65 backdrop-blur-md p-6 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-premium hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] hover:-translate-y-1 transition duration-300 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 dark:bg-red-500/5 border border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
            <CalendarX size={26} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Absent</p>
            <p className="text-3xl font-extrabold mt-1 text-slate-800 dark:text-white">{Object.values(attendance).filter(v => v === "absent").length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/65 backdrop-blur-md p-6 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-premium hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] hover:-translate-y-1 transition duration-300 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Clock size={26} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Excused</p>
            <p className="text-3xl font-extrabold mt-1 text-slate-800 dark:text-white">{Object.values(attendance).filter(v => v === "excused").length}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
          {isEditMode ? "Edit Attendance For" : "Mark Attendance For"}
        </h2>
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 w-max">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-300 ml-2">Date:</label>
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


      
      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white/70 dark:bg-zinc-900/40 backdrop-blur-md rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-premium overflow-hidden mb-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-zinc-800/20 border-b border-slate-100 dark:border-zinc-900">
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-zinc-500 w-16 text-center">No.</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-zinc-500">Student Name</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  {user?.stream === 'kitab' ? "Phone Number" : "Parents' Phones"}
                </th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  {user?.stream === 'kitab' ? "Kitab Name" : "Surah"}
                </th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-zinc-500">Attendance Status</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-slate-400 dark:text-zinc-500">
                    No students assigned to you yet.
                  </td>
                </tr>
              ) : (
                students.map((student, index) => (
                  <tr key={student._id} className="border-b border-slate-50 dark:border-zinc-900 hover:bg-slate-50/30 dark:hover:bg-zinc-800/20 transition-all duration-200">
                    <td className="p-5 font-bold text-slate-400 dark:text-zinc-600 text-center text-lg">{index + 1}</td>
                    <td className="p-5 font-medium text-gray-800 dark:text-gray-200">
                      <div className="flex flex-col gap-1">
                        <span>{student.fullName}</span>
                        {takenTodayMap[student._id] ? (
                          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full w-max border border-emerald-200 dark:border-emerald-800">
                            Taken
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold tracking-wider text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/40 px-2 py-0.5 rounded-full w-max border border-red-200 dark:border-red-800">
                            Not Taken
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-5 text-gray-600 dark:text-gray-400">
                      {user?.stream === 'kitab' ? (
                        <span>{student.fatherPhone || "N/A"}</span>
                      ) : (
                        <div className="flex flex-col text-sm">
                          <span><strong className="text-gray-800 dark:text-gray-300">F:</strong> {student.fatherPhone || "N/A"}</span>
                          <span><strong className="text-gray-800 dark:text-gray-300">M:</strong> {student.motherPhone || "N/A"}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-5 text-gray-600 dark:text-gray-400">
                      {student.stream === 'kitab' ? `Kitab: ${student.surah || "N/A"}` : `Surah: ${student.surah || "N/A"}`}
                    </td>
                    <td className="p-5">
                      <div className="flex gap-2 w-max">
                        <button
                          onClick={() => !isBlocked && setAttendance({ ...attendance, [student._id]: "present" })}
                          disabled={isBlocked}
                          className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                            attendance[student._id] === "present"
                              ? "bg-emerald-500 text-white shadow-md ring-2 ring-emerald-300 dark:ring-emerald-700"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                          } ${isBlocked ? "opacity-50 cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800" : ""}`}
                        >
                          P <span className="font-normal opacity-80 ml-1">Present</span>
                        </button>
                        <button
                          onClick={() => !isBlocked && setAttendance({ ...attendance, [student._id]: "absent" })}
                          disabled={isBlocked}
                          className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                            attendance[student._id] === "absent"
                              ? "bg-red-500 text-white shadow-md ring-2 ring-red-300 dark:ring-red-700"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/50"
                          } ${isBlocked ? "opacity-50 cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800" : ""}`}
                        >
                          A <span className="font-normal opacity-80 ml-1">Absent</span>
                        </button>
                        <button
                          onClick={() => !isBlocked && setAttendance({ ...attendance, [student._id]: "excused" })}
                          disabled={isBlocked}
                          className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                            attendance[student._id] === "excused"
                              ? "bg-amber-500 text-white shadow-md ring-2 ring-amber-300 dark:ring-amber-700"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                          } ${isBlocked ? "opacity-50 cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800" : ""}`}
                        >
                          E <span className="font-normal opacity-80 ml-1">Excused</span>
                        </button>
                      </div>
                    </td>
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
            No students assigned to you yet.
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
                    Taken
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-bold tracking-wider text-red-600 bg-red-500/10 dark:text-red-400 dark:bg-red-950/40 px-2.5 py-1 rounded-full border border-red-500/20">
                    Not Taken
                  </span>
                )}
              </div>
              
              {/* Parent Phones */}
              <div className="bg-gray-50 dark:bg-gray-950/50 rounded-2xl p-3 flex flex-col gap-1.5 border border-gray-100 dark:border-gray-800 text-sm">
                {user?.stream === 'kitab' ? (
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
                )}
              </div>

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
            {isBlocked ? "Attendance Locked" : isEditMode ? "Update Attendance" : "Submit Attendance"}
          </button>
          {isEditMode && (
            <button
              onClick={handleResetClick}
              className="flex-1 md:max-w-xs font-bold py-5 bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-lg shadow-red-600/20 transition-all text-xl"
            >
              Reset Attendance
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
    </div>
  );
}
