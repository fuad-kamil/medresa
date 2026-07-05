import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { User, Phone, MapPin, BookOpen, CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react";

export default function AdminStudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const fetchStudent = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/admin/students/${id}`);
      setStudent(res.data);
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
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-emerald-600 transition mb-6 font-medium"
      >
        <ArrowLeft size={20} />
        Back to Students List
      </button>

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
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {student.stream === 'kitab' ? 'Phone Number' : 'Father'}
                    </span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{student.fatherPhone || "N/A"}</span>
                  </div>
                  
                  {student.stream !== 'kitab' && (
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Mother</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{student.motherPhone || "N/A"}</span>
                    </div>
                  )}
                </div>
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
                    <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700">
                      <span className="font-medium text-gray-600 dark:text-gray-300">First Exam</span>
                      <span className="font-bold text-gray-800 dark:text-white">{student.firstExam || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700">
                      <span className="font-medium text-gray-600 dark:text-gray-300">Second Exam</span>
                      <span className="font-bold text-gray-800 dark:text-white">{student.secondExam || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700">
                      <span className="font-medium text-gray-600 dark:text-gray-300">Final Exam</span>
                      <span className="font-bold text-gray-800 dark:text-white">{student.finalExam || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
