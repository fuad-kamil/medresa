import { useState, useEffect } from "react";
import { CalendarCheck, CalendarX, Clock, CheckCircle2, AlertTriangle, X, Users } from "lucide-react";
import axiosInstance from "../../utils/axiosInstance";
import useAuthStore from "../../store/authStore";

export default function UstazDashboard() {
  const { user } = useAuthStore();
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [takenTodayMap, setTakenTodayMap] = useState({});
  const getInitialDate = () => {
    const u = useAuthStore.getState().user;
    if (u?.stream === 'kitab') {
      let curr = new Date();
      while (true) {
        const day = curr.getDay();
        if (day === 4 || day === 5 || day === 6) return curr.toISOString().split('T')[0];
        curr.setDate(curr.getDate() - 1);
      }
    }
    return new Date().toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getInitialDate());
  const [allRecords, setAllRecords] = useState([]);

  const selectedDayOfWeek = new Date(selectedDate).getDay(); // 0 = Sun, 1 = Mon, ..., 4 = Thu, 5 = Fri, 6 = Sat
  const isKitabDay = selectedDayOfWeek === 4 || selectedDayOfWeek === 5 || selectedDayOfWeek === 6;
  const isBlocked = user?.stream === 'kitab' && !isKitabDay;

  const getKitabAllowedDates = () => {
    const dates = [];
    let curr = new Date();
    while (dates.length < 4) {
      const day = curr.getDay();
      if (day === 4 || day === 5 || day === 6) {
        dates.push(new Date(curr));
      }
      curr.setDate(curr.getDate() - 1);
    }
    return dates;
  };

  const kitabAllowedDates = user?.stream === 'kitab' ? getKitabAllowedDates() : [];

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

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
        setSuccessMessage("✅ Attendance updated successfully!");
      } else {
        await axiosInstance.post("/ustaz/attendance", { attendance, date: selectedDate });
        setSuccessMessage("✅ Attendance marked successfully!");
      }
      setTimeout(() => setSuccessMessage(""), 4000);
      // Refresh weekly stats
      fetchData();
      // Refresh selected date attendance specifically to update state
      fetchAttendanceForDate(selectedDate, students);
    } catch (err) {
      console.error("Attendance submission error:", err);
      alert(err.response?.data?.message || err.message || "Failed to submit attendance");
    }
  };

  const handleResetClick = () => {
    setIsResetModalOpen(true);
  };

  const confirmResetAttendance = async () => {
    setIsResetModalOpen(false);
    try {
      await axiosInstance.delete(`/ustaz/attendance?date=${selectedDate}`);
      setSuccessMessage("✅ Attendance reset successfully!");
      setIsEditMode(false); // Instantly change button back to Submit
      setTimeout(() => setSuccessMessage(""), 4000);
      
      // Refresh weekly stats and current date
      fetchData();
      fetchAttendanceForDate(selectedDate, students);
    } catch (err) {
      console.error("Attendance reset error:", err);
      alert(err.response?.data?.message || "Failed to reset attendance");
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

      {successMessage && (
        <div className="mb-8 p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3 font-semibold text-lg">
            <CheckCircle2 size={24} />
            {successMessage}
          </div>
          <button onClick={() => setSuccessMessage("")} className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300">
            <X size={20} />
          </button>
        </div>
      )}

      {/* Daily Stats */}
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        Attendance Overview for Selected Date
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {/* Total Students Card */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-blue-100 dark:border-gray-700 flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Users size={32} />
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">My Students</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">{students.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-emerald-100 dark:border-gray-700 flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CalendarCheck size={32} />
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Present</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">{Object.values(attendance).filter(v => v === "present").length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-red-100 dark:border-gray-700 flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400">
            <CalendarX size={32} />
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Absent</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">{Object.values(attendance).filter(v => v === "absent").length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-amber-100 dark:border-gray-700 flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock size={32} />
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Excused</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">{Object.values(attendance).filter(v => v === "excused").length}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
          {isEditMode ? "Edit Attendance For" : "Mark Attendance For"}
        </h2>
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 w-max">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-300 ml-2">Date:</label>
          {user?.stream === 'kitab' ? (
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm rounded-lg px-3 py-2 outline-none font-medium cursor-pointer"
            >
              {kitabAllowedDates.map(d => {
                const dateStr = d.toISOString().split('T')[0];
                const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
                return (
                  <option key={dateStr} value={dateStr}>
                    {dayName}, {dateStr}
                  </option>
                );
              })}
            </select>
          ) : (
            <input
              type="date"
              min={new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              max={new Date().toISOString().split('T')[0]}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm rounded-lg px-3 py-2 outline-none"
            />
          )}
        </div>
      </div>

      {isBlocked && (
        <div className="mb-8 p-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-400 rounded-3xl flex flex-col md:flex-row items-center gap-4 shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">Kitab Attendance Restricted</h3>
            <p className="text-gray-600 dark:text-gray-400 text-md">
              Kitab classes are only scheduled on <strong>Thursdays</strong>, <strong>Fridays</strong>, and <strong>Saturdays</strong>. Attendance marking is disabled for this day.
            </p>
          </div>
        </div>
      )}
      
      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <th className="p-5 font-semibold text-gray-600 dark:text-gray-300">Student Name</th>
                <th className="p-5 font-semibold text-gray-600 dark:text-gray-300">
                  {user?.stream === 'kitab' ? "Phone Number" : "Parents' Phones"}
                </th>
                <th className="p-5 font-semibold text-gray-600 dark:text-gray-300">
                  {user?.stream === 'kitab' ? "Kitab Name" : "Surah"}
                </th>
                <th className="p-5 font-semibold text-gray-600 dark:text-gray-300">Attendance Status</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-10 text-center text-gray-500 dark:text-gray-400">
                    No students assigned to you yet.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student._id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
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
          <div className="text-center py-10 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
            No students assigned to you yet.
          </div>
        ) : (
          students.map((student) => (
            <div key={student._id} className="bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white text-lg">{student.fullName}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {student.stream === 'kitab' ? `Kitab: ${student.surah || "N/A"}` : `Surah: ${student.surah || "N/A"}`}
                  </p>
                </div>
                {takenTodayMap[student._id] ? (
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/40 px-2 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Taken
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-bold tracking-wider text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/40 px-2 py-1 rounded-full border border-red-200 dark:border-red-800">
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
