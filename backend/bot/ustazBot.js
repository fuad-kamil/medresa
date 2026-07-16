import TelegramBot from 'node-telegram-bot-api';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import Notification from '../models/Notification.js';
import sendEmail from '../utils/sendEmail.js';
import buildAbsenceEmail from '../utils/absenceEmailTemplate.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.USTAZ_BOT_TOKEN;

// Temporary in-memory states
const userStates = new Map(); // chatId -> { step: 'email' | 'password', email: String, datePromptMessageId: Number }
const activeSessions = new Map(); // chatId -> { date: String, students: [{ id, fullName, status }], messageId: Number }
const activePolls = new Map(); // pollId -> { chatId: Number, date: String, students: [{ id, fullName }] }

// Helper: Check 3 consecutive absences and trigger notifications/emails
async function checkConsecutiveAbsences(studentIds) {
    for (const studentId of studentIds) {
        try {
            const recentRecords = await Attendance.find({ student: studentId })
                .sort({ date: -1 })
                .limit(10);

            const uniqueDays = [];
            const seenDates = new Set();

            for (const record of recentRecords) {
                const dayStr = new Date(record.date).toISOString().split('T')[0];
                if (!seenDates.has(dayStr)) {
                    seenDates.add(dayStr);
                    uniqueDays.push(record);
                }
                if (uniqueDays.length === 3) break;
            }

            if (
                uniqueDays.length === 3 &&
                uniqueDays.every(att => att.status === 'absent')
            ) {
                const student = await Student.findById(studentId).populate('assignedUstaz');
                if (!student) continue;

                const ustazName = student.assignedUstaz ? student.assignedUstaz.name : "Unassigned";
                const recipient = process.env.ALERT_EMAIL_RECIPIENT || process.env.EMAIL_USER;
                const emailContent = buildAbsenceEmail(student, ustazName);

                await sendEmail({
                    to: recipient,
                    subject: emailContent.subject,
                    text: emailContent.text,
                    html: emailContent.html,
                });

                try {
                    const recent = await Notification.findOne({
                        studentId: student._id,
                        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                    });
                    if (!recent) {
                        await Notification.create({
                            studentId: student._id,
                            studentName: student.fullName,
                            ustazId: student.assignedUstaz._id,
                            ustazName,
                            message: `ተማሪ ${student.fullName} ከኡስታዝ ${ustazName} ትምህርት 3 ተከታታይ ቀናት ቀርቷል።`
                        });
                    }
                } catch (notifErr) {
                    console.error('Failed to create notification:', notifErr);
                }
            }
        } catch (err) {
            console.error(`Error in checkConsecutiveAbsences for student ${studentId}:`, err);
        }
    }
}

// Helper: Calculate the last 4 valid teaching dates for an Ustaz
function getValidDates(user) {
    const teachingDays = user.teachingDays || [0, 1, 2, 3, 4, 5, 6];
    const teachingDaysSet = new Set(teachingDays);
    const days = [];
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    // Get dates in local timezone offset string format YYYY-MM-DD
    while (days.length < 4) {
        if (teachingDaysSet.has(cursor.getDay())) {
            const offsetDate = new Date(cursor.getTime() - (cursor.getTimezoneOffset() * 60000));
            days.push(offsetDate.toISOString().split('T')[0]);
        }
        cursor.setDate(cursor.getDate() - 1);
    }
    return days;
}

// ─── Welcome Menu Keyboard ───────────────────────────────────────────────────
const sendWelcomeMenu = async (bot, chatId, ustaz) => {
    const webAppUrl = `${process.env.FRONTEND_URL || 'https://medresa-five.vercel.app'}/telegram-attendance`;
    
    await bot.sendMessage(
        chatId,
        `እንኳን ደህና መጡ ኡስታዝ ${ustaz.name}! 📚\nWelcome Ustaz ${ustaz.name}!\n\nእባክዎ የተማሪዎችን ክትትል ለመውሰድ ከታች ካሉት አማራጮች አንዱን ይምረጡ።\nPlease choose one of the options below to take attendance.`,
        {
            reply_markup: {
                keyboard: [
                    [
                        { text: "Take Attendance (Mini App) 📱", web_app: { url: webAppUrl } }
                    ],
                    [
                        { text: "Interactive Grid (Chat) 💬" },
                        { text: "Native Poll (Pool) 🗳️" }
                    ],
                    [
                        { text: "My Profile 👤" },
                        { text: "Logout 🔓" }
                    ]
                ],
                resize_keyboard: true
            }
        }
    );
};

