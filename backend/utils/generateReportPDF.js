import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

// Helper to fetch bytes from a URL
async function fetchBytes(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        return Buffer.from(await response.arrayBuffer());
    } catch (e) {
        console.error(`Failed to fetch: ${url}`, e.message);
        return null;
    }
}

// Helper to embed an image from URL
async function fetchAndEmbedImage(pdfDoc, url) {
    if (!url) return null;
    try {
        const buffer = await fetchBytes(url);
        if (!buffer) return null;
        if (url.toLowerCase().includes('.png') || url.toLowerCase().includes('png')) {
            return await pdfDoc.embedPng(buffer);
        } else {
            return await pdfDoc.embedJpg(buffer);
        }
    } catch (e) {
        console.error("Failed to embed image:", e.message);
        return null;
    }
}

// Cached font bytes to avoid re-downloading on every request
let cachedEthiopicFontBytes = null;
let cachedArabicFontBytes = null;

async function getEthiopicFont() {
    if (cachedEthiopicFontBytes) return cachedEthiopicFontBytes;
    // Noto Sans Ethiopic from Google Fonts CDN
    const FONT_URL = 'https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansEthiopic/NotoSansEthiopic-Regular.ttf';
    cachedEthiopicFontBytes = await fetchBytes(FONT_URL);
    return cachedEthiopicFontBytes;
}

async function getArabicFont() {
    if (cachedArabicFontBytes) return cachedArabicFontBytes;
    // Noto Naskh Arabic font for Arabic support
    const FONT_URL = 'https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoNaskhArabic/NotoNaskhArabic-Bold.ttf';
    cachedArabicFontBytes = await fetchBytes(FONT_URL);
    return cachedArabicFontBytes;
}

