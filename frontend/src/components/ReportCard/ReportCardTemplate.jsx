import React, { forwardRef } from 'react';

// Using exact Hex values to avoid Tailwind v4's OKLCH format
// which causes html2canvas to crash.
const C = {
  emerald100: '#d1fae5',
  emerald600: '#059669',
  emerald700: '#047857',
  emerald800: '#065f46',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  red100: '#fee2e2',
  red600: '#dc2626',
  amber100: '#fef3c7',
  amber500: '#f59e0b',
  white: '#ffffff',
  transparent: 'transparent'
};

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
    <div>
      <div className="absolute top-[-10000px] left-[-10000px]">
        <div 
          id="report-card-content" 
          ref={ref}
          style={{ 
            width: '210mm', 
            minHeight: '297mm', 
            padding: '20mm',
            backgroundColor: C.white,
            color: C.gray800,
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-6 mb-8" style={{ borderBottom: `4px solid ${C.emerald600}` }}>
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="Medresa Logo" className="w-24 h-24 object-contain" onError={(e) => {
                e.target.style.display = 'none';
              }} />
              <div style={{ display: 'none' }} id="logo-fallback">M</div>
              <div>
                <h1 className="text-4xl font-extrabold uppercase tracking-wider" style={{ color: C.emerald800 }}>{medresaName || "Ali Medresa"}</h1>
                <p className="text-xl font-medium tracking-wide mt-1" style={{ color: C.gray500 }}>Official Student Report Card</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold uppercase tracking-widest mb-1" style={{ color: C.gray400 }}>Date Issued</p>
              <p className="text-lg font-semibold" style={{ color: C.gray800 }}>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          {/* Student Info Grid */}
          <div className="grid grid-cols-2 gap-6 mb-10 p-6 rounded-2xl" style={{ backgroundColor: C.gray50, border: `1px solid ${C.gray200}` }}>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: C.gray400 }}>Student Name</p>
              <p className="text-2xl font-bold" style={{ color: C.gray800 }}>{student.fullName}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: C.gray400 }}>Ustaz</p>
              <p className="text-2xl font-bold" style={{ color: C.gray800 }}>{ustazName || student.assignedUstaz?.name || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: C.gray400 }}>Stream</p>
              <p className="text-xl font-medium capitalize" style={{ color: C.gray700 }}>{student.stream || "Kitab"}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: C.gray400 }}>Class Rank</p>
              <p className="text-xl font-bold" style={{ color: C.emerald600 }}>
                {rank ? `${rank} out of ${totalStudents}` : "N/A"}
              </p>
            </div>
          </div>

          {/* Academic Performance */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: C.emerald800 }}>
              Academic Performance
            </h2>
            <table className="w-full text-left border-collapse rounded-xl overflow-hidden shadow-sm">
              <thead>
                <tr style={{ backgroundColor: C.emerald600, color: C.white }}>
                  <th className="p-4 font-bold uppercase tracking-wider text-sm" style={{ borderBottom: `1px solid ${C.emerald700}` }}>Exam Name</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-sm text-center" style={{ borderBottom: `1px solid ${C.emerald700}` }}>Max Score</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-sm text-center" style={{ borderBottom: `1px solid ${C.emerald700}` }}>Score Achieved</th>
                </tr>
              </thead>
              <tbody style={{ backgroundColor: C.white }}>
                {exams.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="p-6 text-center" style={{ color: C.gray500, borderBottom: `1px solid ${C.gray200}` }}>No exams recorded.</td>
                  </tr>
                ) : (
                  exams.map((exam, index) => {
                    const score = Number(studentScores[exam._id]) || 0;
                    return (
                      <tr key={exam._id} style={{ backgroundColor: index % 2 === 0 ? C.gray50 : C.white }}>
                        <td className="p-4 font-semibold" style={{ color: C.gray800, borderBottom: `1px solid ${C.gray200}` }}>{exam.name}</td>
                        <td className="p-4 text-center font-medium" style={{ color: C.gray600, borderBottom: `1px solid ${C.gray200}` }}>{exam.maxScore || 100}</td>
                        <td className="p-4 text-center font-bold" style={{ color: C.emerald600, borderBottom: `1px solid ${C.gray200}` }}>{score}</td>
                      </tr>
                    );
                  })
                )}
                <tr style={{ backgroundColor: C.gray100, borderTop: `2px solid ${C.emerald600}` }}>
                  <td className="p-4 font-bold text-right uppercase tracking-wider" style={{ color: C.gray800 }}>Total</td>
                  <td className="p-4 text-center font-bold" style={{ color: C.gray800 }}>{maxPossibleScore}</td>
                  <td className="p-4 text-center font-bold text-xl" style={{ color: C.emerald600 }}>{totalScore}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Attendance Record */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4" style={{ color: C.emerald800 }}>Attendance Record</h2>
            <div className="flex gap-4">
              <div className="flex-1 p-6 rounded-xl text-center" style={{ backgroundColor: C.white, border: `2px solid ${C.emerald100}` }}>
                <p className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: C.gray400 }}>Present</p>
                <p className="text-3xl font-black" style={{ color: C.emerald600 }}>{present}</p>
              </div>
              <div className="flex-1 p-6 rounded-xl text-center" style={{ backgroundColor: C.white, border: `2px solid ${C.red100}` }}>
                <p className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: C.gray400 }}>Absent</p>
                <p className="text-3xl font-black" style={{ color: C.red600 }}>{absent}</p>
              </div>
              <div className="flex-1 p-6 rounded-xl text-center" style={{ backgroundColor: C.white, border: `2px solid ${C.amber100}` }}>
                <p className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: C.gray400 }}>Excused</p>
                <p className="text-3xl font-black" style={{ color: C.amber500 }}>{excused}</p>
              </div>
              <div className="flex-1 p-6 rounded-xl text-center shadow-md" style={{ backgroundColor: C.emerald600 }}>
                <p className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: C.emerald100 }}>Rate</p>
                <p className="text-3xl font-black" style={{ color: C.white }}>{attendancePercentage}%</p>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="mt-24 flex justify-between px-10">
            <div className="text-center w-64">
              <div className="h-8 mb-2" style={{ borderBottom: `2px solid ${C.gray800}` }}></div>
              <p className="text-sm font-bold uppercase tracking-wider" style={{ color: C.gray500 }}>Ustaz Signature</p>
            </div>
            <div className="text-center w-64">
              <div className="h-8 mb-2" style={{ borderBottom: `2px solid ${C.gray800}` }}></div>
              <p className="text-sm font-bold uppercase tracking-wider" style={{ color: C.gray500 }}>Parent/Guardian Signature</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 text-center pt-6" style={{ borderTop: `1px solid ${C.gray200}` }}>
            <p className="text-xs font-medium" style={{ color: C.gray400 }}>Generated automatically by the Medresa Management System</p>
          </div>

        </div>
      </div>
    </div>
  );
});

export default ReportCardTemplate;
