import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { Search, UserMinus, UserCheck, Trash2, AlertCircle, RefreshCw } from "lucide-react";
import useAuthStore from "../../store/authStore";

export default function UnassignedStudents() {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [students, setStudents] = useState([]);
  const [ustazs, setUstazs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Assignment Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedUstazId, setSelectedUstazId] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentsRes, ustazsRes] = await Promise.all([
        axiosInstance.get("/admin/students"),
        axiosInstance.get("/admin/ustazs")
      ]);
      
      const unassigned = studentsRes.data.filter(s => !s.assignedUstaz);
      setStudents(unassigned);
      
      const approvedUstazs = ustazsRes.data.filter(u => u.isApproved);
      setUstazs(approvedUstazs);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (studentId) => {
    if (!window.confirm("Are you sure you want to delete this student? This action cannot be undone.")) return;
    
    try {
      await axiosInstance.delete(`/admin/students/${studentId}`);
      setStudents(students.filter(s => s._id !== studentId));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete student.");
    }
  };

  const openAssignModal = (student) => {
    setSelectedStudent(student);
    setSelectedUstazId("");
    setIsAssignModalOpen(true);
  };

  const handleAssignUstaz = async () => {
    if (!selectedUstazId) return alert("Please select an Ustaz.");
    
    setAssignLoading(true);
    try {
      await axiosInstance.patch(`/admin/students/${selectedStudent._id}/transfer`, {
        assignedUstaz: selectedUstazId
      });
      setIsAssignModalOpen(false);
      setStudents(students.filter(s => s._id !== selectedStudent._id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign Ustaz.");
    } finally {
      setAssignLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    return (
      student.fullName?.toLowerCase().includes(term) ||
      student.surah?.toLowerCase().includes(term)
    );
  });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
            Unassigned Students
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Total Unassigned:{" "}
            <span className="font-semibold text-amber-600">
              {students.length}
            </span>
          </p>
        </div>

        {/* Search */}
        <div className="mt-6 md:mt-0 flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 w-full sm:w-auto">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Search by name or surah..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-5 py-4 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-600 text-lg min-w-[250px]"
            />
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-8 p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-pulse">
          <div className="flex items-center gap-4 text-red-700 dark:text-red-400">
            <AlertCircle size={24} className="flex-shrink-0" />
            <div>
              <p className="font-bold text-lg">Error Fetching Data</p>
              <p className="text-md mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-5 py-3 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-400 rounded-xl transition font-semibold w-full sm:w-auto justify-center"
          >
            <RefreshCw size={18} />
            Retry
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
                  Stream
                </th>
                <th className="text-left p-6 font-semibold text-gray-600 dark:text-gray-300">
                  Parents' Phones
                </th>
                <th className="text-left p-6 font-semibold text-gray-600 dark:text-gray-300">
                  Address
                </th>
                <th className="text-center p-6 font-semibold text-gray-600 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-20">
                    <div className="animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full mx-auto"></div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-20 text-gray-500 dark:text-gray-400"
                  >
                    No unassigned students found.
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
                    <td className="p-6 text-gray-700 dark:text-gray-300 capitalize">
                      {student.stream || "Quran"}
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
                    <td className="p-6">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => openAssignModal(student)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-400 rounded-xl transition font-medium"
                        >
                          <UserCheck size={18} />
                          Assign Ustaz
                        </button>
                        <button
                          onClick={() => handleDelete(student._id)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-400 rounded-xl transition font-medium"
                        >
                          <Trash2 size={18} />
                          Delete
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
      <div className="lg:hidden grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full"></div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 rounded-3xl shadow-sm">
            No unassigned students found.
          </div>
        ) : (
          filteredStudents.map((student) => (
            <div key={student._id} className="bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-3 relative">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white text-lg">{student.fullName}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                    {student.stream || "Quran"}
                  </p>
                </div>
                <span className="inline-flex items-center px-3 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-xs font-bold rounded-full uppercase tracking-wider">
                  <UserMinus size={12} className="mr-1" /> Unassigned
                </span>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-950/50 rounded-2xl p-4 flex flex-col gap-2 border border-gray-100 dark:border-gray-800">
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

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => openAssignModal(student)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-400 rounded-xl transition font-medium"
                >
                  <UserCheck size={18} /> Assign
                </button>
                <button
                  onClick={() => handleDelete(student._id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-400 rounded-xl transition font-medium"
                >
                  <Trash2 size={18} /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Note */}
      <p className="text-center text-gray-500 dark:text-gray-400 mt-8 text-sm">
        Showing {filteredStudents.length} unassigned students
      </p>

      {/* Assign Modal */}
      {isAssignModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-700 overflow-hidden">
            
            <div className="bg-blue-50 dark:bg-blue-900/20 pt-8 pb-6 flex justify-center border-b border-blue-100 dark:border-blue-900/30">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-800/40 rounded-full flex items-center justify-center shadow-inner">
                <UserCheck size={40} className="text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Assign Ustaz
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                Assign an Ustaz for <span className="font-bold text-gray-800 dark:text-gray-200">{selectedStudent.fullName}</span>
              </p>
              
              <div className="mb-6 text-left">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Ustaz</label>
                <select
                  value={selectedUstazId}
                  onChange={(e) => setSelectedUstazId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose an Ustaz --</option>
                  {ustazs.filter(u => u.stream === selectedStudent.stream || !selectedStudent.stream).map(ustaz => (
                    <option key={ustaz._id} value={ustaz._id}>
                      {ustaz.name} {ustaz.stream === 'kitab' && ustaz.kitabName ? `(${ustaz.kitabName})` : ''}
                    </option>
                  ))}
                </select>
                {ustazs.length === 0 && (
                  <p className="text-xs text-red-500 mt-2">No approved Ustazs available.</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setIsAssignModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-xl font-bold transition-all shadow-sm"
                  disabled={assignLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignUstaz}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/30 transition-all disabled:opacity-70"
                  disabled={assignLoading || !selectedUstazId}
                >
                  {assignLoading ? "Assigning..." : "Assign"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