// ─── Text Handlers ────────────────────────────────────────────────────────────
const handleMessage = async (bot, msg) => {
    const chatId = msg.chat.id;
    const text   = msg.text?.trim();
    if (!text) return;

    // Check if user is linked
    const ustaz = await User.findOne({ telegramChatId: chatId.toString() });

    // Handle ongoing login state first
    if (userStates.has(chatId)) {
        const state = userStates.get(chatId);
        
        if (state.step === 'email') {
            const email = text.toLowerCase().trim();
            userStates.set(chatId, { step: 'password', email });
            await bot.sendMessage(chatId, "🔐 እባክዎ የይለፍ ቃልዎን ያስገቡ (በጥቂት ሰከንዶች ውስጥ ከዚህ ቻት ይሰረዛል)፦\nPlease enter your password (it will be deleted from chat history for security):");
            return;
        }

        if (state.step === 'password') {
            const password = text;
            
            // Delete password message for security
            try {
                await bot.deleteMessage(chatId, msg.message_id);
            } catch (err) {
                console.error("Failed to delete password message:", err.message);
            }

            await bot.sendMessage(chatId, "🔑 በሂደት ላይ ነው...");
            
            try {
                const user = await User.findOne({ email: state.email });
                if (!user) {
                    userStates.delete(chatId);
                    await bot.sendMessage(chatId, "❌ የተሳሳተ ኢሜይል ወይም የይለፍ ቃል! እባክዎ እንደገና ይሞክሩ።\nInvalid credentials! Please start again with /start.");
                    return;
                }

                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) {
                    userStates.delete(chatId);
                    await bot.sendMessage(chatId, "❌ የተሳሳተ ኢሜይል ወይም የይለፍ ቃል! እባክዎ እንደገና ይሞክሩ።\nInvalid credentials! Please start again with /start.");
                    return;
                }

                if (user.role !== 'ustaz' && user.role !== 'admin') {
                    userStates.delete(chatId);
                    await bot.sendMessage(chatId, "❌ ይህ መለያ ክትትል የመውሰድ ፍቃድ የለውም።\nThis account does not have teacher privileges.");
                    return;
                }

                if (!user.isApproved) {
                    userStates.delete(chatId);
                    await bot.sendMessage(chatId, "⏳ መለያዎ በአስተዳዳሪው እስኪጸድቅ ድረስ እባክዎ ይጠብቁ።\nYour account is not approved by admin yet.");
                    return;
                }

                // Link Telegram Chat ID
                user.telegramChatId = chatId.toString();
                await user.save();

                userStates.delete(chatId);
                await bot.sendMessage(chatId, "🎉 በተሳካ ሁኔታ ተገናኝቷል! መለያዎ አሁን ከዚህ ቻት ጋር ተጣምሯል።\nSuccessfully linked! Your account is now paired with this Telegram bot.");
                await sendWelcomeMenu(bot, chatId, user);
            } catch (err) {
                console.error("Login verification failed:", err);
                userStates.delete(chatId);
                await bot.sendMessage(chatId, "❌ ስህተት ተከስቷል። እባክዎ እንደገና ይሞክሩ።\nAn error occurred. Please try again.");
            }
            return;
        }
    }

    // Standard commands/buttons
    if (text.startsWith('/start')) {
        if (ustaz) {
            await sendWelcomeMenu(bot, chatId, ustaz);
        } else {
            await bot.sendMessage(
                chatId,
                "እንኳን ወደ ዓሊ መድረሳ የኡስታዞች ክትትል መመዝገቢያ ቦት በደህና መጡ! 📚\n\nWelcome to the Ali Medresa Ustaz Attendance Bot!\n\nእባክዎ በመጀመሪያ በዌብሳይቱ ላይ የሚጠቀሙበትን ኢሜይልና የይለፍ ቃል በመጠቀም መለያዎን ያገናኙ።\nPlease link your website account first by typing your credentials.",
                {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "Account Link 🔑", callback_data: "start_login" }]
                        ]
                    }
                }
            );
        }
        return;
    }

    if (!ustaz) {
        await bot.sendMessage(chatId, "⚠️ እባክዎ በመጀመሪያ መለያዎን ያገናኙ። /start ን ይጫኑ።\nPlease link your account first. Press /start.");
        return;
    }

    // Handle logout button
    if (text === "Logout 🔓" || text.startsWith('/logout')) {
        ustaz.telegramChatId = undefined;
        await ustaz.save();
        await bot.sendMessage(chatId, "🔓 በተሳካ ሁኔታ ወጥተዋል። መለያዎ ተለያይቷል።\nSuccessfully logged out. Your account is unlinked.", {
            reply_markup: { remove_keyboard: true }
        });
        return;
    }

    // Handle profile button
    if (text === "My Profile 👤" || text.startsWith('/profile')) {
        await bot.sendMessage(
            chatId,
            `👤 **የኡስታዝ መረጃ / Profile Info**\n\n• **ስም / Name**: ${ustaz.name}\n• **ኢሜይል / Email**: ${ustaz.email}\n• **ስልክ / Phone**: ${ustaz.phone || 'N/A'}\n• **ትምህርት / Stream**: ${ustaz.stream.toUpperCase()} ${ustaz.kitabName ? `(${ustaz.kitabName})` : ''}`
        );
        return;
    }

    // Handle Interactive Grid & Poll Date Prompts
    if (text === "Interactive Grid (Chat) 💬" || text === "Native Poll (Pool) 🗳️") {
        const type = text === "Interactive Grid (Chat) 💬" ? "grid" : "poll";
        const dates = getValidDates(ustaz);
        const inlineKeyboard = dates.map(d => {
            const [y, m, dayNum] = d.split('-');
            const dateObj = new Date(y, m - 1, dayNum);
            const labelStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            return [{ text: labelStr, callback_data: `date_select:${type}:${d}` }];
        });

        await bot.sendMessage(
            chatId,
            `📅 እባክዎ የክትትል ቀኑን ይምረጡ፦\nPlease select the date for attendance:`,
            {
                reply_markup: {
                    inline_keyboard: inlineKeyboard
                }
            }
        );
        return;
    }
};

