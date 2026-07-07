import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Helper to fetch and embed an image from a URL
async function fetchAndEmbedImage(pdfDoc, url) {
    if (!url) return null;
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // detect type
        if (url.toLowerCase().endsWith('.png') || url.includes('png')) {
            return await pdfDoc.embedPng(buffer);
        } else {
            return await pdfDoc.embedJpg(buffer);
        }
    } catch (e) {
        console.error("Failed to fetch image:", e);
        return null;
    }
}

export async function generateReportPDF(student, exams, scores, rank, totalStudents, ustazName, kitabName) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Colors mimicking the frontend tailwind classes
    const emerald600 = rgb(5 / 255, 150 / 255, 105 / 255);
    const emerald50 = rgb(236 / 255, 253 / 255, 245 / 255);
    const gray800 = rgb(31 / 255, 41 / 255, 55 / 255);
    const gray500 = rgb(107 / 255, 114 / 255, 128 / 255);
    const gray200 = rgb(229 / 255, 231 / 255, 235 / 255);
    const gray50 = rgb(249 / 255, 250 / 255, 251 / 255);

    let y = height - 60;

    // --- Header Section ---
    // Load Medresa Logo from frontend URL (works in both production and local)
    const LOGO_URL = process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/medresa_icon.jpg`
        : 'https://medresa-five.vercel.app/medresa_icon.jpg';
    
    const logoImage = await fetchAndEmbedImage(pdfDoc, LOGO_URL);
    if (logoImage) {
        page.drawImage(logoImage, { x: 40, y: y - 40, width: 60, height: 60 });
    }

    // Title
    page.drawText('ALI MEDRESA', { x: 120, y: y, size: 28, font: boldFont, color: emerald600 });
    page.drawText('STUDENT REPORT CARD', { x: 120, y: y - 20, size: 12, font: boldFont, color: gray500 });
    
    // Load Student Photo
    let photoImage = null;
    if (student.photo) {
        photoImage = await fetchAndEmbedImage(pdfDoc, student.photo);
    }
    
    // Draw photo box
    const photoWidth = 70;
    const photoHeight = 85;
    const photoX = width - 40 - photoWidth;
    const photoY = y - 65;
    
    page.drawRectangle({ x: photoX - 2, y: photoY - 2, width: photoWidth + 4, height: photoHeight + 4, borderColor: gray200, borderWidth: 1, color: gray50 });
    
    if (photoImage) {
        page.drawImage(photoImage, { x: photoX, y: photoY, width: photoWidth, height: photoHeight });
    } else {
        page.drawText('PHOTO', { x: photoX + 15, y: photoY + 40, size: 10, font: boldFont, color: gray200 });
    }

    // Date
    page.drawText('DATE ISSUED', { x: width - 180, y: y, size: 9, font: boldFont, color: gray500 });
    page.drawText(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), { x: width - 180, y: y - 15, size: 11, font: boldFont, color: gray800 });

    // Header border line
    y -= 90;
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 3, color: emerald600 });
    
    y -= 25;

    // --- Student Info Grid ---
    page.drawRectangle({ x: 40, y: y - 55, width: width - 80, height: 60, color: gray50, borderColor: gray200, borderWidth: 1 });
    
    // Column 1
    page.drawText('STUDENT NAME', { x: 55, y: y - 15, size: 9, font: boldFont, color: gray500 });
    page.drawText(student.fullName || 'N/A', { x: 55, y: y - 35, size: 14, font: boldFont, color: gray800 });
    
    // Column 2
    page.drawText('USTAZ', { x: 250, y: y - 15, size: 9, font: boldFont, color: gray500 });
    page.drawText(ustazName || student.assignedUstaz?.name || "N/A", { x: 250, y: y - 35, size: 14, font: boldFont, color: gray800 });
    
    // Column 3
    page.drawText('KITAB', { x: 400, y: y - 15, size: 9, font: boldFont, color: gray500 });
    page.drawText(kitabName || student.stream || "Kitab", { x: 400, y: y - 35, size: 14, font: font, color: gray800 });
    
    y -= 85;

    // --- Academic Performance ---
    page.drawText('Academic Performance', { x: 40, y: y, size: 14, font: boldFont, color: emerald600 });
    y -= 15;
    
    // Table Header
    page.drawRectangle({ x: 40, y: y - 25, width: width - 80, height: 25, color: emerald600 });
    page.drawText('EXAM', { x: 50, y: y - 17, size: 10, font: boldFont, color: rgb(1, 1, 1) });
    page.drawText('MAX SCORE', { x: 280, y: y - 17, size: 10, font: boldFont, color: rgb(1, 1, 1) });
    page.drawText('SCORE', { x: 450, y: y - 17, size: 10, font: boldFont, color: rgb(1, 1, 1) });
    y -= 25;

    let totalScore = 0;
    let maxPossibleScore = 0;
    
    if (exams.length === 0) {
        page.drawRectangle({ x: 40, y: y - 30, width: width - 80, height: 30, borderColor: gray200, borderWidth: 1 });
        page.drawText('No exams recorded.', { x: 250, y: y - 20, size: 10, font: font, color: gray500 });
        y -= 30;
    } else {
        exams.forEach((exam, index) => {
            const score = Number(scores[exam._id]) || 0;
            totalScore += score;
            maxPossibleScore += Number(exam.maxScore) || 100;
            
            const bgColor = index % 2 === 0 ? gray50 : rgb(1, 1, 1);
            page.drawRectangle({ x: 40, y: y - 30, width: width - 80, height: 30, color: bgColor, borderColor: gray200, borderWidth: 1 });
            
            page.drawText(exam.name || 'Unknown', { x: 50, y: y - 19, size: 11, font: boldFont, color: gray800 });
            page.drawText((exam.maxScore || 100).toString(), { x: 300, y: y - 19, size: 11, font: font, color: gray500 });
            page.drawText(score.toString(), { x: 460, y: y - 19, size: 12, font: boldFont, color: emerald600 });
            
            y -= 30;
        });
    }

    // Totals Row
    page.drawRectangle({ x: 40, y: y - 30, width: width - 80, height: 30, color: gray50, borderColor: emerald600, borderWidth: 1 });
    page.drawText('TOTAL', { x: 50, y: y - 19, size: 11, font: boldFont, color: gray800 });
    page.drawText(maxPossibleScore.toString(), { x: 300, y: y - 19, size: 11, font: boldFont, color: gray500 });
    page.drawText(totalScore.toString(), { x: 460, y: y - 19, size: 14, font: boldFont, color: emerald600 });
    y -= 30;
    
    // Rank Row
    page.drawRectangle({ x: 40, y: y - 30, width: width - 80, height: 30, color: emerald50, borderColor: emerald600, borderWidth: 1 });
    page.drawText('RANK', { x: 50, y: y - 19, size: 11, font: boldFont, color: emerald600 });
    page.drawText(rank ? `${rank} / ${totalStudents}` : 'N/A', { x: 450, y: y - 19, size: 12, font: boldFont, color: emerald600 });
    
    y -= 60;

    // --- Attendance Record ---
    page.drawText('Attendance Record', { x: 40, y: y, size: 14, font: boldFont, color: emerald600 });
    y -= 15;
    
    const present = student.presentCount || 0;
    const absent = student.absentCount || 0;
    const excused = student.excusedCount || 0;
    const totalDays = present + absent + excused;
    const attendancePercentage = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

    const boxWidth = (width - 110) / 4;
    
    // Present Box
    page.drawRectangle({ x: 40, y: y - 60, width: boxWidth, height: 60, color: rgb(1, 1, 1), borderColor: emerald50, borderWidth: 2 });
    page.drawText('PRESENT', { x: 40 + boxWidth/2 - 25, y: y - 20, size: 9, font: boldFont, color: gray500 });
    page.drawText(present.toString(), { x: 40 + boxWidth/2 - 10, y: y - 45, size: 20, font: boldFont, color: emerald600 });
    
    // Absent Box
    page.drawRectangle({ x: 40 + boxWidth + 10, y: y - 60, width: boxWidth, height: 60, color: rgb(1, 1, 1), borderColor: rgb(254/255, 226/255, 226/255), borderWidth: 2 });
    page.drawText('ABSENT', { x: 40 + boxWidth + 10 + boxWidth/2 - 20, y: y - 20, size: 9, font: boldFont, color: gray500 });
    page.drawText(absent.toString(), { x: 40 + boxWidth + 10 + boxWidth/2 - 10, y: y - 45, size: 20, font: boldFont, color: rgb(220/255, 38/255, 38/255) });
    
    // Excused Box
    page.drawRectangle({ x: 40 + (boxWidth + 10)*2, y: y - 60, width: boxWidth, height: 60, color: rgb(1, 1, 1), borderColor: rgb(254/255, 243/255, 199/255), borderWidth: 2 });
    page.drawText('EXCUSED', { x: 40 + (boxWidth + 10)*2 + boxWidth/2 - 25, y: y - 20, size: 9, font: boldFont, color: gray500 });
    page.drawText(excused.toString(), { x: 40 + (boxWidth + 10)*2 + boxWidth/2 - 10, y: y - 45, size: 20, font: boldFont, color: rgb(217/255, 119/255, 6/255) });
    
    // Rate Box
    page.drawRectangle({ x: 40 + (boxWidth + 10)*3, y: y - 60, width: boxWidth, height: 60, color: emerald600 });
    page.drawText('RATE', { x: 40 + (boxWidth + 10)*3 + boxWidth/2 - 15, y: y - 20, size: 9, font: boldFont, color: emerald50 });
    page.drawText(attendancePercentage + '%', { x: 40 + (boxWidth + 10)*3 + boxWidth/2 - 20, y: y - 45, size: 20, font: boldFont, color: rgb(1, 1, 1) });

    y -= 120;

    // Signatures
    page.drawLine({ start: { x: width - 200, y }, end: { x: width - 40, y }, thickness: 2, color: gray800 });
    page.drawText("Ustaz Signature", { x: width - 160, y: y - 15, size: 9, font: boldFont, color: gray500 });

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
}
