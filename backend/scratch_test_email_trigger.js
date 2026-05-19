import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Attendance from './models/Attendance.js';
import Student from './models/Student.js';
import User from './models/User.js';
import sendEmail from './utils/sendEmail.js';

dotenv.config();

const checkConsecutiveAbsences = async (studentIds) => {
    for (const studentId of studentIds) {
        try {
            console.log(`Checking student: ${studentId}`);
            const recent = await Attendance.find({ student: studentId })
                .sort({ date: -1 })
                .limit(3)

            console.log(`Found ${recent.length} recent records:`, recent.map(r => ({ date: r.date, status: r.status })));

            if (
                recent.length === 3 &&
                recent.every(att => att.status === 'absent')
            ) {
                console.log(`Condition met for ${studentId}. Loading student info...`);
                const student = await Student.findById(studentId).populate(
                    'assignedUstaz'
                )

                if (!student) {
                    console.log(`Student ${studentId} not found in DB!`);
                    continue;
                }

                console.log(`Student loaded: ${student.fullName}. Assigned Ustaz:`, student.assignedUstaz);

                const ustazName = student.assignedUstaz ? student.assignedUstaz.name : "Unassigned";

                console.log(`Sending alert email for ${student.fullName} to ${process.env.EMAIL_USER}...`);
                const emailResult = await sendEmail({
                    to: process.env.EMAIL_USER,
                    subject: `⚠️ Alert: 3 Consecutive Absences - ${student.fullName}`,
                    text: `Student ${student.fullName} has missed 3 or more consecutive classes from Ustaz ${ustazName}. Please call Father at ${student.fatherPhone} or Mother at ${student.motherPhone} to ask the reason.`,
                    html: `
              <h3>3 Consecutive Absences Alert</h3>
              <p>Student <strong>${student.fullName}</strong> has missed 3 or more consecutive classes from Ustaz <strong>${ustazName}</strong>.</p>
              <p>Please call them to ask the reason:</p>
              <ul>
                <li><strong>Father:</strong> ${student.fatherPhone}</li>
                <li><strong>Mother:</strong> ${student.motherPhone}</li>
              </ul>
            `
                });
                console.log(`Email result:`, emailResult ? "SUCCESS" : "FAILURE");
            } else {
                console.log(`Condition NOT met for ${studentId}.`);
            }
        } catch (err) {
            console.error(`Error in checkConsecutiveAbsences for student ${studentId}:`, err);
        }
    }
}

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const student = await Student.findOne({ fullName: 'Fuad Kamil' });
        if (!student) {
            console.log("Amir Mohammed not found");
            return;
        }
        await checkConsecutiveAbsences([student._id.toString()]);
        mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

runTest();
