import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { User, Phone, MapPin, BookOpen, CheckCircle, XCircle, Clock, ArrowLeft, Trash2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminStudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [exams, setExams] = useState([]);
  const [quranLogs, setQuranLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteStudent = async () => {
    setDeleting(true);
    try {
      await axiosInstance.delete(`/admin/students/${id}`);
      toast.success("Student deleted successfully!");
      setIsDeleteModalOpen(false);
      navigate(-1);
    } catch (err) {
      console.error("Failed to delete student:", err);
      toast.error(err.response?.data?.message || "Failed to delete student.");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const fetchStudent = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/admin/students/${id}`);
      setStudent(res.data);
      
      // Fetch dynamic exams created by the assigned Ustaz
      if (res.data.assignedUstaz && res.data.assignedUstaz._id) {
        try {
          const examsRes = await axiosInstance.get(`/admin/exams/ustaz/${res.data.assignedUstaz._id}`);
          setExams(examsRes.data);
        } catch (examErr) {
          console.error("Failed to fetch exams:", examErr);
        }
      }

      // Fetch Quran logs if it is a Quran-stream student
      if (res.data.stream === 'quran') {
        try {
          const progressRes = await axiosInstance.get(`/admin/students/${id}/quran-progress`);
          setQuranLogs(progressRes.data);
        } catch (progressErr) {
          console.error("Failed to fetch Quran logs:", progressErr);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load student profile.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="text-center p-10 bg-red-50 text-red-600 rounded-3xl">
        <h2 className="text-2xl font-bold mb-4">Error</h2>
        <p>{error || "Student not found"}</p>
        <button onClick={() => navigate(-1)} className="mt-6 px-6 py-2 bg-red-600 text-white rounded-xl">Go Back</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-4 sm:mb-6 gap-2">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-emerald-600 transition font-medium text-xs sm:text-sm whitespace-nowrap"
        >
          <ArrowLeft size={18} className="shrink-0" />
          <span>Back <span className="hidden sm:inline">to Students List</span></span>
        </button>

        <button
          onClick={() => setIsDeleteModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-red-50 hover:bg-red-500 hover:text-white dark:bg-red-950/40 dark:hover:bg-red-600 text-red-600 dark:text-red-400 rounded-full transition-all duration-200 font-bold text-xs sm:text-sm border border-red-200 dark:border-red-900/60 shadow-sm hover:shadow-md shrink-0 whitespace-nowrap active:scale-95"
          title="Delete Student"
        >
          <Trash2 size={15} className="shrink-0" />
          <span>Delete <span className="hidden sm:inline">Student</span></span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 h-32 md:h-48 relative">
        </div>
        
        <div className="px-8 pb-8 md:px-12 md:pb-12 relative">
          <div className="flex flex-col md:flex-row gap-6 md:items-end -mt-16 md:-mt-20 mb-8">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white dark:border-gray-900 overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-lg flex-shrink-0 relative z-10">
              {student.photo ? (
                <img src={student.photo} alt={student.fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                  <User size={64} />
                </div>
              )}
            </div>
            
            <div className="flex-1 pb-2">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                {student.fullName}
              </h1>
              <div className="flex flex-wrap gap-3 mt-3">
                <span className="px-4 py-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-400 rounded-full text-sm font-bold uppercase tracking-wide">
                  {student.stream === 'kitab' ? 'Kitab Stream' : 'Quran Stream'}
                </span>
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide ${student.status === 'active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400'}`}>
                  {student.status}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Details */}
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <User size={20} className="text-emerald-600" />
                  Personal Details
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <BookOpen size={18} className="text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Currently Learning</p>
                      <p className="text-gray-900 dark:text-white font-semibold">{student.surah || "Not specified"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <User size={18} className="text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Assigned Ustaz</p>
                      <p className="text-gray-900 dark:text-white font-semibold">{student.assignedUstaz?.name || "None"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <MapPin size={18} className="text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Address</p>
                      <p className="text-gray-900 dark:text-white font-semibold">{student.address || "Not provided"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <Phone size={20} className="text-emerald-600" />
                  Contact Information
                </h3>
                
                {(() => {
                  const ustazPhoneOption = student.assignedUstaz ? (student.assignedUstaz.studentPhoneOption || 1) : 1;
                  const isSinglePhone = ustazPhoneOption === 1;

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          {isSinglePhone ? 'Phone Number' : "Father's Phone"}
                        </span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">{student.fatherPhone || "N/A"}</span>
                      </div>
                      
                      {!isSinglePhone && (
                        <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Mother's Phone</span>
                          <span className="font-bold text-gray-800 dark:text-gray-200">{student.motherPhone || "N/A"}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Right Column: Stats */}
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 h-full">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                  <Clock size={20} className="text-emerald-600" />
                  Attendance Summary
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-center shadow-sm">
                    <CheckCircle size={28} className="text-emerald-500 mx-auto mb-2" />
                    <p className="text-3xl font-black text-gray-800 dark:text-white">{student.presentCount || 0}</p>
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-500 mt-1 uppercase tracking-wider">Present</p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-red-100 dark:border-red-900/30 text-center shadow-sm">
                    <XCircle size={28} className="text-red-500 mx-auto mb-2" />
                    <p className="text-3xl font-black text-gray-800 dark:text-white">{student.absentCount || 0}</p>
                    <p className="text-sm font-semibold text-red-600 dark:text-red-500 mt-1 uppercase tracking-wider">Absent</p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-yellow-100 dark:border-yellow-900/30 text-center shadow-sm col-span-2">
                    <p className="text-3xl font-black text-gray-800 dark:text-white">{student.excusedCount || 0}</p>
                    <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-500 mt-1 uppercase tracking-wider">Excused</p>
                  </div>
                </div>

                <div className="mt-8">
                  <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Exam Scores</h4>
                  <div className="space-y-3">
                    {exams.length > 0 ? (
                      exams.map(exam => {
                        const scoreMap = student.examScores || {};
                        const examKey = String(exam._id);
                        const score = scoreMap[examKey] ?? 0;
                        
                        return (
                          <div key={exam._id} className="flex justify-between items-center p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700">
                            <span className="font-medium text-gray-600 dark:text-gray-300">{exam.name}</span>
                            <span className="font-bold text-gray-800 dark:text-white">
                              {score} / {exam.maxScore}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">No exams defined by the assigned Ustaz yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {student.stream === 'quran' && (
            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <BookOpen size={24} className="text-emerald-600 dark:text-emerald-400" />
                Quran Recitation Progress History
              </h3>
              
              {quranLogs.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/30 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                  <p className="text-gray-400 dark:text-gray-500 italic text-sm">No recitation progress logs found for this student.</p>
                </div>
              ) : (
                <div className="relative border-l border-gray-100 dark:border-gray-800 ml-4 pl-8 space-y-6">
                  {quranLogs.map((log) => (
                    <div key={log._id} className="relative">
                      <span className="absolute -left-12 top-1 bg-emerald-500 w-8 h-8 rounded-full border-4 border-white dark:border-gray-900 flex items-center justify-center text-white shadow-sm">
                        <BookOpen size={12} />
                      </span>
                      
                      <div className="bg-gray-50 dark:bg-gray-800/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-gray-800 dark:text-white text-lg">
                              {log.surah} (Juz {log.juz})
                            </span>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                              {log.type === 'hifz' ? 'Memorization' : log.type === 'murajaah' ? 'Revision' : log.type === 'nezer' ? 'Nezer' : log.type === 'tilawah' ? 'Tilawah' : log.type}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                            {new Date(log.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-300 font-semibold mb-2">
                          Verses: {log.verseStart} - {log.verseEnd}
                        </p>
                        
                        {log.notes && (
                          <div className="text-xs italic bg-white dark:bg-gray-900/60 p-3 rounded-xl border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400 mt-2">
                            {log.notes}
                          </div>
                        )}
                        
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-3 flex items-center gap-1">
                          <span>Logged by:</span>
                          <span className="font-bold text-gray-600 dark:text-gray-400">{log.ustaz?.name || "Assigned Ustaz"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
                Are you sure you want to permanently delete{" "}
                <strong className="text-gray-800 dark:text-gray-200">{student?.fullName}</strong>?
              </p>
              <p className="text-sm text-red-500 dark:text-red-400 font-medium mb-8">
                This action cannot be undone and will erase all their attendance history.
              </p>
              
              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={deleting}
                  className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-2xl font-bold transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteStudent}
                  disabled={deleting}
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold shadow-lg shadow-red-500/30 transition-all hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
