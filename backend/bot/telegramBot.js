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

// Helper: compute hash of scores
const computeScoresHash = (scores) => {
    const keys = Object.keys(scores).sort();
    let str = "";
    for (const k of keys) {
        str += `${k}:${scores[k]}|`;
    }
    return crypto.createHash('md5').update(str).digest('hex');
};

// Core logic: get or regenerate PDF for a student
const getOrGenerateReport = async (student) => {
    const ustazId = student.assignedUstaz?._id || student.assignedUstaz;
    let exams = [];
    if (ustazId) {
        exams = await Exam.find({ ustaz: ustazId }).sort({ createdAt: 1 });
    }

    const stats = await Attendance.aggregate([
        { $match: { student: student._id } },
        {
            $group: {
                _id: null,
                presentCount: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
                absentCount:  { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
                excusedCount: { $sum: { $cond: [{ $eq: ['$status', 'excused'] }, 1, 0] } }
            }
        }
    ]);

    student.presentCount = stats[0]?.presentCount || 0;
    student.absentCount  = stats[0]?.absentCount  || 0;
    student.excusedCount = stats[0]?.excusedCount || 0;

    const plainScores = {};
    if (student.examScores) {
        for (const [key, value] of student.examScores.entries()) {
            plainScores[key] = value;
        }
    }

    const currentHash = computeScoresHash(plainScores);

    // Hash match → fetch existing PDF from Cloudinary
    if (student.reportCardUrl && student.reportScoresHash === currentHash) {
        try {
            const response = await fetch(student.reportCardUrl);
            if (!response.ok) throw new Error(`Cloudinary responded with ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();
            return { type: 'buffer', data: Buffer.from(arrayBuffer) };
        } catch (error) {
            console.error('Failed to fetch existing PDF from Cloudinary, falling back to regeneration:', error);
        }
    }

    // Report not yet released by Admin/Ustaz
    if (!student.reportCardUrl) {
        throw new Error("NOT_RELEASED");
    }

    // Hash mismatch → regenerate
    console.log(`Generating fresh PDF for ${student.fullName} due to score update...`);
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

    const ustazName  = student.assignedUstaz?.name;
    const kitabName  = student.assignedUstaz?.kitabName || student.stream;

    const pdfBytes  = await generateReportPDF(student, exams, plainScores, rank, totalStudents, ustazName, kitabName);
    const pdfBuffer = Buffer.from(pdfBytes);

    await new Promise((resolve, reject) => {
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

                student.reportCardUrl        = result.secure_url;
                student.reportCardPublicId   = result.public_id;
                student.reportScoresHash     = currentHash;
                student.reportCardGeneratedAt = new Date();
                await student.save();

                resolve();
            }
        );
        uploadStream.end(pdfBuffer);
    });

    return { type: 'buffer', data: pdfBuffer };
};

// ─── Handle a single incoming Telegram message ────────────────────────────────
const handleMessage = async (bot, msg) => {
    const chatId = msg.chat.id;
    const text   = msg.text?.trim();

    if (!text) return;

    // /start command
    if (text.startsWith('/start')) {
        const welcomeMessage =
            `እንኳን ወደ አሊ መድረሳ ቦት በደህና መጡ። 📚\n\nእባክዎ የተመዘገበውን ስልክ ቁጥር (ለምሳሌ 0911234567) ይላኩ የሪፖርት ካርድዎን ለማግኘት።`;
        await bot.sendMessage(chatId, welcomeMessage);
        return;
    }

    if (text.startsWith('/')) return; // ignore other commands

    // Normalize phone: +251XXXXXXXXX → 0XXXXXXXXX
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
            await bot.sendMessage(
                chatId,
                "❌ Sorry, we couldn't find a student registered with this phone number.\n\nPlease check the number and try again, or contact the school."
            );
            return;
        }

        await bot.sendMessage(chatId, `✅ Found ${students.length} student(s). Generating report card(s)... this may take a moment.`);

        for (const student of students) {
            try {
                const report = await getOrGenerateReport(student);

                await bot.sendDocument(
                    chatId,
                    report.data,
                    { caption: `📄 Report Card for ${student.fullName}` },
                    { filename: `Report_Card_${student.fullName.replace(/\s+/g, '_')}.pdf`, contentType: 'application/pdf' }
                );
            } catch (err) {
                console.error(`Bot: Failed to generate report for ${student.fullName}:`, err);
                if (err.message === "NOT_RELEASED") {
                    await bot.sendMessage(chatId, `⚠️ The report card for ${student.fullName} has not been released yet. Please wait for the school to send it.`);
                } else {
                    await bot.sendMessage(chatId, `⚠️ Could not generate report for ${student.fullName}. Error: ${err.message}`);
                }
            }
        }
    } catch (error) {
        console.error("Telegram Bot Error:", error);
        await bot.sendMessage(chatId, "⚠️ An error occurred while fetching the report card. Please try again later.");
    }
};

// ─── Bot initialisation ───────────────────────────────────────────────────────
let bot = null;

/**
 * Initialise the bot in webhook mode (for Render/production) or polling mode
 * (for local development when RENDER_EXTERNAL_URL is not set).
 *
 * @param {import('express').Application} app  Express app – needed to mount the webhook route
 */
export function initBot(app) {
    if (!token || token === 'your_bot_token_here') {
        console.warn("⚠️  TELEGRAM_BOT_TOKEN is not set. Telegram Bot will not start.");
        return null;
    }

    // Render sets RENDER_EXTERNAL_URL automatically, e.g. https://ali-medresa.onrender.com
    const renderUrl = process.env.RENDER_EXTERNAL_URL;

    if (renderUrl) {
        // ── WEBHOOK MODE (production on Render) ──────────────────────────────
        // We do NOT pass `polling` here, so the library does not open any
        // long-lived connection.  Telegram will POST updates to our webhook URL.
        bot = new TelegramBot(token, { webHook: false });

        const webhookPath   = `/bot${token}`;
        const webhookUrl    = `${renderUrl}${webhookPath}`;

        // Mount the webhook route on the Express app BEFORE setting the webhook
        app.post(webhookPath, (req, res) => {
            bot.processUpdate(req.body);
            res.sendStatus(200);
        });

        // Register the webhook with Telegram (fire-and-forget with retry)
        const registerWebhook = async (attempt = 1) => {
            try {
                await bot.setWebHook(webhookUrl);
                console.log(`✅ Telegram webhook set: ${webhookUrl}`);
            } catch (err) {
                console.error(`❌ Failed to set Telegram webhook (attempt ${attempt}):`, err.message);
                if (attempt < 5) {
                    const delay = attempt * 5000; // 5 s, 10 s, 15 s …
                    console.log(`   Retrying in ${delay / 1000}s…`);
                    setTimeout(() => registerWebhook(attempt + 1), delay);
                }
            }
        };
        registerWebhook();

        console.log("✅ Telegram Bot started in WEBHOOK mode.");
    } else {
        // ── POLLING MODE (local development only) ────────────────────────────
        bot = new TelegramBot(token, { polling: true });

        bot.on('polling_error', (err) => {
            console.error('Telegram polling error:', err.message);
        });

        console.log("✅ Telegram Bot started in POLLING mode (local dev).");
    }

    // ── Attach message handler ────────────────────────────────────────────────
    bot.on('message', (msg) => handleMessage(bot, msg));

    return bot;
}

export default bot;
