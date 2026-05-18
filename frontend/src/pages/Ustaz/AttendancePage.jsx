import { useState, useEffect } from "react";
import UstazSidebar from "../../components/Ustaz/UstazSidebar";
import axiosInstance from "../../utils/axiosInstance";

export default function AttendancePage() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isUpdateMode, setIsUpdateMode] = useState(false);

  // Load students once on mount
  useEffect(() => {
    axiosInstance
      .get("/ustaz/students")
      .then((res) => {
        setStudents(res.data);
      })
      .catch((err) => console.error(err));
  }, []);

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
        alert("Attendance updated successfully!");
      } else {
        await axiosInstance.post("/ustaz/attendance", { attendance, date: selectedDate });
        alert("Attendance marked successfully!");
        setIsUpdateMode(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit attendance");
    }
  };

  const minDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const maxDate = new Date().toISOString().split('T')[0];

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold dark:text-white">Mark Attendance</h1>
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-300 ml-2">Date:</label>
          <input
            type="date"
            min={minDate}
            max={maxDate}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm rounded-lg px-3 py-2 outline-none"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <th className="p-5 font-semibold text-gray-600 dark:text-gray-300">Student Name</th>
                <th className="p-5 font-semibold text-gray-600 dark:text-gray-300">Surah</th>
                <th className="p-5 font-semibold text-gray-600 dark:text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student._id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
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

      <button
        onClick={markAttendance}
        className="mt-8 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-colors text-lg"
      >
        {isUpdateMode ? "Update Attendance" : "Submit Attendance"}
      </button>
    </div>
  );
}
