import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import useAuthStore from "../../store/authStore";
import { Search, Save, GraduationCap, CheckCircle } from "lucide-react";

export default function Exams() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [savedSuccessId, setSavedSuccessId] = useState(null);
  
  // Local score states for inline editing
  const [scores, setScores] = useState({});

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const endpoint = isAdmin ? "/admin/students" : "/ustaz/students";
      const res = await axiosInstance.get(endpoint);
      
      // Filter out Quran students - exams are only for Kitab stream
      const kitabStudents = res.data.filter(s => s.stream === 'kitab');
      setStudents(kitabStudents);

      // Initialize local scores state
      const initialScores = {};
      kitabStudents.forEach((student) => {
        initialScores[student._id] = {
          firstExam: student.firstExam || 0,
          secondExam: student.secondExam || 0,
          finalExam: student.finalExam || 0,
        };
      });
      setScores(initialScores);
    } catch (err) {
      console.error("Failed to fetch students for exams", err);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (studentId, examKey, val) => {
    // Restrict score to a valid number between 0 and 100
    let numericVal = val === "" ? "" : Number(val);
    if (numericVal !== "" && (isNaN(numericVal) || numericVal < 0 || numericVal > 100)) {
      return;
    }

    setScores((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [examKey]: numericVal,
      },
    }));
  };

  const handleSaveScores = async (studentId) => {
    setSavingId(studentId);
    try {
      const endpoint = isAdmin 
        ? `/admin/students/${studentId}/scores` 
        : `/ustaz/students/${studentId}/scores`;
        
      const payload = {
        firstExam: scores[studentId].firstExam || 0,
        secondExam: scores[studentId].secondExam || 0,
        finalExam: scores[studentId].finalExam || 0,
      };

      await axiosInstance.put(endpoint, payload);
      setSavedSuccessId(studentId);
      setTimeout(() => setSavedSuccessId(null), 3000);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to save exam scores");
    } finally {
      setSavingId(null);
    }
  };

  const filteredStudents = students.filter((student) =>
    student.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <GraduationCap size={44} className="text-emerald-600 shrink-0" />
            Exams & Performance
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-3 text-lg">
            Manage, record, and track exam scores for all students.
          </p>
        </div>

        {/* Search */}
        <div className="relative mt-6 md:mt-0 w-full md:w-80">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-5 py-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-md shadow-sm"
          />
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 mb-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <th className="p-6 font-semibold text-gray-600 dark:text-gray-300">Student Name</th>
                {isAdmin && (
                  <th className="p-6 font-semibold text-gray-600 dark:text-gray-300">Assigned Ustaz</th>
                )}
                <th className="p-6 font-semibold text-gray-600 dark:text-gray-300 text-center w-32">First Exam</th>
                <th className="p-6 font-semibold text-gray-600 dark:text-gray-300 text-center w-32">Second Exam</th>
                <th className="p-6 font-semibold text-gray-600 dark:text-gray-300 text-center w-32">Final Exam</th>
                <th className="p-6 font-semibold text-gray-600 dark:text-gray-300 text-center w-28">Total</th>
                <th className="p-6 font-semibold text-gray-600 dark:text-gray-300 text-center w-28">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="text-center py-20">
                    <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto font-medium"></div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="text-center py-20 text-gray-500 font-medium">
                    No students found.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const studentScores = scores[student._id] || { firstExam: 0, secondExam: 0, finalExam: 0 };
                  const totalScore = 
                    (Number(studentScores.firstExam) || 0) + 
                    (Number(studentScores.secondExam) || 0) + 
                    (Number(studentScores.finalExam) || 0);

                  return (
                    <tr key={student._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition duration-150">
                      <td className="p-6 font-bold text-gray-800 dark:text-white">
                        {student.fullName}
                      </td>
                      {isAdmin && (
                        <td className="p-6 text-gray-600 dark:text-gray-400 font-medium">
                          {student.assignedUstaz?.name || (
                            <span className="text-gray-400 italic font-normal">Not Assigned</span>
                          )}
                        </td>
                      )}
                      
                      {/* First Exam Input */}
                      <td className="p-6 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={studentScores.firstExam}
                          onChange={(e) => handleScoreChange(student._id, "firstExam", e.target.value)}
                          className="w-20 px-3 py-2 text-center bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-gray-900 outline-none transition font-semibold"
                        />
                      </td>

                      {/* Second Exam Input */}
                      <td className="p-6 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={studentScores.secondExam}
                          onChange={(e) => handleScoreChange(student._id, "secondExam", e.target.value)}
                          className="w-20 px-3 py-2 text-center bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-gray-900 outline-none transition font-semibold"
                        />
                      </td>

                      {/* Final Exam Input */}
                      <td className="p-6 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={studentScores.finalExam}
                          onChange={(e) => handleScoreChange(student._id, "finalExam", e.target.value)}
                          className="w-20 px-3 py-2 text-center bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-gray-900 outline-none transition font-semibold"
                        />
                      </td>

                      {/* Total Score */}
                      <td className="p-6 text-center">
                        <span className="inline-flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold px-4 py-2 rounded-xl text-lg w-20">
                          {totalScore}
                        </span>
                      </td>

                      {/* Action Button */}
                      <td className="p-6 text-center">
                        {savedSuccessId === student._id ? (
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold text-sm shadow-sm animate-pulse">
                            <CheckCircle size={16} /> Saved
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSaveScores(student._id)}
                            disabled={savingId === student._id}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl font-semibold text-sm transition shadow-sm hover:shadow-md cursor-pointer"
                          >
                            <Save size={16} />
                            {savingId === student._id ? "Saving..." : "Save"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
