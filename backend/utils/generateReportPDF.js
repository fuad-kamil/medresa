import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function generateReportPDF(student, exams, scores, rank, totalStudents, ustazName, kitabName) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let y = height - 50;

    // Header
    page.drawText('ALI MEDRESA', { x: 50, y, size: 24, font: boldFont, color: rgb(0, 0.5, 0) });
    y -= 20;
    page.drawText('Student Report Card', { x: 50, y, size: 14, font: font, color: rgb(0.3, 0.3, 0.3) });
    
    y -= 40;
    
    // Student Info
    page.drawText(`Student Name: ${student.fullName || 'N/A'}`, { x: 50, y, size: 12, font: boldFont });
    page.drawText(`Ustaz: ${ustazName || student.assignedUstaz?.name || 'N/A'}`, { x: 300, y, size: 12, font: boldFont });
    y -= 20;
    page.drawText(`Kitab: ${kitabName || student.stream || 'Kitab'}`, { x: 50, y, size: 12, font: boldFont });
    page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 300, y, size: 12, font: boldFont });
    
    y -= 40;

    // Academic Performance
    page.drawText('Academic Performance', { x: 50, y, size: 16, font: boldFont, color: rgb(0, 0.4, 0) });
    y -= 20;
    
    // Table Header
    page.drawText('Exam', { x: 50, y, size: 12, font: boldFont });
    page.drawText('Max Score', { x: 250, y, size: 12, font: boldFont });
    page.drawText('Score', { x: 400, y, size: 12, font: boldFont });
    y -= 10;
    page.drawLine({ start: { x: 50, y }, end: { x: 500, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
    y -= 15;

    let totalScore = 0;
    let maxPossibleScore = 0;
    
    if (exams.length === 0) {
        page.drawText('No exams recorded.', { x: 50, y, size: 12, font });
        y -= 20;
    } else {
        exams.forEach(exam => {
            const score = Number(scores[exam._id]) || 0;
            totalScore += score;
            maxPossibleScore += Number(exam.maxScore) || 100;
            
            page.drawText(exam.name || 'Unknown', { x: 50, y, size: 12, font });
            page.drawText((exam.maxScore || 100).toString(), { x: 250, y, size: 12, font });
            page.drawText(score.toString(), { x: 400, y, size: 12, font: boldFont });
            
            y -= 20;
        });
    }

    y -= 10;
    page.drawLine({ start: { x: 50, y }, end: { x: 500, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
    y -= 15;
    
    // Totals
    page.drawText('TOTAL', { x: 50, y, size: 12, font: boldFont });
    page.drawText(maxPossibleScore.toString(), { x: 250, y, size: 12, font: boldFont });
    page.drawText(totalScore.toString(), { x: 400, y, size: 14, font: boldFont, color: rgb(0, 0.5, 0) });
    y -= 25;
    
    page.drawText(`Rank: ${rank ? `${rank} / ${totalStudents}` : 'N/A'}`, { x: 50, y, size: 12, font: boldFont });
    
    y -= 50;

    // Attendance Record
    page.drawText('Attendance Record', { x: 50, y, size: 16, font: boldFont, color: rgb(0, 0.4, 0) });
    y -= 20;
    
    const present = student.presentCount || 0;
    const absent = student.absentCount || 0;
    const excused = student.excusedCount || 0;
    const totalDays = present + absent + excused;
    const attendancePercentage = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

    page.drawText(`Present: ${present}`, { x: 50, y, size: 12, font });
    page.drawText(`Absent: ${absent}`, { x: 150, y, size: 12, font });
    page.drawText(`Excused: ${excused}`, { x: 250, y, size: 12, font });
    page.drawText(`Rate: ${attendancePercentage}%`, { x: 350, y, size: 12, font: boldFont });

    // Return the PDF bytes
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
}
