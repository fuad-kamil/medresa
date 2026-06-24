import React, { forwardRef } from 'react';

// Using a printable template that relies on the browser's native PDF/Print engine.
// We can use standard Tailwind classes here safely because the browser natively supports modern CSS (unlike html2canvas).
const ReportCardTemplate = forwardRef(({ student, exams, scores, medresaName, ustazName, kitabName, rank, totalStudents }, ref) => {
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
        <div className="flex items-center justify-between border-b-4 border-emerald-600 pb-4 mb-6">
          <div className="flex items-center gap-4">
            <img src="/medresa_icon.jpg" alt="Medresa Logo" className="w-20 h-20 object-contain rounded-full border-2 border-emerald-100" onError={(e) => { e.target.style.display = 'none'; }} />
            <div>
              <h1 className="text-3xl font-extrabold text-emerald-800 uppercase tracking-wider">{medresaName || "Ali Medresa"}</h1>
              <p className="text-lg text-gray-500 font-medium tracking-wide mt-1">Student Report Card</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Date Issued</p>
            <p className="text-lg font-semibold text-gray-800">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        {/* Student Info Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8 bg-gray-50 p-5 rounded-2xl border border-gray-200">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Student Name</p>
            <p className="text-xl font-bold text-gray-800">{student.fullName}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Ustaz</p>
            <p className="text-xl font-bold text-gray-800">{ustazName || student.assignedUstaz?.name || "N/A"}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Kitab</p>
            <p className="text-lg font-medium text-gray-700 capitalize">{kitabName || student.stream || "Kitab"}</p>
          </div>
        </div>

        {/* Academic Performance */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
            Academic Performance
          </h2>
          <table className="w-full text-center border-collapse rounded-xl overflow-hidden shadow-sm border border-gray-200 text-sm">
            <thead>
              <tr className="bg-emerald-600 text-white">
                <th className="p-3 font-bold uppercase tracking-wider text-xs border-b border-emerald-700 text-left">Student Name</th>
                {exams.map(exam => (
                  <th key={exam._id} className="p-3 font-bold uppercase tracking-wider text-xs border-b border-emerald-700">
                    {exam.name}<br/>
                    <span className="text-[10px] font-normal text-emerald-200">(Max: {exam.maxScore || 100})</span>
                  </th>
                ))}
                <th className="p-3 font-bold uppercase tracking-wider text-xs border-b border-emerald-700">Total</th>
                <th className="p-3 font-bold uppercase tracking-wider text-xs border-b border-emerald-700">Rank</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              <tr>
                <td className="p-3 font-bold text-gray-800 border-b border-gray-200 text-left whitespace-nowrap">{student.fullName}</td>
                {exams.length === 0 ? (
                  <td className="p-3 text-gray-500 italic border-b border-gray-200">No exams</td>
                ) : (
                  exams.map(exam => {
                    const score = Number(studentScores[exam._id]) || 0;
                    return (
                      <td key={exam._id} className="p-3 font-bold text-emerald-600 border-b border-gray-200">
                        {score}
                      </td>
                    );
                  })
                )}
                <td className="p-3 font-bold text-gray-800 border-b border-gray-200 bg-gray-50">
                  {totalScore} <span className="text-xs text-gray-400 font-normal">/ {maxPossibleScore}</span>
                </td>
                <td className="p-3 font-bold text-emerald-700 border-b border-gray-200 bg-emerald-50 whitespace-nowrap">
                  {rank ? `${rank} out of ${totalStudents}` : "N/A"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Attendance Record */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-emerald-800 mb-3">Attendance Record</h2>
          <div className="flex gap-3">
            <div className="flex-1 bg-white p-4 rounded-xl border border-emerald-100 text-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Present</p>
              <p className="text-2xl font-black text-emerald-600">{present}</p>
            </div>
            <div className="flex-1 bg-white p-4 rounded-xl border border-red-100 text-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Absent</p>
              <p className="text-2xl font-black text-red-600">{absent}</p>
            </div>
            <div className="flex-1 bg-white p-4 rounded-xl border border-amber-100 text-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Excused</p>
              <p className="text-2xl font-black text-amber-500">{excused}</p>
            </div>
            <div className="flex-1 bg-emerald-600 p-4 rounded-xl text-center shadow-sm">
              <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider mb-1">Rate</p>
              <p className="text-2xl font-black text-white">{attendancePercentage}%</p>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="mt-16 flex justify-end px-10">
          <div className="text-center w-64">
            <div className="border-b-2 border-gray-800 h-8 mb-2"></div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Parent/Guardian Signature</p>
          </div>
        </div>



      </div>
    </div>
  );
});

export default ReportCardTemplate;
