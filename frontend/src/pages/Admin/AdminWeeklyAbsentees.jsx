import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { CalendarX, Search, ChevronDown } from "lucide-react";
import useAuthStore from "../../store/authStore";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const WEEKS = [
  { value: 1, label: "Week 1 (1st - 7th)" },
  { value: 2, label: "Week 2 (8th - 14th)" },
  { value: 3, label: "Week 3 (15th - 21st)" },
  { value: 4, label: "Week 4 (22nd - End)" }
];

export default function AdminWeeklyAbsentees() {
  const [absentees, setAbsentees] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const language = useAuthStore(state => state.language);
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedWeek, setSelectedWeek] = useState(() => {
      const day = currentDate.getDate();
      if (day <= 7) return 1;
      if (day <= 14) return 2;
      if (day <= 21) return 3;
      return 4;
  });

  useEffect(() => {
    const fetchAbsentees = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/admin/weekly-absentees?month=${selectedMonth}&week=${selectedWeek}`);
        const absentRecords = response.data;

        // Group by Ustaz first
        const grouped = {};
        absentRecords.forEach((record) => {
          if (!record.ustaz || !record.student) return;
          
          const ustazName = record.ustaz.name || "Unknown Ustaz";
          if (!grouped[ustazName]) {
            grouped[ustazName] = {
               stream: record.ustaz.stream,
               kitabName: record.ustaz.kitabName,
               students: {}
            };
          }
          
          const studentName = record.student.fullName || "Unknown Student";
          if (!grouped[ustazName].students[studentName]) {
            grouped[ustazName].students[studentName] = {
              surah: record.student.surah || "N/A",
              stream: record.student.stream || "quran",
              fatherPhone: record.student.fatherPhone || "N/A",
              motherPhone: record.student.motherPhone || "N/A",
              dates: []
            };
          }
          
          const dateObj = new Date(record.date);
          const dateStr = dateObj.toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US', {
            weekday: "short",
            month: "short",
            day: "numeric",
          });
          grouped[ustazName].students[studentName].dates.push(dateStr);
        });

        setAbsentees(grouped);
      } catch (error) {
        console.error("Failed to fetch admin weekly absentees:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAbsentees();
  }, [selectedMonth, selectedWeek, language]);

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <CalendarX className="text-red-500" size={36} />
            Weekly Absentees Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
            Detailed view of absentees grouped by Ustaz.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full sm:w-auto appearance-none bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl px-5 py-4 pr-12 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-lg shadow-sm font-medium text-gray-700 dark:text-gray-200"
            >
              {MONTHS.map((month, idx) => (
                <option key={idx + 1} value={idx + 1}>{month}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
          </div>
          
          <div className="relative">
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              className="w-full sm:w-auto appearance-none bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl px-5 py-4 pr-12 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-lg shadow-sm font-medium text-gray-700 dark:text-gray-200"
            >
              {WEEKS.map(week => (
                <option key={week.value} value={week.value}>{week.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
          </div>

          <div className="relative flex-grow">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Search Ustaz..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-5 py-4 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-lg shadow-sm"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full"></div>
        </div>
      ) : Object.keys(absentees).length === 0 ? (
        <div className="bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <CalendarX size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">No absentees found</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">There are no records of absentees for the selected week and month.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {Object.entries(absentees)
            .filter(([ustazName]) => ustazName.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(([ustazName, ustazData], idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-200 dark:border-gray-700">
                <div className="mb-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                   <div>
                       <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{ustazName}</h2>
                       <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 capitalize">
                           Stream: {ustazData.stream} {ustazData.stream === 'kitab' && ustazData.kitabName ? \` - \${ustazData.kitabName}\` : ''}
                       </p>
                   </div>
                   <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-2 rounded-xl text-sm font-bold">
                       {Object.keys(ustazData.students).length} Absent Student(s)
                   </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(ustazData.students).map(([studentName, studentData], sIdx) => (
                    <div key={sIdx} className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-red-100 dark:border-red-900/30 flex flex-col gap-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 dark:bg-red-900/10 rounded-bl-full -z-0"></div>

                      <div className="z-10">
                        <h3 className="font-bold text-gray-800 dark:text-white text-xl mb-1">{studentName}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {studentData.stream === 'kitab' ? `Kitab: ${studentData.surah}` : `Surah: ${studentData.surah}`}
                        </p>
                      </div>

                      <div className="z-10 bg-gray-50 dark:bg-gray-950/50 rounded-2xl p-4 flex flex-col gap-2 border border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Father</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">{studentData.fatherPhone}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Mother</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">{studentData.motherPhone}</span>
                        </div>
                      </div>

                      <div className="z-10 mt-auto">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Days Missed ({studentData.dates.length})</h4>
                        <div className="flex flex-col gap-2">
                          {studentData.dates.map((d, i) => (
                            <div key={i} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded-xl text-sm font-medium flex items-center">
                              <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                              {d}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
