import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { Users, Calendar, ChevronDown, ChevronUp, User, CheckCircle, Trash2, ArrowRightLeft, History, X, AlertTriangle } from "lucide-react";
import useAuthStore from "../../store/authStore";

export default function AdminDashboard() {
  const { token } = useAuthStore();
  const [students, setStudents] = useState([]);
  const [ustazs, setUstazs] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [expandedUstazId, setExpandedUstazId] = useState(null);
  const [loading, setLoading] = useState(true);

  // History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [selectedStudentName, setSelectedStudentName] = useState("");
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, ustazsRes, attendanceRes] = await Promise.all([
          axiosInstance.get("/admin/students"),
          axiosInstance.get("/admin/ustazs"),
          axiosInstance.get("/admin/attendance/today"),
        ]);

        setStudents(studentsRes.data);
        setUstazs(ustazsRes.data);
        setTodayAttendance(attendanceRes.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchData();
  }, [token]);

  const toggleUstaz = (id) => {
    setExpandedUstazId(expandedUstazId === id ? null : id);
  };

  const handleApproveUstaz = async (ustazId, e) => {
    e.stopPropagation();
    try {
      await axiosInstance.patch(`/admin/ustaz/approve/${ustazId}`);
      setUstazs(ustazs.map(u => u._id === ustazId ? { ...u, isApproved: true } : u));
    } catch (error) {
      console.error("Failed to approve ustaz:", error);
      alert("Failed to approve Ustaz.");
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
    } catch (error) {
      console.error("Failed to delete student:", error);
      alert("Failed to delete student.");
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
    } catch (error) {
      console.error("Failed to delete ustaz:", error);
      alert("Failed to delete Ustaz.");
    }
  };

  const openTransferModal = (studentId, e) => {
    e.stopPropagation();
    setTransferStudentId(studentId);
    setNewUstazId("");
    setIsTransferModalOpen(true);
  };

  const handleTransferStudent = async () => {
    if (!newUstazId) return alert("Please select an Ustaz to transfer to.");
    
    try {
      const res = await axiosInstance.patch(`/admin/students/${transferStudentId}/transfer`, { assignedUstaz: newUstazId });
      
      // Update local state
      setStudents(students.map(s => s._id === transferStudentId ? { ...s, assignedUstaz: res.data.student.assignedUstaz } : s));
      setIsTransferModalOpen(false);
    } catch (error) {
      console.error("Failed to transfer student:", error);
      alert("Failed to transfer student.");
    }
  };

  const openHistoryModal = async (student) => {
    setSelectedStudentName(student.fullName);
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

  if (loading) return <div className="text-center py-20 text-gray-500">Loading dashboard...</div>;

  const approvedUstazs = ustazs.filter(u => u.isApproved);
  const quranUstazsCount = ustazs.filter(u => u.stream === 'quran' || !u.stream).length;
  const kitabUstazsCount = ustazs.filter(u => u.stream === 'kitab').length;

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 dark:text-white">
          Assalamu Alaikum, Admin
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-3 text-lg">
          Welcome to your dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow border border-gray-100 dark:border-gray-700 hover:shadow-xl transition">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Total Students</p>
              <p className="text-5xl font-bold mt-6 text-gray-800 dark:text-white">{totalStudents}</p>
            </div>
            <Users size={52} className="text-emerald-600/20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow border border-gray-100 dark:border-gray-700 hover:shadow-xl transition">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Total Ustazs</p>
              <p className="text-5xl font-bold mt-6 text-gray-800 dark:text-white">{ustazs.length}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-semibold">
                Quran: <span className="text-emerald-600 dark:text-emerald-400">{quranUstazsCount}</span> | Kitab: <span className="text-blue-600 dark:text-blue-400">{kitabUstazsCount}</span>
              </p>
            </div>
            <User size={52} className="text-blue-600/20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow border border-gray-100 dark:border-gray-700 hover:shadow-xl transition">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Today's Attendance</p>
              <p className="text-5xl font-bold mt-6 text-gray-800 dark:text-white">{attendancePercentage}%</p>
            </div>
            <Calendar size={52} className="text-amber-600/20" />
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        Ustazs & Students Overview
      </h2>
      
      <div className="space-y-4">
        {ustazs.map((ustaz) => {
          const ustazStudents = students.filter((s) => s.assignedUstaz && s.assignedUstaz._id === ustaz._id);
          const isExpanded = expandedUstazId === ustaz._id;

          return (
            <div key={ustaz._id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div
                onClick={() => toggleUstaz(ustaz._id)}
                className="w-full px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer"
              >
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-800/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center font-bold shrink-0">
                    <User size={20} />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-bold text-gray-800 dark:text-white text-lg flex items-center gap-2 truncate">
                      {ustaz.name}
                      {ustaz.isApproved && <CheckCircle size={16} className="text-emerald-500 shrink-0" title="Approved" />}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {ustazStudents.length} Students Assigned
                    </p>
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
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-gray-500 hover:text-gray-800 dark:hover:text-white transition">
                <X size={24} />
              </button>
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
                            {new Date(record.date).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
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

    </div>
  );
}