// ─── Callback Query Handler (Inline buttons) ──────────────────────────────────
const handleCallbackQuery = async (bot, query) => {
    const chatId = query.message.chat.id;
    const data   = query.data;

    await bot.answerCallbackQuery(query.id);

    if (data === "start_login") {
        userStates.set(chatId, { step: 'email' });
        await bot.sendMessage(chatId, "📧 እባክዎ የኢሜይል አድራሻዎን ያስገቡ፦\nPlease enter your email address:");
        return;
    }

    const ustaz = await User.findOne({ telegramChatId: chatId.toString() });
    if (!ustaz) return;

    // Handle Poll Excused toggle
    if (data.startsWith("poll_excused:")) {
        const [, dateStr, studentId] = data.split(":");
        const attendanceDate = new Date(dateStr);
        const startOfDay = new Date(attendanceDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(attendanceDate);
        endOfDay.setHours(23, 59, 59, 999);

        const record = await Attendance.findOne({
            student: studentId,
            ustaz: ustaz._id,
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        if (record) {
            record.status = "excused";
            await record.save();
        }

        const student = await Student.findById(studentId);
        const studentName = student ? student.fullName : "Student";
        
        // Parse message and change status representation
        const messageText = query.message.text;
        const lines = messageText.split("\n");
        const updatedLines = lines.map(line => {
            if (line.includes(studentName) && line.includes("🔴 Absent")) {
                return line.replace("🔴 Absent", "🟡 Excused");
            }
            return line;
        });

        // Remove the pressed button
        const currentMarkup = query.message.reply_markup;
        const updatedButtons = currentMarkup.inline_keyboard.filter(row => {
            const btn = row[0];
            return !btn.callback_data.includes(studentId);
        });

        await bot.editMessageText(updatedLines.join("\n"), {
            chat_id: chatId,
            message_id: query.message.message_id,
            reply_markup: updatedButtons.length > 0 ? { inline_keyboard: updatedButtons } : undefined
        });

        return;
    }

    // Date select handler
    if (data.startsWith("date_select:")) {
        const [, type, dateStr] = data.split(":");
        const students = await Student.find({ assignedUstaz: ustaz._id, status: 'active' }).sort({ fullName: 1 });

        if (students.length === 0) {
            await bot.sendMessage(chatId, "❌ ተማሪዎች አልተመደቡልዎትም።\nNo students assigned to you.");
            return;
        }

        // Fetch existing attendance records
        const startOfDay = new Date(dateStr);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dateStr);
        endOfDay.setHours(23, 59, 59, 999);

        const existingRecords = await Attendance.find({
            ustaz: ustaz._id,
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        if (type === "poll") {
            // NATIVE POLL FLOW
            // Clear existing attendance for date if they are overwriting (native polls overwrite on submit)
            const options = students.map((s, idx) => `${idx + 1}. ${s.fullName}`);
            // Native Poll options are capped at 10. If they have more, split them or warn them.
            if (options.length > 10) {
                await bot.sendMessage(chatId, `⚠️ ${options.length} students found. Telegram Native Polls are limited to 10 options max. Please use the "Interactive Grid" or the "Mini App" option instead.`);
                return;
            }

            const pollMsg = await bot.sendPoll(
                chatId,
                `Attendance for ${dateStr}: Select ABSENT students ❌ (Unselected will be Present)`,
                options,
                {
                    is_anonymous: false,
                    allows_multiple_answers: true
                }
            );

            // Store poll link
            activePolls.set(pollMsg.poll.id, {
                chatId,
                date: dateStr,
                students: students.map(s => ({ id: s._id.toString(), fullName: s.fullName }))
            });

        } else if (type === "grid") {
            // INTERACTIVE GRID FLOW
            // Map student default statuses
            const studentStates = students.map(s => {
                const record = existingRecords.find(r => r.student.toString() === s._id.toString());
                return {
                    id: s._id.toString(),
                    fullName: s.fullName,
                    surah: s.surah || "None",
                    status: record ? record.status : "present" // default to present
                };
            });

            // Set session state
            activeSessions.set(chatId, {
                date: dateStr,
                students: studentStates,
                messageId: null
            });

            await renderGridMessage(bot, chatId, dateStr, studentStates);
        }
        return;
    }

    // Toggle status handler in Interactive Grid
    if (data.startsWith("tg_toggle:")) {
        const [, indexStr] = data.split(":");
        const index = parseInt(indexStr, 10);
        const session = activeSessions.get(chatId);
        if (!session) return;

        // Toggle status: present -> absent -> excused -> present
        const current = session.students[index].status;
        let nextStatus = "present";
        if (current === "present") nextStatus = "absent";
        else if (current === "absent") nextStatus = "excused";

        session.students[index].status = nextStatus;
        activeSessions.set(chatId, session);

        await renderGridMessage(bot, chatId, session.date, session.students, query.message.message_id);
        return;
    }

    // Save Interactive Grid Attendance
    if (data === "save_grid_attendance") {
        const session = activeSessions.get(chatId);
        if (!session) return;

        const { date, students } = session;
        const attendanceDate = new Date(date);
        const startOfDay = new Date(attendanceDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(attendanceDate);
        endOfDay.setHours(23, 59, 59, 999);

        try {
            // Clean up existing records for this day (since we rewrite all)
            await Attendance.deleteMany({
                ustaz: ustaz._id,
                date: { $gte: startOfDay, $lte: endOfDay }
            });

            // Create new records
            const studentIds = [];
            for (const s of students) {
                await Attendance.create({
                    student: s.id,
                    ustaz: ustaz._id,
                    status: s.status,
                    date: attendanceDate
                });
                studentIds.push(s.id);
            }

            // Trigger background checks
            checkConsecutiveAbsences(studentIds).catch(err => console.error("Error in consecutive absences check:", err));

            activeSessions.delete(chatId);

            // Edit message to replace keyboard and summarize completion
            const summary = students.map((s, i) => `${i + 1}. ${s.fullName}: ${s.status === 'present' ? '🟢 Present' : s.status === 'absent' ? '🔴 Absent' : '🟡 Excused'}`).join('\n');
            await bot.editMessageText(
                `✅ ክትትል በተሳካ ሁኔታ ተቀምጧል! 💾\nAttendance saved successfully for ${date}!\n\n**ማጠቃለያ / Summary**:\n${summary}`,
                {
                    chat_id: chatId,
                    message_id: query.message.message_id,
                    parse_mode: 'Markdown'
                }
            );
        } catch (err) {
            console.error("Failed to save grid attendance:", err);
            await bot.sendMessage(chatId, "❌ ክትትል ማስቀመጥ አልተሳካም። እባክዎ እንደገና ይሞክሩ።\nFailed to save attendance. Please try again.");
        }
        return;
    }

    // Cancel Interactive Grid Attendance
    if (data === "cancel_grid") {
        activeSessions.delete(chatId);
        await bot.deleteMessage(chatId, query.message.message_id).catch(() => {});
        await bot.sendMessage(chatId, "❌ ተሰርዟል።\nCancelled.");
        return;
    }
};

// Helper: Render status toggle grid message
async function renderGridMessage(bot, chatId, date, students, messageId = null) {
    const statusIcons = { present: "🟢 Present", absent: "🔴 Absent", excused: "🟡 Excused" };
    
    // Build list text
    let text = `📅 **ቀን / Date**: ${date}\n\n**የተማሪዎች ዝርዝር / Student List**:\n`;
    students.forEach((s, idx) => {
        text += `${idx + 1}. ${s.fullName} - ${statusIcons[s.status]}\n`;
    });
    text += `\nሁኔታውን ለመቀየር ከተማሪው ስም በታች ያለውን ቁልፍ ይጫኑ (Present 🟢 ➔ Absent 🔴 ➔ Excused 🟡)፦\nTap a student's button to toggle status:`;

    // Build inline keyboard
    const inline_keyboard = [];
    for (let i = 0; i < students.length; i += 2) {
        const row = [];
        row.push({ text: `${i + 1}. ${students[i].fullName}`, callback_data: `tg_toggle:${i}` });
        if (i + 1 < students.length) {
            row.push({ text: `${i + 2}. ${students[i + 1].fullName}`, callback_data: `tg_toggle:${i + 1}` });
        }
        inline_keyboard.push(row);
    }
    
    // Add Save and Cancel Row
    inline_keyboard.push([
        { text: "💾 Save Attendance", callback_data: "save_grid_attendance" },
        { text: "❌ Cancel", callback_data: "cancel_grid" }
    ]);

    if (messageId) {
        await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard }
        });
    } else {
        await bot.sendMessage(chatId, text, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard }
        });
    }
}

