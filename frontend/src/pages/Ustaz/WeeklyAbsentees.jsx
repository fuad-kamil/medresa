import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { CalendarX, Search } from "lucide-react";

export default function WeeklyAbsentees() {
  const [absentees, setAbsentees] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchAbsentees = async () => {
      try {
        const response = await axiosInstance.get("/ustaz/attendance/weekly");
        const absentRecords = response.data.filter((r) => r.status === "absent");

        const grouped = {};
        absentRecords.forEach((record) => {
          const studentName = record.student?.fullName || "Unknown Student";
          if (!grouped[studentName]) {
            grouped[studentName] = {
              surah: record.student?.surah || "N/A",
              fatherPhone: record.student?.fatherPhone || "N/A",
              motherPhone: record.student?.motherPhone || "N/A",
              dates: []
            };
          }
          const dateObj = new Date(record.date);
          const dateStr = dateObj.toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          });
          grouped[studentName].dates.push(dateStr);
        });

        setAbsentees(grouped);
      } catch (error) {
        console.error("Failed to fetch weekly absentees:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAbsentees();
  }, []);

  const filteredAbsentees = Object.entries(absentees).filter(([name]) => 
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <CalendarX className="text-red-500" size={36} />
            This Week's Absentees
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
            Detailed view of students who missed class this week.
          </p>
        </div>

        <div className="mt-6 md:mt-0 w-full md:w-auto">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-80 pl-12 pr-5 py-4 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-lg shadow-sm"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full"></div>
        </div>
      ) : filteredAbsentees.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <CalendarX size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">No absentees found!</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Everyone has been present this week, or your search didn't match anyone.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAbsentees.map(([name, data], idx) => (
            <div key={idx} className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-red-100 dark:border-red-900/30 flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 dark:bg-red-900/10 rounded-bl-full -z-0"></div>
              
              <div className="z-10">
                <h3 className="font-bold text-gray-800 dark:text-white text-xl mb-1">{name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Surah: {data.surah}</p>
              </div>
              
              <div className="z-10 bg-gray-50 dark:bg-gray-950/50 rounded-2xl p-4 flex flex-col gap-2 border border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Father's Phone</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{data.fatherPhone}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Mother's Phone</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{data.motherPhone}</span>
                </div>
              </div>

              <div className="z-10 mt-auto">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Days Missed ({data.dates.length})</h4>
                <div className="flex flex-col gap-2">
                  {data.dates.map((d, i) => (
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
      )}
    </div>
  );
}
