import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { Search, UserCheck, Calendar, Download, AlertCircle, RefreshCw } from "lucide-react";
import * as XLSX from "xlsx";
import useAuthStore from "../../store/authStore";

export default function AllStudents() {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCriteria, setSearchCriteria] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchStudents();
  }, [token]);

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get("/admin/students");
      const assignedStudents = res.data.filter(s => s.assignedUstaz);
      setStudents(assignedStudents);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Failed to load student list.");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;

    if (searchCriteria === "all") {
      return (
        student.fullName?.toLowerCase().includes(term) ||
        student.surah?.toLowerCase().includes(term) ||
        student.assignedUstaz?.name?.toLowerCase().includes(term)
      );
    } else if (searchCriteria === "name") {
      return student.fullName?.toLowerCase().includes(term);
    } else if (searchCriteria === "surah") {
      return student.surah?.toLowerCase().includes(term);
    } else if (searchCriteria === "ustaz") {
      return student.assignedUstaz?.name?.toLowerCase().includes(term);
    }
    return true;
  });

  const downloadExcel = () => {
    const data = filteredStudents.map(student => ({
      "Student Name": student.fullName || "N/A",
      "Surah/Kitab": student.stream === 'kitab' ? `Kitab: ${student.surah || "N/A"}` : `Surah: ${student.surah || "N/A"}`,
      "Father Phone": student.fatherPhone || "N/A",
      "Mother Phone": student.motherPhone || "N/A",
      "Address": student.address || "N/A",
      "Assigned Ustaz": student.assignedUstaz?.name || "Not Assigned",
      "Status": student.status || "active",
      "Total Present": student.presentCount || 0,
      "Total Absent": student.absentCount || 0,
      "Total Excused": student.excusedCount || 0
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

    const max_width = data.reduce((w, r) => Math.max(w, r["Student Name"].length), 15);
    worksheet["!cols"] = [
      { wch: max_width },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 }
    ];

    XLSX.writeFile(workbook, "Students_Export.xlsx");
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
            All Students
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Total Students:{" "}
            <span className="font-semibold text-emerald-600">
              {students.length}
            </span>
          </p>
        </div>

        {/* Search & Actions */}
        <div className="mt-6 md:mt-0 flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <select
              value={searchCriteria}
              onChange={(e) => setSearchCriteria(e.target.value)}
              className="w-full sm:w-auto px-4 py-4 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-lg cursor-pointer"
            >
              <option value="all">All Fields</option>
              <option value="name">Student Name</option>
              <option value="surah">Surah</option>
              <option value="ustaz">Ustaz</option>
            </select>
            
            <div className="relative flex-1 w-full sm:w-auto">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-5 py-4 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-lg min-w-[200px]"
              />
            </div>
          </div>
          
          <button
            onClick={downloadExcel}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition font-medium text-lg whitespace-nowrap shadow-md"
          >
            <Download size={20} />
            Export to Excel
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-8 p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-pulse">
          <div className="flex items-center gap-4 text-red-700 dark:text-red-400">
            <AlertCircle size={24} className="flex-shrink-0" />
            <div>
              <p className="font-bold text-lg">Error Fetching Student Records</p>
              <p className="text-md mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchStudents}
            className="flex items-center gap-2 px-5 py-3 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-400 rounded-xl transition font-semibold w-full sm:w-auto justify-center"
          >
            <RefreshCw size={18} />
            Retry Fetching
          </button>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                <th className="text-left p-6 font-semibold text-gray-600 dark:text-gray-300">
                  Student Name
                </th>
                <th className="text-left p-6 font-semibold text-gray-600 dark:text-gray-300">
                  Surah / Kitab
                </th>

                <th className="text-left p-6 font-semibold text-gray-600 dark:text-gray-300">
                  Parents' Phones
                </th>
                <th className="text-left p-6 font-semibold text-gray-600 dark:text-gray-300">
                  Address
                </th>
                <th className="text-left p-6 font-semibold text-gray-600 dark:text-gray-300">
                  Assigned Ustaz
                </th>
                <th className="text-center p-6 font-semibold text-gray-600 dark:text-gray-300">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-20">
                    <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto"></div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center py-20 text-gray-500 dark:text-gray-400"
                  >
                    No students found
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr
                    key={student._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                  >
                    <td className="p-6 font-medium text-gray-800 dark:text-white">
                      {student.fullName}
                    </td>
                    <td className="p-6 text-gray-700 dark:text-gray-300">
                      {student.stream === 'kitab' ? `Kitab: ${student.surah || "N/A"}` : `Surah: ${student.surah || "N/A"}`}
                    </td>

                    <td className="p-6 text-gray-700 dark:text-gray-300 font-medium">
                      <div className="flex flex-col text-sm font-normal">
                        <span><strong className="text-gray-800 dark:text-gray-300 font-medium">F:</strong> {student.fatherPhone || "N/A"}</span>
                        <span><strong className="text-gray-800 dark:text-gray-300 font-medium">M:</strong> {student.motherPhone || "N/A"}</span>
                      </div>
                    </td>
                    <td className="p-6 text-gray-700 dark:text-gray-300">
                      {student.address || "N/A"}
                    </td>
                    <td className="p-6 text-gray-700 dark:text-gray-300">
                      {student.assignedUstaz?.name || "Not Assigned"}
                    </td>
                    <td className="p-6 text-center">
                      <span className="inline-flex items-center px-4 py-1.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-400 text-sm font-medium rounded-full">
                        <UserCheck size={16} className="mr-1" />
                        Active
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full"></div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 rounded-3xl shadow-sm">
            No students found
          </div>
        ) : (
          filteredStudents.map((student) => (
            <div key={student._id} className="bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-3 relative">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white text-lg">{student.fullName}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {student.stream === 'kitab' ? `Kitab: ${student.surah || "N/A"}` : `Surah: ${student.surah || "N/A"}`}
                  </p>
                </div>
                <span className="inline-flex items-center px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full uppercase tracking-wider">
                  <UserCheck size={12} className="mr-1" /> Active
                </span>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-950/50 rounded-2xl p-4 flex flex-col gap-2 border border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Assigned Ustaz</span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{student.assignedUstaz?.name || "Not Assigned"}</span>
                </div>
                <div className="h-px bg-gray-200 dark:bg-gray-800 w-full my-1"></div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Father's Phone</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{student.fatherPhone || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Mother's Phone</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{student.motherPhone || "N/A"}</span>
                </div>
                <div className="h-px bg-gray-200 dark:bg-gray-800 w-full my-1"></div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Address</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{student.address || "N/A"}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Note */}
      <p className="text-center text-gray-500 dark:text-gray-400 mt-8 text-sm">
        Showing {filteredStudents.length} of {students.length} students
      </p>
    </div>
  );
}
