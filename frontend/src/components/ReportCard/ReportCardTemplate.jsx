import React, { forwardRef } from 'react';

// Using a printable template that relies on the browser's native PDF/Print engine.
// We can use standard Tailwind classes here safely because the browser natively supports modern CSS (unlike html2canvas).
const ReportCardTemplate = forwardRef(({ student, exams, scores, medresaName, ustazName, rank, totalStudents }, ref) => {
  if (!student) return null;

  // Calculate Attendance Stats
  const present = student.presentCount || 0;
  const absent = student.absentCount || 0;
  const excused = student.excusedCount || 0;
  const totalDays = present + absent + excused;
  const attendancePercentage = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

  // Calculate Exam Stats
  let totalScore = 0;
  let maxPossibleScore = 0;
  const studentScores = scores[student._id] || {};
  
  exams.forEach(exam => {
    totalScore += Number(studentScores[exam._id]) || 0;
    maxPossibleScore += Number(exam.maxScore) || 100;
  });

  return (
    <div style={{ display: "none" }}>
      {/* The ref is attached to this inner container which gets cloned into the print iframe */}
      <div ref={ref} className="p-10 bg-white text-gray-800" style={{ width: '100%', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
        
        {/* Print-specific styles to force A4 sizing and hide URLs */}
        <style type="text/css" media="print">
          {`
            @page { size: A4 portrait; margin: 15mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          `}
        </style>

        {/* Header */}
        <div className="flex items-center justify-between border-b-4 border-emerald-600 pb-6 mb-8">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Medresa Logo" className="w-24 h-24 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
            <div>
              <h1 className="text-4xl font-extrabold text-emerald-800 uppercase tracking-wider">{medresaName || "Ali Medresa"}</h1>
              <p className="text-xl text-gray-500 font-medium tracking-wide mt-1">Official Student Report Card</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Date Issued</p>
            <p className="text-lg font-semibold text-gray-800">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        {/* Student Info Grid */}
        <div className="grid grid-cols-2 gap-6 mb-10 bg-gray-50 p-6 rounded-2xl border border-gray-200">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Student Name</p>
            <p className="text-2xl font-bold text-gray-800">{student.fullName}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Ustaz</p>
            <p className="text-2xl font-bold text-gray-800">{ustazName || student.assignedUstaz?.name || "N/A"}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Stream</p>
            <p className="text-xl font-medium text-gray-700 capitalize">{student.stream || "Kitab"}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Class Rank</p>
            <p className="text-xl font-bold text-emerald-600">
              {rank ? `${rank} out of ${totalStudents}` : "N/A"}
            </p>
          </div>
        </div>

        {/* Academic Performance */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
            Academic Performance
          </h2>
          <table className="w-full text-left border-collapse rounded-xl overflow-hidden shadow-sm border border-gray-200">
            <thead>
              <tr className="bg-emerald-600 text-white">
                <th className="p-4 font-bold uppercase tracking-wider text-sm border-b border-emerald-700">Exam Name</th>
                <th className="p-4 font-bold uppercase tracking-wider text-sm border-b border-emerald-700 text-center">Max Score</th>
                <th className="p-4 font-bold uppercase tracking-wider text-sm border-b border-emerald-700 text-center">Score Achieved</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {exams.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-6 text-center text-gray-500 border-b border-gray-200">No exams recorded.</td>
                </tr>
              ) : (
                exams.map((exam, index) => {
                  const score = Number(studentScores[exam._id]) || 0;
                  return (
                    <tr key={exam._id} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="p-4 font-semibold text-gray-800 border-b border-gray-200">{exam.name}</td>
                      <td className="p-4 text-center font-medium text-gray-600 border-b border-gray-200">{exam.maxScore || 100}</td>
                      <td className="p-4 text-center font-bold text-emerald-600 border-b border-gray-200">{score}</td>
                    </tr>
                  );
                })
              )}
              <tr className="bg-gray-100 border-t-4 border-emerald-600">
                <td className="p-4 font-bold text-gray-800 text-right uppercase tracking-wider">Total</td>
                <td className="p-4 text-center font-bold text-gray-800">{maxPossibleScore}</td>
                <td className="p-4 text-center font-bold text-emerald-600 text-xl">{totalScore}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Attendance Record */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-emerald-800 mb-4">Attendance Record</h2>
          <div className="flex gap-4">
            <div className="flex-1 bg-white p-6 rounded-xl border-2 border-emerald-100 text-center">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Present</p>
              <p className="text-3xl font-black text-emerald-600">{present}</p>
            </div>
            <div className="flex-1 bg-white p-6 rounded-xl border-2 border-red-100 text-center">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Absent</p>
              <p className="text-3xl font-black text-red-600">{absent}</p>
            </div>
            <div className="flex-1 bg-white p-6 rounded-xl border-2 border-amber-100 text-center">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Excused</p>
              <p className="text-3xl font-black text-amber-500">{excused}</p>
            </div>
            <div className="flex-1 bg-emerald-600 p-6 rounded-xl text-center shadow-md">
              <p className="text-sm font-bold text-emerald-100 uppercase tracking-wider mb-2">Rate</p>
              <p className="text-3xl font-black text-white">{attendancePercentage}%</p>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="mt-24 flex justify-between px-10">
          <div className="text-center w-64">
            <div className="border-b-2 border-gray-800 h-8 mb-2"></div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Ustaz Signature</p>
          </div>
          <div className="text-center w-64">
            <div className="border-b-2 border-gray-800 h-8 mb-2"></div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Parent/Guardian Signature</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center border-t border-gray-200 pt-6">
          <p className="text-xs font-medium text-gray-400">Generated automatically by the Medresa Management System</p>
        </div>

      </div>
    </div>
  );
});

export default ReportCardTemplate;
