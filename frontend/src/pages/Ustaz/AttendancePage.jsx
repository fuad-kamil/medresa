import { useState, useEffect } from "react";
import UstazSidebar from "../../components/Ustaz/UstazSidebar";
import axiosInstance from "../../utils/axiosInstance";

export default function AttendancePage() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    axiosInstance
      .get("/ustaz/students")
      .then((res) => {
        setStudents(res.data);
        const initial = {};
        res.data.forEach((s) => (initial[s._id] = "present"));
        setAttendance(initial);
      })
      .catch((err) => console.error(err));
  }, []);

  const markAttendance = async () => {
    try {
      await axiosInstance.post("/ustaz/attendance", { attendance, date: selectedDate });
      alert("Attendance marked successfully!");
    } catch (err) {
      if (err.response?.data?.message?.includes("already taken")) {
        if (window.confirm("Attendance already taken for this date. Do you want to update it?")) {
          try {
            await axiosInstance.put("/ustaz/attendance", { attendance, date: selectedDate });
            alert("Attendance updated successfully!");
          } catch (updateErr) {
            alert(updateErr.response?.data?.message || "Failed to update attendance");
          }
        }
      } else {
        alert(err.response?.data?.message || "Failed to mark attendance");
      }
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
                      value={attendance[student._id]}
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
        Submit Attendance
      </button>
    </div>
  );
}