// ─── Poll Answer Handler (Native Polls) ───────────────────────────────────────
const handlePollAnswer = async (bot, pollAnswer) => {
    const session = activePolls.get(pollAnswer.poll_id);
    if (!session) return;

    const { chatId, date, students } = session;
    const checkedOptionIds = pollAnswer.option_ids; // indices of selected options (absent students)

    const attendanceDate = new Date(date);
    const startOfDay = new Date(attendanceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);

    try {
        const ustaz = await User.findOne({ telegramChatId: chatId.toString() });
        if (!ustaz) return;

        // Clear existing records for this day
        await Attendance.deleteMany({
            ustaz: ustaz._id,
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        const studentIds = [];
        const summaryLines = [];

        const inlineKeyboard = [];

        // Save records: checked = 'absent', unchecked = 'present'
        for (let i = 0; i < students.length; i++) {
            const student = students[i];
            const isAbsent = checkedOptionIds.includes(i);
            const status = isAbsent ? 'absent' : 'present';

            await Attendance.create({
                student: student.id,
                ustaz: ustaz._id,
                status: status,
                date: attendanceDate
            });

            studentIds.push(student.id);
            summaryLines.push(`${i + 1}. ${student.fullName}: ${isAbsent ? '🔴 Absent' : '🟢 Present'}`);

            if (isAbsent) {
                inlineKeyboard.push([{
                    text: `🟡 Mark ${student.fullName} as Excused`,
                    callback_data: `poll_excused:${date}:${student.id}`
                }]);
            }
        }

        // Trigger background checks
        checkConsecutiveAbsences(studentIds).catch(err => console.error("Error in consecutive absences check:", err));
        
        activePolls.delete(pollAnswer.poll_id);

        const options = inlineKeyboard.length > 0 ? { reply_markup: { inline_keyboard: inlineKeyboard } } : {};

        await bot.sendMessage(
            chatId,
            `✅ የቮት ክትትል በተሳካ ሁኔታ ተቀምጧል! 🗳️\nPoll attendance saved successfully for ${date}!\n\n**ማጠቃለያ / Summary**:\n${summaryLines.join('\n')}`,
            options
        );

    } catch (err) {
        console.error("Failed to save poll attendance:", err);
        await bot.sendMessage(chatId, "❌ በፖል በኩል ክትትል ማስቀመጥ አልተሳካም።\nFailed to save poll attendance.");
    }
};

// ─── Bot Initialization ───────────────────────────────────────────────────────
export function initUstazBot() {
    if (!token || token === 'your_ustaz_bot_token_here') {
        console.warn('⚠️  USTAZ_BOT_TOKEN is not set. Ustaz Telegram Bot will not start.');
        return null;
    }

    const renderUrl = process.env.RENDER_EXTERNAL_URL;

    if (renderUrl) {
        // Webhook Mode (Production)
        const bot         = new TelegramBot(token, { webHook: false });
        const webhookPath = `/ustazbot${token}`;
        const webhookUrl  = `${renderUrl}${webhookPath}`;

        const webhookHandler = (req, res) => {
            bot.processUpdate(req.body);
            res.sendStatus(200);
        };

        const registerWebhook = async (attempt = 1) => {
            try {
                await bot.setWebHook(webhookUrl);
                console.log(`✅ Ustaz Telegram webhook registered: ${webhookUrl}`);
            } catch (err) {
                console.error(`❌ Ustaz Webhook registration failed (attempt ${attempt}):`, err.message);
                if (attempt < 5) setTimeout(() => registerWebhook(attempt + 1), attempt * 5000);
            }
        };
        registerWebhook();

        bot.on('message', (msg) => handleMessage(bot, msg));
        bot.on('callback_query', (query) => handleCallbackQuery(bot, query));
        bot.on('poll_answer', (answer) => handlePollAnswer(bot, answer));
        console.log('✅ Ustaz Telegram Bot started in WEBHOOK mode.');

        return { webhookPath, webhookHandler };
    } else {
        // Polling Mode (Local Dev)
        const bot = new TelegramBot(token, { polling: true });
        bot.on('polling_error', (err) => console.error('Ustaz Telegram polling error:', err.message));
        bot.on('message', (msg) => handleMessage(bot, msg));
        bot.on('callback_query', (query) => handleCallbackQuery(bot, query));
        bot.on('poll_answer', (answer) => handlePollAnswer(bot, answer));
        console.log('✅ Ustaz Telegram Bot started in POLLING mode (local dev).');
        return null;
    }
}

export default null;
