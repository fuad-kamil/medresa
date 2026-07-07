import TelegramBot from 'node-telegram-bot-api';
import Student from '../models/Student.js';
import Exam from '../models/Exam.js';
import Attendance from '../models/Attendance.js';
import crypto from 'crypto';
import { generateReportPDF } from '../utils/generateReportPDF.js';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const token = process.env.TELEGRAM_BOT_TOKEN;

// Helper: compute hash of scores (same as in reportController)
const computeScoresHash = (scores) => {
    const keys = Object.keys(scores).sort();
    let str = "";
    for (const k of keys) {
        str += `${k}:${scores[k]}|`;
    }
    return crypto.createHash('md5').update(str).digest('hex');
};

// Core logic: get or regenerate PDF for a student (mirrors processStudentReport in reportController)
const getOrGenerateReport = async (student) => {
    // Fetch Exams
    const ustazId = student.assignedUstaz?._id || student.assignedUstaz;
    let exams = [];
    if (ustazId) {
        exams = await Exam.find({ ustaz: ustazId }).sort({ createdAt: 1 });
    }

    // Attendance Stats
    const stats = await Attendance.aggregate([
        { $match: { student: student._id } },
        {
            $group: {
                _id: null,
                presentCount: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
                absentCount: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
                excusedCount: { $sum: { $cond: [{ $eq: ['$status', 'excused'] }, 1, 0] } }
            }
        }
    ]);

    student.presentCount = stats[0]?.presentCount || 0;
    student.absentCount = stats[0]?.absentCount || 0;
    student.excusedCount = stats[0]?.excusedCount || 0;

    // Convert examScores Map to plain object
    const plainScores = {};
    if (student.examScores) {
        for (const [key, value] of student.examScores.entries()) {
            plainScores[key] = value;
        }
    }

    const currentHash = computeScoresHash(plainScores);

    // Hash match → return existing URL instantly
    if (student.reportCardUrl && student.reportScoresHash === currentHash) {
        return student.reportCardUrl;
    }

    // Hash mismatch (or no PDF yet) → regenerate
    const allUstazStudents = await Student.find({ assignedUstaz: ustazId });
    const studentsWithTotals = allUstazStudents.map(s => {
        let total = 0;
        if (s.examScores) {
            exams.forEach(ex => {
                total += Number(s.examScores.get(ex._id.toString())) || 0;
            });
        }
        return { id: s._id.toString(), total };
    }).sort((a, b) => b.total - a.total);

    const rankIndex = studentsWithTotals.findIndex(s => s.id === student._id.toString());
    const rank = rankIndex >= 0 ? rankIndex + 1 : null;
    const totalStudents = allUstazStudents.length;

    const ustazName = student.assignedUstaz?.name;
    const kitabName = student.assignedUstaz?.kitabName || student.stream;

    const pdfBytes = await generateReportPDF(student, exams, plainScores, rank, totalStudents, ustazName, kitabName);

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'medresa/report_cards',
                resource_type: 'raw',
                format: 'pdf',
                public_id: `report_${student._id}_${Date.now()}`
            },
            async (error, result) => {
                if (error) return reject(error);

                if (student.reportCardPublicId) {
                    try {
                        await cloudinary.uploader.destroy(student.reportCardPublicId, { resource_type: 'raw' });
                    } catch (e) {
                        console.error('Failed to delete old PDF:', e);
                    }
                }

                student.reportCardUrl = result.secure_url;
                student.reportCardPublicId = result.public_id;
                student.reportScoresHash = currentHash;
                student.reportCardGeneratedAt = new Date();
                await student.save();

                resolve(result.secure_url);
            }
        );
        uploadStream.end(Buffer.from(pdfBytes));
    });
};

let bot = null;

if (token && token !== 'your_bot_token_here') {
    bot = new TelegramBot(token, { polling: true });

    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        bot.sendMessage(
            chatId,
            "Assalamu Alaikum! Welcome to Ali Medresa Bot. 📚\n\nPlease send your registered phone number (e.g. 0911234567) to receive your child's report card."
        );
    });

    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text?.trim();

        if (!text || text.startsWith('/')) return;

        // Normalize phone: support +251XXXXXXXXX → 0XXXXXXXXX
        let phone = text.replace(/\s+/g, '');
        if (phone.startsWith('+251') && phone.length === 13) {
            phone = '0' + phone.slice(4);
        }

        try {
            await bot.sendMessage(chatId, "🔍 Looking up your phone number...");

            const students = await Student.find({
                $or: [
                    { fatherPhone: phone },
                    { motherPhone: phone }
                ]
            }).populate('assignedUstaz');

            if (students.length === 0) {
                bot.sendMessage(
                    chatId,
                    "❌ Sorry, we couldn't find a student registered with this phone number.\n\nPlease check the number and try again, or contact the school."
                );
                return;
            }

            await bot.sendMessage(chatId, `✅ Found ${students.length} student(s). Generating report card(s)... this may take a moment.`);

            for (const student of students) {
                try {
                    const pdfUrl = await getOrGenerateReport(student);
                    await bot.sendDocument(chatId, pdfUrl, {
                        caption: `📄 Report Card for *${student.fullName}*`,
                        parse_mode: 'Markdown'
                    });
                } catch (err) {
                    console.error(`Bot: Failed to generate report for ${student.fullName}:`, err);
                    await bot.sendMessage(chatId, `⚠️ Could not generate report for ${student.fullName}. Please contact the school.`);
                }
            }
        } catch (error) {
            console.error("Telegram Bot Error:", error);
            bot.sendMessage(chatId, "⚠️ An error occurred while fetching the report card. Please try again later.");
        }
    });

    console.log("✅ Telegram Bot started successfully.");
} else {
    console.warn("⚠️  TELEGRAM_BOT_TOKEN is not set. Telegram Bot will not start.");
}

export default bot;
