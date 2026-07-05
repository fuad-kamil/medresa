import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Attendance from './models/Attendance.js';
import Student from './models/Student.js';
import User from './models/User.js';
import sendEmail from './utils/sendEmail.js';
import buildAbsenceEmail from './utils/absenceEmailTemplate.js';
import Notification from './models/Notification.js';

dotenv.config();

async function checkConsecutiveAbsences(studentIds) {
    for (const studentId of studentIds) {
        try {
            console.log(`Checking student: ${studentId}`);
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

            console.log(`Unique days found: ${uniqueDays.length}`);
            if (uniqueDays.length === 3) {
                console.log(`Statuses: ${uniqueDays.map(r => r.status).join(', ')}`);
            }

            if (
                uniqueDays.length === 3 &&
                uniqueDays.every(att => att.status === 'absent')
            ) {
                const student = await Student.findById(studentId).populate(
                    'assignedUstaz'
                );

                if (!student) {
                    console.log('Student not found in DB');
                    continue;
                }

                const ustazName = student.assignedUstaz ? student.assignedUstaz.name : "Unassigned";

                const recipient = process.env.ALERT_EMAIL_RECIPIENT || process.env.EMAIL_USER;
                console.log(`Will send email to: ${recipient}`);
                const emailContent = buildAbsenceEmail(student, ustazName);

                const result = await sendEmail({
                    to: recipient,
                    subject: emailContent.subject,
                    text: emailContent.text,
                    html: emailContent.html,
                });
                
                console.log("Email sent successfully!");

                // Create in-app notification
                try {
                    const recent = await Notification.findOne({
                        studentId: student._id,
                        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                    });
                    if (!recent) {
                        await Notification.create({
                            studentId: student._id,
                            studentName: student.fullName,
                            ustazId: student.assignedUstaz ? student.assignedUstaz._id : null,
                            ustazName,
                            message: `ተማሪ ${student.fullName} ከኡስታዝ ${ustazName} ትምህርት 3 ተከታታይ ቀናት ቀርቷል።`
                        });
                        console.log("Notification created successfully!");
                    } else {
                        console.log("Notification already exists for today, skipping duplicate.");
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

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Find Jemil Seman
    const student = await Student.findOne({ fullName: /Jemil Seman/i });
    if (!student) {
        console.log("Student Jemil Seman not found");
        process.exit(1);
    }
    
    await checkConsecutiveAbsences([student._id.toString()]);
    
    process.exit(0);
}

run();