export async function generateReportPDF(student, exams, scores, rank, totalStudents, ustazName, kitabName) {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();

    // Embed standard font for English/numbers (always available)
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Embed Ethiopic font for Amharic labels
    let amFont = boldFont; // fallback
    const ethiopicBytes = await getEthiopicFont();
    if (ethiopicBytes) {
        try {
            amFont = await pdfDoc.embedFont(ethiopicBytes);
        } catch (e) {
            console.error("Failed to embed Ethiopic font:", e.message);
        }
    }

    // Embed Arabic font
    let arFont = boldFont; // fallback
    const arabicBytes = await getArabicFont();
    if (arabicBytes) {
        try {
            arFont = await pdfDoc.embedFont(arabicBytes);
        } catch (e) {
            console.error("Failed to embed Arabic font:", e.message);
        }
    }

    // Colors matching the frontend
    const emerald600 = rgb(5 / 255, 150 / 255, 105 / 255);
    const emerald50  = rgb(236 / 255, 253 / 255, 245 / 255);
    const gray800    = rgb(31 / 255, 41 / 255, 55 / 255);
    const gray500    = rgb(107 / 255, 114 / 255, 128 / 255);
    const gray200    = rgb(229 / 255, 231 / 255, 235 / 255);
    const gray50     = rgb(249 / 255, 250 / 255, 251 / 255);
    const white      = rgb(1, 1, 1);

    let y = height - 60;

    // ── HEADER ──────────────────────────────────────────────
    // Logo
    const LOGO_URL = process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/medresa_icon.jpg`
        : 'https://medresa-five.vercel.app/medresa_icon.jpg';
    const logoImage = await fetchAndEmbedImage(pdfDoc, LOGO_URL);
    if (logoImage) {
        page.drawImage(logoImage, { x: 40, y: y - 40, width: 60, height: 60 });
    }

    // Arabic title مدرسة علي (Hardcoded reshaped and reversed for RTL rendering)
    // ﻲﻠﻋ ﺔﺳﺭﺪﻣ
    page.drawText('\uFEF2\uFEDE\uFEEB \uFE94\uFEB3\uFEAE\uFEA9\uFEE3', { x: 120, y: y, size: 26, font: arFont, color: emerald600 });
    
    // የተማሪ ዉጤት ካርድ
    page.drawText('\u12E8\u1270\u121B\u122A \u12CD\u1324\u1275 \u12AB\u122D\u12F5', { x: 120, y: y - 24, size: 11, font: amFont, color: gray500 }); 

    // Student Photo
    let photoImage = null;
    if (student.photo) {
        photoImage = await fetchAndEmbedImage(pdfDoc, student.photo);
    }
    const photoWidth = 70;
    const photoHeight = 85;
    const photoX = width - 40 - photoWidth;
    const photoY = y - 65;
    page.drawRectangle({ x: photoX - 2, y: photoY - 2, width: photoWidth + 4, height: photoHeight + 4, borderColor: gray200, borderWidth: 1, color: gray50 });
    if (photoImage) {
        page.drawImage(photoImage, { x: photoX, y: photoY, width: photoWidth, height: photoHeight });
    } else {
        page.drawText('PHOTO', { x: photoX + 12, y: photoY + 38, size: 10, font: boldFont, color: gray200 });
    }

    // Date
    const dateLabel = '\u12E8\u1270\u1230\u1320\u1260\u1275 \u1240\u1295'; // የተሰጠበት ቀን
    page.drawText(dateLabel, { x: width - 185, y: y, size: 9, font: amFont, color: gray500 });
    page.drawText(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), {
        x: width - 185, y: y - 16, size: 10, font: boldFont, color: gray800
    });

    // Header divider
    y -= 95;
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 3, color: emerald600 });
    y -= 25;

    // ── STUDENT INFO GRID ────────────────────────────────────
    page.drawRectangle({ x: 40, y: y - 58, width: width - 80, height: 63, color: gray50, borderColor: gray200, borderWidth: 1 });

    // Col 1 — Name
    page.drawText('\u12E8\u1270\u121B\u122A \u1235\u121D', { x: 55, y: y - 14, size: 8.5, font: amFont, color: gray500 }); // የተማሪ ስም
    page.drawText(student.fullName || 'N/A', { x: 55, y: y - 35, size: 13, font: boldFont, color: gray800 });

    // Col 2 — Ustaz
    page.drawText('\u12A8\u12A1\u1235\u1273\u12DD', { x: 248, y: y - 14, size: 8.5, font: amFont, color: gray500 }); // ከኡስታዝ
    page.drawText(ustazName || student.assignedUstaz?.name || 'N/A', { x: 248, y: y - 35, size: 13, font: boldFont, color: gray800 });

    // Col 3 — Kitab
    page.drawText('\u12E8\u12AA\u1273\u1265 \u1235\u121D', { x: 400, y: y - 14, size: 8.5, font: amFont, color: gray500 }); // የኪታብ ስም
    page.drawText(kitabName || student.stream || 'Kitab', { x: 400, y: y - 35, size: 12, font: font, color: gray800 });

    y -= 88;

    // ── ACADEMIC PERFORMANCE ─────────────────────────────────
    page.drawText('\u12E8\u1275\u121D\u1205\u122D\u1275 \u12CD\u1324\u1275', { x: 40, y: y, size: 13, font: amFont, color: emerald600 }); // የትምህርት ውጤት
    y -= 14;

    // Table header row
    page.drawRectangle({ x: 40, y: y - 26, width: width - 80, height: 26, color: emerald600 });
    page.drawText('EXAM',      { x: 50,  y: y - 17, size: 9.5, font: boldFont, color: white });
    page.drawText('MAX SCORE', { x: 280, y: y - 17, size: 9.5, font: boldFont, color: white });
    page.drawText('SCORE',     { x: 452, y: y - 17, size: 9.5, font: boldFont, color: white });
    y -= 26;

    let totalScore = 0;
    let maxPossibleScore = 0;

    if (exams.length === 0) {
        page.drawRectangle({ x: 40, y: y - 30, width: width - 80, height: 30, borderColor: gray200, borderWidth: 1 });
        page.drawText('No exams recorded.', { x: 210, y: y - 19, size: 10, font: font, color: gray500 });
        y -= 30;
    } else {
        exams.forEach((exam, index) => {
            const score = Number(scores[exam._id]) || 0;
            totalScore += score;
            maxPossibleScore += Number(exam.maxScore) || 100;
            const bgColor = index % 2 === 0 ? gray50 : white;
            page.drawRectangle({ x: 40, y: y - 30, width: width - 80, height: 30, color: bgColor, borderColor: gray200, borderWidth: 1 });
            page.drawText(exam.name || 'Unknown', { x: 50,  y: y - 19, size: 10.5, font: boldFont, color: gray800 });
            page.drawText((exam.maxScore || 100).toString(), { x: 300, y: y - 19, size: 10.5, font: font, color: gray500 });
            page.drawText(score.toString(),                   { x: 460, y: y - 19, size: 11,   font: boldFont, color: emerald600 });
            y -= 30;
        });
    }

    // Total row — ድምር
    page.drawRectangle({ x: 40, y: y - 30, width: width - 80, height: 30, color: gray50, borderColor: emerald600, borderWidth: 1 });
    page.drawText('\u12F5\u121D\u122D', { x: 50, y: y - 19, size: 10.5, font: amFont, color: gray800 }); // ድምር
    page.drawText(maxPossibleScore.toString(), { x: 300, y: y - 19, size: 10.5, font: boldFont, color: gray500 });
    page.drawText(totalScore.toString(),       { x: 460, y: y - 19, size: 13,   font: boldFont, color: emerald600 });
    y -= 30;

    // Rank row — ደረጃ
    page.drawRectangle({ x: 40, y: y - 30, width: width - 80, height: 30, color: emerald50, borderColor: emerald600, borderWidth: 1 });
    page.drawText('\u12F0\u122C\u1303', { x: 50, y: y - 19, size: 10.5, font: amFont, color: emerald600 }); // ደረጃ
    page.drawText(rank ? `${rank} / ${totalStudents}` : 'N/A', { x: 450, y: y - 19, size: 11, font: boldFont, color: emerald600 });
    y -= 55;

    // ── ATTENDANCE ───────────────────────────────────────────
    page.drawText('\u12E8\u12A0\u1274\u1295\u12F3\u1295\u1235 \u12DD\u122D\u12DC\u122D', { x: 40, y: y, size: 13, font: amFont, color: emerald600 }); // የአቴንዳንስ ዝርዝር
    y -= 14;

    const present = student.presentCount || 0;
    const absent  = student.absentCount  || 0;
    const excused = student.excusedCount || 0;
    const totalDays = present + absent + excused;
    const attendancePercentage = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

    const bw = (width - 110) / 4;

    // Present — የመጣበት
    page.drawRectangle({ x: 40, y: y - 62, width: bw, height: 62, color: white, borderColor: rgb(167/255, 243/255, 208/255), borderWidth: 2 });
    page.drawText('\u12E8\u1218\u1323\u1260\u1275', { x: 40 + bw/2 - 24, y: y - 18, size: 8.5, font: amFont, color: gray500 }); // የመጣበት
    page.drawText(present.toString(), { x: 40 + bw/2 - 8, y: y - 46, size: 22, font: boldFont, color: emerald600 });

    // Absent — የቀረበት
    page.drawRectangle({ x: 40 + bw + 10, y: y - 62, width: bw, height: 62, color: white, borderColor: rgb(254/255, 202/255, 202/255), borderWidth: 2 });
    page.drawText('\u12E8\u1240\u1228\u1260\u1275', { x: 40 + bw + 10 + bw/2 - 24, y: y - 18, size: 8.5, font: amFont, color: gray500 }); // የቀረበት
    page.drawText(absent.toString(), { x: 40 + bw + 10 + bw/2 - 8, y: y - 46, size: 22, font: boldFont, color: rgb(220/255, 38/255, 38/255) });

    // Excused — ፍቃድ
    page.drawRectangle({ x: 40 + (bw+10)*2, y: y - 62, width: bw, height: 62, color: white, borderColor: rgb(253/255, 230/255, 138/255), borderWidth: 2 });
    page.drawText('\u134D\u1243\u12F5', { x: 40 + (bw+10)*2 + bw/2 - 14, y: y - 18, size: 8.5, font: amFont, color: gray500 }); // ፍቃድ
    page.drawText(excused.toString(), { x: 40 + (bw+10)*2 + bw/2 - 8, y: y - 46, size: 22, font: boldFont, color: rgb(217/255, 119/255, 6/255) });

    // Rate
    page.drawRectangle({ x: 40 + (bw+10)*3, y: y - 62, width: bw, height: 62, color: emerald600 });
    page.drawText('RATE', { x: 40 + (bw+10)*3 + bw/2 - 16, y: y - 18, size: 9, font: boldFont, color: emerald50 });
    page.drawText(`${attendancePercentage}%`, { x: 40 + (bw+10)*3 + bw/2 - 18, y: y - 46, size: 22, font: boldFont, color: white });

    y -= 115;

    // ── SIGNATURE ────────────────────────────────────────────
    page.drawLine({ start: { x: width - 205, y }, end: { x: width - 40, y }, thickness: 1.5, color: gray800 });
    page.drawText('\u12E8\u12A1\u1235\u1273\u12DD \u134D\u122D\u121B', { x: width - 185, y: y - 16, size: 9, font: amFont, color: gray500 }); // የኡስታዝ ፊርማ

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
}
