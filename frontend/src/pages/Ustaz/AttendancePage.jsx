import { useState, useEffect } from "react";
import UstazSidebar from "../../components/Ustaz/UstazSidebar";
import axiosInstance from "../../utils/axiosInstance";
import useAuthStore from "../../store/authStore";
import toast from 'react-hot-toast';

export default function AttendancePage() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [validDates, setValidDates] = useState([]);
  const { user } = useAuthStore();

  // Load students once on mount
  useEffect(() => {
    axiosInstance
      .get("/ustaz/students")
      .then((res) => {
        setStudents(res.data);
      })
      .catch((err) => console.error(err));
  }, []);

  // Compute the last 4 valid teaching dates based on ustaz settings
  useEffect(() => {
    const teachingDays = user?.teachingDays || [0, 1, 2, 3, 4, 5, 6];
    const teachingDaysSet = new Set(teachingDays);
    const days = [];
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    while (days.length < 4) {
      if (teachingDaysSet.has(cursor.getDay())) {
        const offsetDate = new Date(cursor.getTime() - (cursor.getTimezoneOffset() * 60000));
        days.push(offsetDate.toISOString().split('T')[0]);
      }
      cursor.setDate(cursor.getDate() - 1);
    }
    
    setValidDates(days);
    if (!days.includes(selectedDate)) {
      setSelectedDate(days[0]);
    }
  }, [user]);

  // Load existing attendance whenever date or student list changes
  useEffect(() => {
    if (students.length === 0) return;

    axiosInstance
      .get(`/ustaz/attendance?date=${selectedDate}`)
      .then((res) => {
        const existingRecords = res.data;
        if (existingRecords && existingRecords.length > 0) {
          const loadedAttendance = {};
          // Set initial fallback for all students
          students.forEach((s) => {
            loadedAttendance[s._id] = "present";
          });
          // Populate with fetched records
          existingRecords.forEach((record) => {
            const studentId = typeof record.student === 'object' ? record.student._id : record.student;
            loadedAttendance[studentId] = record.status;
          });
          setAttendance(loadedAttendance);
          setIsUpdateMode(true);
        } else {
          // Reset to default "present"
          const initial = {};
          students.forEach((s) => (initial[s._id] = "present"));
          setAttendance(initial);
          setIsUpdateMode(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch existing attendance:", err);
        const initial = {};
        students.forEach((s) => (initial[s._id] = "present"));
        setAttendance(initial);
        setIsUpdateMode(false);
      });
  }, [selectedDate, students]);

  const markAttendance = async () => {
    try {
      if (isUpdateMode) {
        await axiosInstance.put("/ustaz/attendance", { attendance, date: selectedDate });
        toast.success("Attendance updated successfully!");
      } else {
        await axiosInstance.post("/ustaz/attendance", { attendance, date: selectedDate });
        toast.success("Attendance marked successfully!");
        setIsUpdateMode(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit attendance");
    }
  };

  const resetAttendance = async () => {
    if (!window.confirm("Are you sure you want to reset attendance for this date? This will delete all records for this day.")) return;
    
    try {
      await axiosInstance.delete(`/ustaz/attendance?date=${selectedDate}`);
      toast.success("Attendance reset successfully!");
      
      const initial = {};
      students.forEach((s) => (initial[s._id] = "present"));
      setAttendance(initial);
      setIsUpdateMode(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset attendance");
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold dark:text-white">Mark Attendance</h1>
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-300 ml-2">Date:</label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm rounded-lg px-3 py-2 outline-none cursor-pointer min-w-[160px]"
          >
            {validDates.map((date) => {
              // Parse date string securely as local time
              const [y, m, d] = date.split('-');
              const dateObj = new Date(y, m - 1, d);
              const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
              const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              return (
                <option key={date} value={date}>
                  {dayName}, {dateStr}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <th className="p-5 font-semibold text-gray-600 dark:text-gray-300 w-16 text-center">No.</th>
                <th className="p-5 font-semibold text-gray-600 dark:text-gray-300">Student Name</th>
                <th className="p-5 font-semibold text-gray-600 dark:text-gray-300">Surah</th>
                <th className="p-5 font-semibold text-gray-600 dark:text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={student._id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-5 font-bold text-gray-500 dark:text-gray-400 text-center">{index + 1}</td>
                  <td className="p-5 font-medium text-gray-800 dark:text-gray-200">{student.fullName}</td>
                  <td className="p-5 text-gray-600 dark:text-gray-400">{student.surah}</td>
                  <td className="p-5">
                    <select
                      value={attendance[student._id] || "present"}
                      onChange={(e) =>
                        setAttendance({
                          ...attendance,
                          [student._id]: e.target.value,
                        })
                      }
                      className="bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm rounded-xl px-4 py-2 outline-none w-full min-w-[120px]"
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="excused">Excused</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 flex flex-col md:flex-row gap-4">
        <button
          onClick={markAttendance}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-colors text-lg"
        >
          {isUpdateMode ? "Update Attendance" : "Submit Attendance"}
        </button>
        {isUpdateMode && (
          <button
            onClick={resetAttendance}
            className="flex-1 md:max-w-xs bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-colors text-lg"
          >
            Reset Attendance
          </button>
        )}
      </div>
    </div>
  );
}
