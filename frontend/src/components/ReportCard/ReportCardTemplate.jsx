import React, { forwardRef } from 'react';

// Using a printable template that relies on the browser's native PDF/Print engine.
// We can use standard Tailwind classes here safely because the browser natively supports modern CSS (unlike html2canvas).
const ReportCardTemplate = forwardRef(({ student, exams, scores, medresaName, ustazName, kitabName, rank, totalStudents, captureRef }, ref) => {
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
    <div style={{ position: 'fixed', top: '-10000px', left: '-10000px', zIndex: -1 }}>
      {/* captureRef — used by html-to-image for PDF download, sized to A4 at 96dpi */}
      <div ref={captureRef} style={{
        width: '794px',
        minHeight: '1123px',
        padding: '60px',
        backgroundColor: '#ffffff',
        color: '#1f2937',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxSizing: 'border-box'
      }}>
      {/* printRef — used by react-to-print */}
      <div ref={ref} style={{ width: '100%', fontFamily: 'system-ui, sans-serif' }}>
        
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
        <div className="mb-8">
          <h2 className="text-xl font-bold text-emerald-800 mb-3">Academic Performance</h2>
          <table className="w-full text-left border-collapse border border-gray-200 text-sm">
            <thead>
              <tr className="bg-emerald-600 text-white">
                <th className="p-3 font-bold uppercase tracking-wider text-xs border-b border-emerald-700 w-1/2">Exam</th>
                <th className="p-3 font-bold uppercase tracking-wider text-xs border-b border-emerald-700 text-center w-1/4">Max Score</th>
                <th className="p-3 font-bold uppercase tracking-wider text-xs border-b border-emerald-700 text-center w-1/4">Score</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {exams.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-4 text-center text-gray-400 italic">No exams recorded.</td>
                </tr>
              ) : (
                exams.map((exam, index) => {
                  const score = Number(studentScores[exam._id]) || 0;
                  return (
                    <tr key={exam._id} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="p-3 font-semibold text-gray-800 border-b border-gray-200">{exam.name}</td>
                      <td className="p-3 text-center text-gray-500 border-b border-gray-200">{exam.maxScore || 100}</td>
                      <td className="p-3 text-center font-bold text-emerald-600 border-b border-gray-200">{score}</td>
                    </tr>
                  );
                })
              )}
              <tr className="bg-gray-100 border-t-2 border-emerald-600">
                <td className="p-3 font-bold text-gray-700 uppercase tracking-wide text-xs">Total</td>
                <td className="p-3 text-center font-bold text-gray-600">{maxPossibleScore}</td>
                <td className="p-3 text-center font-bold text-emerald-700 text-base">{totalScore}</td>
              </tr>
              <tr className="bg-emerald-50 border-t border-emerald-200">
                <td colSpan="2" className="p-3 font-bold text-emerald-800 uppercase tracking-wide text-xs">Class Rank</td>
                <td className="p-3 text-center font-bold text-emerald-700">
                  {rank ? `${rank} / ${totalStudents}` : "N/A"}
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



      </div> {/* printRef */}
      </div> {/* captureRef */}
    </div>
  );
});

export default ReportCardTemplate;
